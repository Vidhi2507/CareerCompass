from datetime import datetime, timedelta
from jose import jwt

SECRET_KEY = "721"
ALGORITHM = "HS256"


def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now() + timedelta(minutes=30)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# print(create_access_token({"sub": "vidhi"}))

def normalize_skill(model,qdrant_client,skill_name):
  query_vector = model.encode(skill_name).tolist()
  results = qdrant_client.query_points(
        collection_name="Skill_List",
        query=query_vector,
        with_payload =True,
        limit=1
    )
  
  if not results:
        return skill_name
  
  if results.points[0].score>0.80:
    return results.points[0].payload['Skill']
  else:
    return skill_name