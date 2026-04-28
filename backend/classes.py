from pydantic import BaseModel, EmailStr
from typing import Annotated, List, Optional,Field

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
    interests: List[str] = None

class Roadmap(BaseModel):
    Role: Annotated[str,"Roles recommended based on the user's profile and preferences"]
    Skills: Annotated[list[str],"Skills required for the recommended roles"]
    

class TargetRoles(BaseModel):
    Roles : Annotated[list[str],"Target Roles for a person with following Interests"]

class RequiredSkills(BaseModel):
    Skills: Annotated[list[dict[str, int]],"List of 10 Highly important skills required for each target roles from basic to advanced and adding their proficiency levels required for that particular role"] = Field(default=None, max_length=10)