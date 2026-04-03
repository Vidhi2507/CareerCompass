from pydantic import BaseModel, EmailStr
from typing import Optional

class User(BaseModel):
    username: Optional[str] = None
    email: EmailStr
    password: str
