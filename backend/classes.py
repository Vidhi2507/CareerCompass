from pydantic import BaseModel, EmailStr
from typing import Optional

class User(BaseModel):
    username: Optional[str] = None
    email: EmailStr
    password: str

class UserCareerInfo(BaseModel):
    username: Optional[str] = None
    fullName: Optional[str] = None
    currentRole: Optional[str] = None
    years_experience: Optional[int] = None

    experience: Optional[list[dict]] = None
    education : Optional[list[dict]] = None
    skills: Optional[list[dict]] = None
