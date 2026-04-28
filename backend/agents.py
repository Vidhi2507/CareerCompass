from langchain_google_genai import ChatGoogleGenerativeAI
from dotenv import load_env
import os
from pydantic import BaseModel
from typing import Annotated,Field
from classes import TargetRoles



load_dotenv() 

api_key = os.getenv("API_KEY")

chatmodel = ChatGoogleGenerativeAI(
    api_key=os.getenv("GEMINI"),
    model="gemini-2.5-flash-lite",   # fast + cheap
    temperature=0
)
targetrole_model = chatmodel.with_structured_output(TargetRoles)

def Suggest_Target_Roles(state):
    prompt = f"Suggest 3 roles which a career Guide will suggest to a person Interested in {state['interest']} \
    have educational background like {state['education']} and experience in {state['experience']}"

    response = targetrole_model.invoke(prompt)

    return {'Target_Roles' : response.Roles}




