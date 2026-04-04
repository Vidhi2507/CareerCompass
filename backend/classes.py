from pydantic import BaseModel, EmailStr
from typing import Optional

class User(BaseModel):
    username: Optional[str] = None
    email: EmailStr
    password: str

class UserCareerInfo(BaseModel):
    username: Optional[str] = None
    email: EmailStr
    Highesteducation: Optional[str] = None
    graduation_year: Optional[int] = None
    current_role: Optional[str] = None
    years_experience: Optional[int] = None
    skills: Optional[list[str]] = None
    career_goals: Optional[str] = None