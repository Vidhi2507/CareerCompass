
from fastapi import HTTPException
from fastapi import FastAPI 
from fastapi.middleware.cors import CORSMiddleware
from pymongo.mongo_client import MongoClient
import pandas as pd

from classes import User,UserCareerInfo
from helperfunctions import create_access_token
import os
from dotenv import load_dotenv
load_dotenv()

## connect to MongoDB
uri = os.getenv("DATABASE_URL")
client = MongoClient(uri)
db = client["CareerCompass_db"]
Users = db["Users"]
UserCareerDetails = db["User_Career_details"]

## FastAPI code
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
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
    UserCareerDetails.insert_one(Userdata.dict())
    return {"message": "Manual entry data received successfully", "data": Userdata}

def roadmap_generation(username: str):
    user_career_data = UserCareerDetails.find_one({"username": username})
    if not user_career_data:
        raise HTTPException(status_code=404, detail="User career data not found")
    
    