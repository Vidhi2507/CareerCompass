from pymongo import MongoClient
from bson import json_util
import json
import os
from dotenv import load_dotenv
load_dotenv()


uri = os.getenv("DATABASE_URL")
client = MongoClient(uri)

db = client["CareerCompass_db"]
UserCareerDetails = db["User_Career_details"]


with open("data/user_career_details.json", "w") as f:
    json.dump(list(UserCareerDetails.find()), f, default=json_util.default, indent=2)