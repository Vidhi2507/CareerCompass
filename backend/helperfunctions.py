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