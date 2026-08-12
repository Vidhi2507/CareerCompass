from fastapi import HTTPException
from fastapi import FastAPI 
from fastapi.middleware.cors import CORSMiddleware
from pymongo.mongo_client import MongoClient
from pydantic import BaseModel

# Vidya part
from fastapi import File, UploadFile
import PyPDF2
import io

from typing import Annotated
from classes import InterviewerState, User,UserCareerInfo,Roadmapstate, AnswerRequest
from helperfunctions import create_access_token

import os
from dotenv import load_dotenv
load_dotenv()


##Agents
from langgraph.graph import StateGraph, MessagesState, START, END
from agents import Skill_Gap_Analysis, Suggest_Target_Roles, Required_Skills, normalize_userandReq_skill, roadmap_generation_agent, question_generation,get_interview_relevant_topics, parse_resume_to_json, generate_interview_plan_api, evaluate_user_answer_api, evaluate_agent_performance_api, store_user_profile_in_qdrant, rag_chat_response

## connect to MongoDB
uri = os.getenv("DATABASE_URL")
client = MongoClient(uri)
db = client["CareerCompass_db"]
Users = db["Users"]
UserCareerDetails = db["User_Career_details"]
Interviews = db["Interviews"]


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

    # Store user profile in Qdrant for CompassAI RAG
    try:
        full_user_data = UserCareerDetails.find_one({"username": username})
        if full_user_data:
            full_user_data.pop("_id", None)
            store_user_profile_in_qdrant(full_user_data, roadmap_data)
    except Exception as e:
        print(f"[CompassAI] Warning: could not store profile in Qdrant: {e}")

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


# --- CompassAI RAG Chat ---
class ChatRequest(BaseModel):
    query: str

@app.post("/chat/{username}")
def compass_ai_chat(username: str, req: ChatRequest):
    """RAG-powered career guidance chat endpoint for CompassAI."""
    user_data = UserCareerDetails.find_one({"username": username})
    if not user_data:
        raise HTTPException(status_code=404, detail="User not found. Please complete your profile first.")
    
    # If profile not yet in Qdrant, store it on-demand
    roadmap = user_data.get("Roadmap")
    if roadmap:
        try:
            user_data.pop("_id", None)
            store_user_profile_in_qdrant(user_data, roadmap)
        except Exception:
            pass  # Don't fail the chat if Qdrant upsert fails
    
    try:
        response = rag_chat_response(username=username, query=req.query)
        return {"response": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"CompassAI error: {str(e)}")


# Vidya ---> 
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

    career_data = parsed_info.model_dump(exclude_unset=True)
    career_data["username"] = username

    # 3. Save to MongoDB (Same logic as manual_entry)
    if UserCareerDetails.find_one({"username": username}):
        UserCareerDetails.update_one(
            {"username": username}, 
            {
                "$set": career_data,
                "$unset": {"Roadmap": ""}
            }
        )
    else:
        UserCareerDetails.insert_one(career_data)

    # 4. Trigger Roadmap Generation logic (Reuse your existing graph logic)
    # This ensures the resume flow ends with a roadmap in the DB just like manual entry
    return {"message": "Career Details stored ", "username": username}

@app.post("/interview/start/{username}")
def start_interview(username: str):
    user_data = UserCareerDetails.find_one({"username": username})
    if not user_data:
        raise HTTPException(status_code=404, detail="User career data not found")
    
    target_role = user_data.get("Roadmap", {}).get("role")
    if not target_role:
        raise HTTPException(status_code=404, detail="Target role not found. Please generate a roadmap first.")
    
    user_skills = user_data.get("skills", [])
    user_skill_names = [s["skill"] for s in user_skills]

    state = {
        "role": target_role,
        "skills": user_skill_names,
        "education": user_data.get("education", []),
        "experience": user_data.get("experience", [])
    }
    
    topics_res = get_interview_relevant_topics(state)
    plan = generate_interview_plan_api(target_role, user_skill_names, topics_res["topics"])
    
    interview_doc = {
        "username": username,
        "role": target_role,
        "plan": plan["questions"],
        "current_index": 0,
        "history": [],
        "is_completed": False,
        "pending_follow_up": None
    }
    
    # Store in DB, replace existing if there is an active one or just overwrite
    Interviews.update_one({"username": username}, {"$set": interview_doc}, upsert=True)
    
    return {
        "message": "Interview started",
        "question": plan["questions"][0]["question"],
        "total_questions": len(plan["questions"]),
        "current_index": 0
    }

