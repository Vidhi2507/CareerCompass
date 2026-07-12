
from fastapi import HTTPException
from fastapi import FastAPI 
from fastapi.middleware.cors import CORSMiddleware
from pymongo.mongo_client import MongoClient

# Vidya part
from fastapi import File, UploadFile
import PyPDF2
import io
from agents import parse_resume_to_json

from typing import Annotated
from classes import User,UserCareerInfo,Roadmapstate
from helperfunctions import create_access_token

import os
from dotenv import load_dotenv
load_dotenv()


##Agents
from langgraph.graph import StateGraph, MessagesState, START, END
from agents import Skill_Gap_Analysis, Suggest_Target_Roles, Required_Skills, normalize_userandReq_skill, roadmap_generation_agent, question_generation

## connect to MongoDB
uri = os.getenv("DATABASE_URL")
client = MongoClient(uri)
db = client["CareerCompass_db"]
Users = db["Users"]
UserCareerDetails = db["User_Career_details"]


app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173","https://careercompass-frontend-penn.onrender.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return {"message": "Welcome"}

@app.post("/login")
def login(user: User):
    user_data = Users.find_one({"email": user.email})

    if user_data and user_data["password"] == user.password:  
        #valid user
        token = create_access_token({"sub": user_data["username"]})
        return {"token": token, "username": user_data["username"]} 

    raise HTTPException(status_code=400, detail="Invalid email or password")



@app.post("/register")
def register(user: User):   ## hashing of password will be done later
    if Users.find_one({"email": user.email}):
        raise HTTPException(status_code=400, detail="Email already exists")
    if Users.find_one({"username": user.username}):
        raise HTTPException(status_code=400, detail="Username already exists")

    # print(user.dict())
    Users.insert_one(user.dict())

    return {"message": "User registered successfully", "username": user.username}


@app.post("/manual-entry/roadmap")
def manual_entry(Userdata: UserCareerInfo):
    # Process the manual entry data and save it to the database
    if UserCareerDetails.find_one({"username": Userdata.username}):
        UserCareerDetails.update_one(
            {"username": Userdata.username}, 
            {
                "$set": Userdata.dict(),
                "$unset": {"Roadmap": ""}
            }
        )
    else:
        UserCareerDetails.insert_one(Userdata.dict())
    return {"message": "Manual entry data received successfully", "data": Userdata}


# for update profile -- to get already existing data
@app.get("/user-career-details/{username}")
def get_user_career_details(username: str):
    user_data = UserCareerDetails.find_one({"username": username})
    if not user_data:
        raise HTTPException(status_code=404, detail="User career details not found")
    user_data.pop("_id", None)
    return user_data


@app.get("/roadmap/{username}")
def roadmap_generation(username: str):
    user_career_data = UserCareerDetails.find_one({"username": username})
    if not user_career_data:
        raise HTTPException(status_code=404, detail="User career data not found")

    if "Roadmap" in user_career_data:
        return {"message": "Roadmap already exists", "data": user_career_data["Roadmap"]}
    
    # user_data = UserCareerDetails.find_one({"username": "Vidhi"})
    roadmap_state: Roadmapstate = {
    "TargetRoles": [],
    "RequiredSkills": {}
    }
    Roadmap_state = {**roadmap_state, **user_career_data}
    Roadmap_state.pop("_id") 

    graph = StateGraph(Roadmapstate)

    graph.add_node("Suggest_Target_Roles", Suggest_Target_Roles)
    graph.add_node("Required_Skills", Required_Skills)
    graph.add_node("normalize_skill", normalize_userandReq_skill) #ATP- zeroth index: Human in the loop for asking user to choose target role from suggested roles 
    graph.add_node("Skill_Gap_Analysis", Skill_Gap_Analysis)
    graph.add_node("Roadmap_Generation", roadmap_generation_agent)

    graph.add_edge(START, "Suggest_Target_Roles") 
    graph.add_edge("Suggest_Target_Roles", "Required_Skills")
    graph.add_edge("Required_Skills", "normalize_skill")
    graph.add_edge("normalize_skill", "Skill_Gap_Analysis")
    graph.add_edge("Skill_Gap_Analysis", "Roadmap_Generation")
    graph.add_edge("Roadmap_Generation", END)

    graph = graph.compile()
    Roadmap = graph.invoke(Roadmap_state)

    roadmap_data = Roadmap["Roadmap"].model_dump()

    #adding roadmap to database
    UserCareerDetails.update_one({"username": username}, {"$set": {"Roadmap": roadmap_data}})

    return {"message": "Roadmap Generated successfully", "data": roadmap_data}

@app.get("/skilltest/{username}/{skill}")
def Skill_Test(username: str, skill: str):
    User_data = UserCareerDetails.find_one({"username": username})
    if not User_data:
        raise HTTPException(status_code=404, detail="User career data not found")
    
    #get the proficiency level of the skill for the user
    proficiency = None
    for s in User_data["skills"]:
        if s["skill"] == skill:
            proficiency = s["proficiency"]
            break
    print(proficiency)

    questions = question_generation(skill,proficiency,User_data["Roadmap"]["role"])
    return {"message": "Skill test generated successfully", "data": questions}

@app.post("/update-skill-assessment") 
def update_skill_assessment(username: str, skill_name: str, score_out_of_5: int):
    # 1. Update the user's proficiency in MongoDB
    user_data = UserCareerDetails.find_one({"username": username})
    if not user_data:
        raise HTTPException(status_code=404, detail="User not found")

    updated_skills = user_data.get("skills", [])
    found = False
    for s in updated_skills:
        if s["skill"] == skill_name:
            s["proficiency"] = score_out_of_5
            found = True
            break
    
    if not found:
        updated_skills.append({"skill": skill_name, "proficiency": score_out_of_5})

    UserCareerDetails.update_one(
        {"username": username}, 
        {"$set": {"skills": updated_skills}}
    )
    return {"message": "Skill updated", "score": score_out_of_5}

@app.get("/user-skills/{username}")
def get_user_skills(username: str):
    user_data = UserCareerDetails.find_one({"username": username}, {"skills": 1})
    if not user_data:
        return {"skills": []}
    return {"skills": user_data.get("skills", [])}


# Add this endpoint
@app.post("/upload-resume/{username}")
async def upload_resume(username: str, file: UploadFile = File(...)):
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")

    # 1. Extract Text from PDF
    try:
        content = await file.read()
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(content))
        resume_text = ""
        for page in pdf_reader.pages:
            resume_text += page.extract_text()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read PDF: {str(e)}")

    # 2. Parse text to structured UserCareerInfo
    parsed_info = parse_resume_to_json(resume_text)

    career_data = parsed_info.dict()
    career_data["username"] = username

    # 3. Save to MongoDB (Same logic as manual_entry)
    UserCareerDetails.update_one(
        {"username": username}, 
        {"$set": parsed_info.model_dump(exclude_unset=True)}, 
        upsert=True
    )

    # 4. Trigger Roadmap Generation logic (Reuse your existing graph logic)
    # This ensures the resume flow ends with a roadmap in the DB just like manual entry
    return {"message": "Resume analyzed and roadmap pending", "username": username}

@app.get("/interview/{username}/{skill}")
def get_interview_questions(username: str, skill: str):
    # Implementation for fetching interview questions
    pass