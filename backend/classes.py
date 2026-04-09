from pydantic import BaseModel, EmailStr
from typing import Annotated, Optional

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


class Roadmap(BaseModel):
    Role: Annotated[str,"Roles recommended based on the user's profile and preferences"]
    Skills: Annotated[list[str],"Skills required for the recommended roles"]
    