@app.post("/interview/answer/{username}")
def answer_interview(username: str, req: AnswerRequest):
    interview = Interviews.find_one({"username": username})
    if not interview or interview.get("is_completed"):
        raise HTTPException(status_code=400, detail="No active interview found for user.")
    
    current_index = interview["current_index"]
    plan = interview["plan"]
    
    if current_index >= len(plan):
        raise HTTPException(status_code=400, detail="Interview already finished.")
        
    current_q_base = plan[current_index]
    pending_follow_up = interview.get("pending_follow_up")
    
    # Determine the actual question being answered
    if pending_follow_up:
        current_q_text = pending_follow_up
        # if it's a follow-up, it's still related to the same topic
        expected_key_points = current_q_base["expected_key_points"] 
    else:
        current_q_text = current_q_base["question"]
        expected_key_points = current_q_base["expected_key_points"]
    
    # 1. Evaluate User Answer
    eval_result = evaluate_user_answer_api(current_q_text, expected_key_points, req.answer)
    
    # Prevent infinite follow-ups: if we were already answering a follow-up, don't ask another one for this topic
    if pending_follow_up:
        eval_result["follow_up_required"] = False
        eval_result["follow_up_question"] = None

    # 2. Meta LLM Evaluation of the Agent
    agent_eval = evaluate_agent_performance_api(
        question=current_q_text,
        user_answer=req.answer,
        agent_feedback=eval_result["feedback"],
        agent_follow_up=eval_result.get("follow_up_question")
    )
    
    # Save to history
    history_entry = {
        "question": current_q_text,
        "answer": req.answer,
        "score": eval_result["score"],
        "feedback": eval_result["feedback"],
        "agent_evaluation": agent_eval
    }
    
    # Update state variables
    next_question = None
    is_completed = False
    
    if eval_result.get("follow_up_required") and eval_result.get("follow_up_question"):
        # Set the follow up and DO NOT increment index
        Interviews.update_one(
            {"username": username}, 
            {
                "$push": {"history": history_entry}, 
                "$set": {"pending_follow_up": eval_result["follow_up_question"]}
            }
        )
        next_question = eval_result["follow_up_question"]
        next_index = current_index
    else:
        # Move to next topic question
        Interviews.update_one(
            {"username": username}, 
            {
                "$push": {"history": history_entry}, 
                "$inc": {"current_index": 1},
                "$set": {"pending_follow_up": None}
            }
        )
        next_index = current_index + 1
        if next_index >= len(plan):
            is_completed = True
            Interviews.update_one({"username": username}, {"$set": {"is_completed": True}})
        else:
            next_question = plan[next_index]["question"]
    
    total_questions = len(plan)
    
    if is_completed:
        return {
            "evaluation": eval_result,
            "next_question": None,
            "is_completed": True,
            "current_question_number": next_index,
            "total_questions": total_questions,
            "message": "Interview completed! Please end the interview to get your final report."
        }
    else:
        return {
            "evaluation": eval_result,
            "next_question": next_question,
            "is_completed": False,
            "current_question_number": next_index + 1 if not eval_result.get("follow_up_required") else next_index,
            "total_questions": total_questions
        }

@app.post("/interview/end/{username}")
def end_interview(username: str):
    interview = Interviews.find_one({"username": username})
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")
        
    history = interview.get("history", [])
    if not history:
        return {"report": "No questions were answered."}
        
    avg_score = sum(h["score"] for h in history) / len(history)
    
    return {
        "message": "Interview finalized",
        "total_questions": len(interview["plan"]),
        "answered": len(history),
        "average_score": avg_score,
        "history": history
    }
