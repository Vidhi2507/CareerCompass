from http.client import HTTPException
from fastapi import FastAPI 
from fastapi.middleware.cors import CORSMiddleware
from pymongo.mongo_client import MongoClient

from classes import User
from helperfunctions import create_access_token
import os
from dotenv import load_dotenv

## connect to MongoDB
uri = os.getenv("DATABASE_URL")
client = MongoClient(uri)
db = client["CareerCompass_db"]
collection = db["Users"]

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
    user_data = collection.find_one({"email": user.email})

    if user_data and user_data["password"] == user.password:  
        #valid user
        token = create_access_token({"sub": user_data["username"]})
        return {"token": token, "username": user_data["username"]} 

    raise HTTPException(status_code=400, detail="Invalid email or password")



@app.post("/register")
def register(user: User):   ## hashing of password will be done later
    if collection.find_one({"email": user.email}):
        raise HTTPException(status_code=400, detail="Email already exists")
    
    # print(user.dict())
    collection.insert_one(user.dict())

    return {"message": "User registered successfully", "username": user.username}


@app.post("/manual-entry/roadmap")
def manual_entry(formData: dict):
    # Process the manual entry data and save it to the database
    return {"message": "Manual entry data received successfully", "data": formData}
