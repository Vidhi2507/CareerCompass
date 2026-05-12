from langchain_google_genai import ChatGoogleGenerativeAI
from dotenv import load_dotenv 
import os
from pydantic import BaseModel,Field
from typing import Annotated
from classes import TargetRoles, RequiredSkills,RoadmapLLMStructuredOutput,QuestionStructuredOutput
from sentence_transformers import SentenceTransformer
from qdrant_client import QdrantClient
from helperfunctions import normalize_skill
# from langgraph.graph import interrupt
from classes import UserCareerInfo

load_dotenv() 

api_key = os.getenv("API_KEY")

chatmodel = ChatGoogleGenerativeAI(
    api_key=os.getenv("GEMINI"),
    model="gemini-2.5-flash-lite", 
    temperature=0
)
targetrole_model = chatmodel.with_structured_output(TargetRoles)
embeddingmodel = SentenceTransformer("all-MiniLM-L6-v2")
Roadmap_model = chatmodel.with_structured_output(RoadmapLLMStructuredOutput)
question_model = chatmodel.with_structured_output(QuestionStructuredOutput)


qdrant_client = QdrantClient(
    url=os.getenv("QDRANT_URL"),
    api_key=os.getenv("QDRANT_KEY")
)


resume_parser_model = chatmodel.with_structured_output(UserCareerInfo)

def parse_resume_to_json(resume_text: str):
    prompt = f"""
    Extract professional and educational information from the following resume text.
    
    RESUME TEXT:
    {resume_text}
    RULES:
    1. If a section is missing, return an empty list or null.
    2. Ensure 'years_experience' is an integer.
    3. Return structured data exactly matching the UserCareerInfo schema.
    4. e.g., skills to be in dict with key 'skill' and 'proficiency' (0-5 scale).
    5. If skill proficiency cannot be determined, set it to 2.
    """
    return resume_parser_model.invoke(prompt)

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



def roadmap_generation_agent(state):
    Target_role = state['TargetRoles']
    mastered_skills = state['masteredSkills']
    missing_skills = state['missingSkills']
    to_be_improved = state['to_be_improved_skills']


    prompt_for_roadmap = f"""
    You are a career coach AI.

        Generate a highly personalized roadmap for the target role: {Target_role[0]}.

            USER PROFILE:
                - Current Role: {state['currentRole']}
                - Experience Years: {state['years_experience']}
                - Education: {state['education']}
                - Work Experience: {state['experience']}

            SKILL ANALYSIS (out of 5):
                - Mastered Skills: {mastered_skills}
                - Missing Skills: {missing_skills}
                - Skills to Improve: {to_be_improved}

            READINESS SCORE:
                - Current Readiness Score: {state['readinessScore']} (DO NOT CHANGE THIS SCORE)

            REQUIREMENTS:
                1. Roadmap must be divided into phases (Beginner → Intermediate → Advanced → Job Ready).
                2. Each phase must have:
                - duration_days
                - skills_to_focus and tasks to learn that skill (step-by-step) and recommended resources
                - one mini project + one major project
                3. Include interview preparation tasks in the final phase.
                4. Ensure prerequisites are respected (example: ML before DL, DL before NLP transformers).
                """
    roadmap = Roadmap_model.invoke(prompt_for_roadmap)
    return {"Roadmap": roadmap}

def question_generation(skill,proficiency,role):
    prompt = f"Generate 5 MCQ questions of Interview relevant concept for the Role of {role} with strictly proficiency level {proficiency} for the skill {skill} with 4 options and also the correct answer (proficiency level 1 is basic and 5 is advanced) "
    Questions = question_model.invoke(prompt)
    return Questions