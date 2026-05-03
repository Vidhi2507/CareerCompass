from langchain_google_genai import ChatGoogleGenerativeAI
from dotenv import load_dotenv 
import os
from pydantic import BaseModel,Field
from typing import Annotated
from classes import TargetRoles, RequiredSkills
from sentence_transformers import SentenceTransformer
from qdrant_client import QdrantClient
from helperfunctions import normalize_skill
# from langgraph.graph import interrupt

load_dotenv() 

api_key = os.getenv("API_KEY")

chatmodel = ChatGoogleGenerativeAI(
    api_key=os.getenv("GEMINI"),
    model="gemini-2.5-flash-lite",   # fast + cheap
    temperature=0
)
targetrole_model = chatmodel.with_structured_output(TargetRoles)
embeddingmodel = SentenceTransformer("all-MiniLM-L6-v2")


qdrant_client = QdrantClient(
    url=os.getenv("QDRANT_URL"),
    api_key=os.getenv("QDRANT_KEY")
)


def Suggest_Target_Roles(state):
    prompt = f"Suggest 3 roles in a list which a career Guide will suggest to a person Interested in  \
    have educational background like {state['education']} and experience in {state['experience']}"
    response = targetrole_model.invoke(prompt)
    return {"TargetRoles" : response.Roles}

def Required_Skills(state):
    Target_role = state['TargetRoles']
    prompt = f"""
    You are an expert career coach and hiring manager.

        TASK:
        Generate a list of EXACTLY 10 highly important technical skills required for each target role.

        TARGET ROLES:
        1. {Target_role[0]}
        2. {Target_role[1]}
        3. {Target_role[2]}

        USER CONTEXT:
        - Current Role: {state["currentRole"]}
        - Education: {state["education"]}
        - Experience: {state["experience"]}

        OUTPUT FORMAT (STRICT):
        Return a JSON dictionary where:
        - key = role name
        - value = list of exactly 10 dictionaries
        - each dictionary must have ONLY ONE skill and its required proficiency level (0 to 5)

        Example:
        {{
        "{Target_role[0]}": [
            {{"Python": 5}},
            {{"SQL": 4}}
        ],
        "{Target_role[1]}": [
            {{"MLOps": 4}}
        ]
        }}

        RULES:
        - Skills must be resume/job-description skills only.
        - Skills must be mostly technical and learnable (no vague soft skills).
        - Order skills from beginner → advanced for each role.
        - Required proficiency must be integer 0 to 5.
        - Include modern industry-demand skills relevant in 2025.
        - Avoid duplicates and avoid generic phrases like "problem solving".
        - Do NOT include explanations, only output JSON.
        """

    structured_model = chatmodel.with_structured_output(RequiredSkills)
    skill_list = structured_model.invoke(prompt)
    return {"RequiredSkills" : skill_list.Skills}


def normalize_userandReq_skill(state):
    Required_Skills_dict = state["RequiredSkills"]
    normalized_req_skills = {}

    for role, skill_list in Required_Skills_dict.items():
        normalized_req_skills[role] = []

        for skill_dict in skill_list:   
            new_dict = {}

            for skill_name, level in skill_dict.items():
                mapped_skill = normalize_skill(embeddingmodel, qdrant_client, skill_name)
                new_dict[mapped_skill] = level

            normalized_req_skills[role].append(new_dict)

    user_skills = state["skills"]
    # user_skills= {'skill': 'Python', 'proficiency': 5}
    #convert user skills to same format as required skills
    user_skill_dicts = [{skill['skill']: skill['proficiency']} for skill in user_skills]

    normalized_user_skills = {}
    for skill_dict in user_skill_dicts:
        for skill_name, level in skill_dict.items():
            mapped_skill = normalize_skill(embeddingmodel, qdrant_client, skill_name)
            normalized_user_skills[mapped_skill] = level    
    


    return {"RequiredSkills": normalized_req_skills, "skills": normalized_user_skills}

def Skill_Gap_Analysis(state):
    # decison = interrupt(f"choose one of the target roles for gap analysis: {state['TargetRoles']}")
    # Target_role_index = state["TargetRoles"].index(decison)
    user_skills = state["skills"]  # dict of skill: proficiency
    role = list(state["RequiredSkills"].keys())[0]   # Data Scientist
    req_skills_list = state["RequiredSkills"][role]  # list of dicts
    req_skills = {}
    for d in req_skills_list:
        req_skills.update(d)

    missing_skills = []
    mastered_skills = []
    to_be_improved = []
    total_gap = 0
    req_score = 0

    for skill, req_level in req_skills.items():
        user_level = user_skills.get(skill, 0)
        gap = max(0, req_level - user_level)

        if user_level == 0:
            missing_skills.append({"skill": skill,"required": req_level})

        elif gap == 0:
            mastered_skills.append({"skill": skill,"current": user_level})

        else:
            to_be_improved.append({"skill": skill,"current": user_level,"required": req_level,"gap": gap})
    
        req_score+=req_level
        total_gap+=gap

    final_readiness_score = int(((req_score - total_gap) / req_score) * 100)

    return {
        "missingSkills": missing_skills,
        "masteredSkills": mastered_skills,
        "to_be_improved_skills": to_be_improved,
        "readinessScore": final_readiness_score
    }



