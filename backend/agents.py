# from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_groq import ChatGroq
from dotenv import load_dotenv 
import os
from pydantic import BaseModel,Field
from typing import Annotated
from classes import TargetRoles, RequiredSkills,RoadmapLLMStructuredOutput,QuestionStructuredOutput,TopicStructuredOutput, InterviewPlanOutput, AnswerEvaluation, AgentEvaluation
from google import genai
from google.genai import types

from qdrant_client import QdrantClient
from helperfunctions import normalize_skill
from classes import UserCareerInfo

load_dotenv() 

api_key = os.getenv("API_KEY")
secret = os.getenv("GROQ_KEY")

chatmodel = ChatGroq(
    model="llama-3.3-70b-versatile",
    api_key=secret,
    temperature=0.2
)

resume_parser_model = chatmodel.with_structured_output(UserCareerInfo)
targetrole_model = chatmodel.with_structured_output(TargetRoles)
requiredSkills_model = chatmodel.with_structured_output(RequiredSkills)
Roadmap_model = chatmodel.with_structured_output(RoadmapLLMStructuredOutput)
question_model = chatmodel.with_structured_output(QuestionStructuredOutput)
topic_model = chatmodel.with_structured_output(TopicStructuredOutput)
interview_plan_model = chatmodel.with_structured_output(InterviewPlanOutput)
evaluation_model = chatmodel.with_structured_output(AnswerEvaluation)
agent_eval_model = chatmodel.with_structured_output(AgentEvaluation)

embedding_client = genai.Client(api_key=os.getenv("EMBEDDING_KEY"))

qdrant_client = QdrantClient(
    url=os.getenv("QDRANT_URL"),
    api_key=os.getenv("QDRANT_KEY")
)

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
    6. Interests should be a list of strings. if not found, return an empty list.
    """
    return resume_parser_model.invoke(prompt)

def Suggest_Target_Roles(state):
    prompt = f"Suggest 3 roles in a list which a career Guide will suggest to a person Interested in {state['interests']} \
    have educational background like {state['education']} and experience in {state['experience']}"
    response = targetrole_model.invoke(prompt)
    return {"TargetRoles" : response.Roles}

def Required_Skills(state):
    Target_role = state['TargetRoles']
    prompt = f"""
                You are an expert career coach and hiring manager.

                Generate exactly 10 technical skills for EACH target role.

                TARGET ROLES:
                1. {Target_role[0]}
                2. {Target_role[1]}
                3. {Target_role[2]}

                IMPORTANT OUTPUT FORMAT:

                The top-level key "Skills" MUST be an object.
                Each key inside "Skills" MUST be the exact role name.
                Each role must contain a list of exactly 10 skill objects.

                Example:

                {{
                "Skills": {{
                    "{Target_role[0]}": [
                    {{
                        "skill": "Python",
                        "proficiency": 5
                    }}
                    ],
                    "{Target_role[1]}": [],
                    "{Target_role[2]}": []
                }}
                }}

                Return only the structured output.
                """

    
    skill_list = requiredSkills_model.invoke(prompt)
    return {"RequiredSkills" : skill_list.Skills}


def normalize_userandReq_skill(state):
    Required_Skills_dict = state["RequiredSkills"]
    normalized_req_skills = {}

    for role, skill_list in Required_Skills_dict.items():
        normalized_req_skills[role] = []

        for skill_obj in skill_list:
            skill_name = skill_obj.skill
            level = skill_obj.proficiency

            mapped_skill = normalize_skill(
                embedding_client,
                qdrant_client,
                skill_name
            )

            normalized_req_skills[role].append({
                mapped_skill: level
            })

    user_skills = state["skills"]

    user_skill_dicts = [
        {skill['skill']: skill['proficiency']}
        for skill in user_skills
    ]

    normalized_user_skills = {}
    print("all OKAY until now")
    for skill_dict in user_skill_dicts:
        for skill_name, level in skill_dict.items():
            mapped_skill = normalize_skill(
                embedding_client,
                qdrant_client,
                skill_name
            )
            normalized_user_skills[mapped_skill] = level

    return {
        "RequiredSkills": normalized_req_skills,
        "skills": normalized_user_skills
    }


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
    prompt = f"Generate 5 MCQ questions of Interview relevant concept for the Role of {role} with strictly proficiency level {proficiency} for the skill {skill} with 4 options and also the correct answer (proficiency level 1 is basic and 5 is advanced) and the subtopic "
    Questions = question_model.invoke(prompt)
    return Questions

def get_interview_relevant_topics(state):
    role = state["role"]
    skills = state["skills"]
    education = state["education"]
    experience = state["experience"]


    prompt = f"""
    You are an expert career coach and hiring manager.

    TASK:
    Generate a list of 3-4 interview-relevant topics for each skill relevant to the role and education and experience, strictly relevant to the interview process.

    ROLE: {role}
    SKILL: {skills}
    Education: {education}
    Experience: {experience}

    RULES:
    - only core interview skills and concepts should be included.
    - Topics must be specific and relevant to the role and skill.
    - in a order of importance for interviews.
    - Topics must be highly relevant to interviews for the specified role.
    - Avoid generic or vague topics; focus on specific concepts or technologies.
    - Ensure topics are appropriate for the given proficiency level.
    - no explanations, only output JSON.

    OUTPUT SCHEMA:
    Return JSON like:

    {{
        "Skill1": ["topic1", "topic2", "topic3"],
        "Skill2": ["topic1", "topic2", "topic3"],
        "Skill3": ["topic1", "topic2", "topic3"]
    }}
    """

    topics_response = topic_model.invoke(prompt)
    return {"topics": topics_response.Topics}

def generate_interview_plan_api(role, skills, topics):
    prompt = f"""
    You are an expert technical interviewer for the role of {role}.
    Based on the following topics: {topics}, generate an interview plan with 5-7 technical questions.
    Questions should be open-ended, not MCQs, to test the candidate's deep understanding.
    Skills of candidate: {skills}.
    """
    plan = interview_plan_model.invoke(prompt)
    return plan.model_dump()

def evaluate_user_answer_api(question, expected_key_points, user_answer):
    prompt = f"""
    You are a strict technical interviewer. 
    Question asked: {question}
    Expected Key Points: {expected_key_points}
    User's Answer: {user_answer}

    Evaluate the answer. Give a score out of 10.
    Provide constructive feedback.
    Determine if a follow-up question is needed to clarify their answer. If yes, provide the follow_up_question.
    """
    evaluation = evaluation_model.invoke(prompt)
    return evaluation.model_dump()

def evaluate_agent_performance_api(question, user_answer, agent_feedback, agent_follow_up):
    prompt = f"""
    You are an expert meta-evaluator observing a mock technical interview.
    
    Original Question: {question}
    User's Answer: {user_answer}
    Agent's Feedback: {agent_feedback}
    Agent's Follow-up: {agent_follow_up if agent_follow_up else 'None'}

    Your task is to grade the Agent Interviewer. Did the agent provide fair, accurate, and constructive feedback?
    Was the follow-up question (if any) relevant and appropriate to dig deeper into the user's weaknesses?
    
    Grade the agent out of 10 and provide a constructive critique.
    """
    agent_eval = agent_eval_model.invoke(prompt)
    return agent_eval.model_dump()


