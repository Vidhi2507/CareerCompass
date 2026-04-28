from langchain_google_genai import ChatGoogleGenerativeAI
from dotenv import load_dotenv 
import os
from pydantic import BaseModel,Field
from typing import Annotated
from classes import TargetRoles, RequiredSkills
from sentence_transformers import SentenceTransformer



load_dotenv() 

api_key = os.getenv("API_KEY")

chatmodel = ChatGoogleGenerativeAI(
    api_key=os.getenv("GEMINI"),
    model="gemini-2.5-flash-lite",   # fast + cheap
    temperature=0
)
targetrole_model = chatmodel.with_structured_output(TargetRoles)
embeddingmodel = SentenceTransformer("all-MiniLM-L6-v2")

def Suggest_Target_Roles(state):
    prompt = f"Suggest 3 roles in a list which a career Guide will suggest to a person Interested in  \
    have educational background like {state['education']} and experience in {state['experience']}"
    response = targetrole_model.invoke(prompt)
    return {"TargetRoles" : response.Roles}

def Required_Skills(state):
    Target_role = state['TargetRoles']
    prompt = f"Suggest some 10 highly important skills required for the roles \
            {Target_role[0]}, {Target_role[1]}, {Target_role[2]} in the format of list of list,\
             where each inner list should contain skills for each role respectively and \
            should be in order of {Target_role[0], Target_role[1], Target_role[2]} \
            Each skills should be highly relevant and in demand for the respective role and should be mostly technical learnable Interview skills, Only skills that are usually added on Resumes and available on Job descriptions \
            Ordered in the way that for each role, \
            skills should be arranged from basic to advanced level \
            and also add the proficiency level required for each skill based on the Target role in the format of 0 to 5 where 0 means no proficiency required and 5 means highly proficient required \
            for a person currently a {state["currentRole"]} \
            experience as {state["experience"]} and their education from {state["education"]}"

    structured_model = chatmodel.with_structured_output(RequiredSkills)
    skill_list = structured_model.invoke(prompt)
    return {"RequiredSkills" : skill_list.Skills}


# def normalize_skill(state):

#     skill_emb = embeddingmodel.encode([skill])
#     sims = cosine_similarity(skill_emb, canonical_embeddings)[0]

#     best_idx = int(np.argmax(sims))
#     best_score = sims[best_idx]

#     if best_score >= threshold:
#         return skill_vocab[best_idx], float(best_score)

#     return skill, float(best_score)



