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


COLLECTION_NAME = "career_compass_profiles"
EMBEDDING_DIM = 768


def _embed_text(text: str) -> list:
    """Embed a text string using Gemini embedding model."""
    return embedding_client.models.embed_content(
        model="gemini-embedding-2",
        contents=text,
        config=types.EmbedContentConfig(output_dimensionality=EMBEDDING_DIM)
    ).embeddings[0].values


def _ensure_collection():
    """Create Qdrant collection if it doesn't exist."""
    from qdrant_client.models import Distance, VectorParams
    existing = [c.name for c in qdrant_client.get_collections().collections]
    if COLLECTION_NAME not in existing:
        qdrant_client.create_collection(
            collection_name=COLLECTION_NAME,
            vectors_config=VectorParams(size=EMBEDDING_DIM, distance=Distance.COSINE)
        )


def store_user_profile_in_qdrant(user_data: dict, roadmap_data: dict):
    """
    Embeds and stores the user career profile + roadmap into Qdrant
    so CompassAI can perform RAG queries specific to this user.
    """
    from qdrant_client.models import PointStruct
    import hashlib, json

    _ensure_collection()

    username = user_data.get("username", "unknown")
    role = roadmap_data.get("role", "")
    readiness = roadmap_data.get("readinessScore", 0)
    days = roadmap_data.get("estimated_days_to_job_ready", 0)
    skills = user_data.get("skills", [])
    education = user_data.get("education", [])
    experience = user_data.get("experience", [])
    interests = user_data.get("interests", [])
    current_role = user_data.get("currentRole", "")
    years_exp = user_data.get("years_experience", 0)

    # Build rich text chunks to embed
    chunks = [
        {
            "id": f"{username}_profile_overview",
            "text": (
                f"User: {username}. Current Role: {current_role}. Years of Experience: {years_exp}. "
                f"Interests: {', '.join(interests)}. Target Role: {role}. "
                f"Readiness Score: {readiness}%. Estimated days to job readiness: {days} days."
            ),
            "type": "profile"
        },
        {
            "id": f"{username}_skills",
            "text": (
                f"Skills of {username}: " +
                ", ".join([
                    f"{s.get('skill', s)} (proficiency {s.get('proficiency', 'N/A')}/5)"
                    if isinstance(s, dict) else str(s)
                    for s in skills
                ])
            ),
            "type": "skills"
        },
        {
            "id": f"{username}_education",
            "text": f"Education of {username}: {json.dumps(education)}",
            "type": "education"
        },
        {
            "id": f"{username}_experience",
            "text": f"Work experience of {username}: {json.dumps(experience)}",
            "type": "experience"
        },
    ]

    # Add roadmap phase summaries
    for i, phase in enumerate(roadmap_data.get("phases", [])):
        phase_skills = ", ".join([s.get("skill", "") for s in phase.get("skills_to_focus", [])])
        chunk_text = (
            f"Roadmap Phase {i+1} for {username}: '{phase.get('phase_name', '')}', "
            f"Duration: {phase.get('duration_days', 0)} days. "
            f"Skills to focus on: {phase_skills}."
        )
        chunks.append({
            "id": f"{username}_phase_{i}",
            "text": chunk_text,
            "type": "roadmap_phase"
        })

    # Upsert all points into Qdrant
    points = []
    for chunk in chunks:
        numeric_id = int(hashlib.md5(chunk["id"].encode()).hexdigest(), 16) % (2**63)
        vector = _embed_text(chunk["text"])
        points.append(PointStruct(
            id=numeric_id,
            vector=vector,
            payload={
                "username": username,
                "text": chunk["text"],
                "type": chunk["type"]
            }
        ))

    qdrant_client.upsert(collection_name=COLLECTION_NAME, points=points)
    print(f"[CompassAI] Stored {len(points)} profile chunks for user '{username}' in Qdrant.")


def rag_chat_response(username: str, query: str) -> str:
    """
    RAG pipeline: retrieves the user-specific context from Qdrant
    and generates a personalized career guidance response.
    """
    from qdrant_client.models import Filter, FieldCondition, MatchValue

    _ensure_collection()

    # 1. Embed the user query
    query_vector = _embed_text(query)

    # 2. Retrieve relevant chunks filtered to this specific user
    results = qdrant_client.query_points(
        collection_name=COLLECTION_NAME,
        query=query_vector,
        query_filter=Filter(
            must=[FieldCondition(key="username", match=MatchValue(value=username))]
        ),
        with_payload=True,
        limit=5
    )

    # 3. Build context from retrieved chunks
    if not results.points:
        context = "No specific profile data found for this user yet."
    else:
        context_chunks = [p.payload.get("text", "") for p in results.points]
        context = "\n".join(context_chunks)

    # 4. Generate personalized response using LLM
    prompt = f"""
You are CompassAI, a highly personalized career mentor embedded inside the CareerCompass platform.
You have access to the following personal profile and career information for the user '{username}':

--- USER CONTEXT ---
{context}
--- END OF CONTEXT ---

User's Question: {query}

INSTRUCTIONS:
- Answer specifically based on the user's profile, skills, roadmap, and goals above.
- Be concise, actionable, and encouraging.
- If the answer cannot be derived from the context, say so honestly and offer general guidance.
- Format your response clearly. Use bullet points if listing multiple items.
- Do NOT make up skills, roles, or data not present in the context.

Your response:
"""
    response = chatmodel.invoke(prompt)
    return response.content

