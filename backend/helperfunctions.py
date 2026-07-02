from datetime import datetime, timedelta
from qdrant_client import QdrantClient

from google import genai
from google.genai import types

import os
from jose import jwt
from dotenv import load_dotenv
load_dotenv()

SECRET_KEY = "721"
ALGORITHM = "HS256"


def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now() + timedelta(minutes=30)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# print(create_access_token({"sub": "vidhi"}))

def normalize_skill(client,qdrant_client,skill_name):
  query_vector = client.models.embed_content(
    model="gemini-embedding-2",
    contents=skill_name,
    config= types.EmbedContentConfig(output_dimensionality=768)
    ).embeddings[0].values
  
  # query_vector = model.encode(skill_name).tolist()
  results = qdrant_client.query_points(
        collection_name="normalized_skills",
        query=query_vector,
        with_payload =True,
        limit=1
    )
  
  if not results:
        return skill_name
  
  if results.points[0].score>0.80:
    return results.points[0].payload['skill']
  else:
    # print(results.points[0].score)
    # print(results.points[0].payload['skill'])
    return skill_name
  

# qdrant_client = QdrantClient(
#     url=os.getenv("QDRANT_URL"),
#     api_key=os.getenv("QDRANT_KEY")
# )


# from google import genai
# from google.genai import types

# client = genai.Client(api_key=os.getenv("EMBEDDING_KEY"))

# print(normalize_skill(client, qdrant_client, "Pythons"))