from pydantic import BaseModel, EmailStr,Field
from typing import Annotated, Dict, List, Optional, TypedDict
import operator

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

# class Roadmap(BaseModel):
#     Role: Annotated[str,"Roles recommended based on the user's profile and preferences"]
#     Skills: Annotated[list[str],"Skills required for the recommended roles"]
    

class TargetRoles(BaseModel):
    Roles : Annotated[list[str],"3 SuggestedTarget Roles for a person with following Interests"] = Field(default=None, max_length=3)

class RequiredSkills(BaseModel):
    Skills: Dict[str, List[Dict[str, int]]] = Field(
        ...,
        description="Dictionary where key is role name and value is list of skills with required levels"
    )

class Roadmapstate(TypedDict):
    education: dict
    experience: dict
    currentRole: str
    TargetRoles : Annotated[list[str], operator.add]
    RequiredSkills : Annotated[dict[str, list[dict]], operator.or_]