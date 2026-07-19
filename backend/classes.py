from pydantic import BaseModel, EmailStr,Field
from typing import Annotated, Dict, List, Literal, Optional, TypedDict
import operator

class User(BaseModel):
    username: Optional[str] = None
    email: EmailStr
    password: str

class UserCareerInfo(BaseModel):
    username: Optional[str] = None
    fullName: Optional[str] = None
    currentRole: Optional[str] = None
    years_experience: Optional[float] = None
    experience: Optional[list[dict]] = None
    education : Optional[list[dict]] = None
    skills: Annotated[list[dict], "List of skills with proficiency levels, e.g., [{'skill': 'Python', 'proficiency': 4}]"] = None
    interests: List[str] = None
    

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
    interests: list[str]
    skills:list[dict]
    years_experience: int
    currentRole: str
    TargetRoles : Annotated[list[str], operator.add]
    RequiredSkills : Annotated[dict[str, list[dict]], operator.or_]
    missingSkills : list[dict]
    masteredSkills : list[dict]
    to_be_improved_skills : list[dict]
    readinessScore : float
    Roadmap : dict
    
class Skill(BaseModel):
    skill: str = Field(..., description="Name of the skill to learn or improve (e.g., 'Feature Engineering', 'PyTorch').")

    tasks: List[str] = Field(
        ...,
        description="Step-by-step learning tasks or practice exercises for this skill."
    )

    resource_book: Optional[str] = Field(
        None,
        description="Recommended book or free learning resource for this skill (if available)."
    )

    official_docs: Optional[str] = Field(
        None,
        description="Official documentation link for the skill/tool/library (e.g., PyTorch docs)."
    )


class Project(BaseModel):
    title: str = Field(..., description="Short title of the project.")

    description: str = Field(
        ...,
        description="Detailed description of what the project involves and what problem it solves."
    )

    skills_used: List[str] = Field(
        ...,
        description="List of skills/technologies that will be applied while building this project."
    )

    difficulty: str = Field(
        ...,
        description="Difficulty level of the project. Must be one of: Beginner, Intermediate, Advanced."
    )


class Phase(BaseModel):
    phase_name: str = Field(
        ...,
        description="Name of the learning phase (e.g., 'Machine Learning Fundamentals', 'MLOps & Deployment')."
    )

    duration_days: int = Field(
        ...,
        description="Estimated duration of this phase in days."
    )

    skills_to_focus: List[Skill] = Field(
        ...,
        description="List of skills covered in this phase along with tasks and learning resources."
    )

    mini_project: Project = Field(
        ...,
        description="A small project to reinforce learning from this phase."
    )

    major_project: Project = Field(
        ...,
        description="A portfolio-level project for this phase, useful for resume and interviews."
    )


class RoadmapLLMStructuredOutput(BaseModel):
    role: str = Field(
        ...,
        description="Target job role for which the roadmap is generated (e.g., 'Data Scientist', 'ML Engineer')."
    )

    readinessScore: int = Field(
        ...,
        description="User's readiness score for the target role in percentage (0-100)."
    )

    estimated_days_to_job_ready: int = Field(
        ...,
        description="Estimated number of days required for the user to become job-ready for the target role."
    )

    phases: List[Phase] = Field(
        ...,
        description="Complete roadmap divided into sequential learning phases."
    )

class Question(BaseModel):
    question: str = Field(
        ...,
        description="MCQ Question based on the skill/technology/concept "
    )
    options : List[str] = Field(
        ...,
        description="Options for the MCQ question"
    )
    answer: str = Field(
        ...,
        description="Answer to the MCQ question"
    )
    proficiency_level: str = Field(
        ...,
        description="Proficiency level of the question ranging from 1 to 5, where 1 is very basic and 5 is very advanced"
    )
    sub_topic: str = Field(
        ...,
        description="The specific topic or concept within the skill that this question is testing (e.g., 'Overfitting in Decision Trees', 'PyTorch Tensors')."
    )

class QuestionStructuredOutput(BaseModel):
    questions: List[Question] = Field(
        ...,
        description="List of questions for the user to answer"
    )


class TopicStructuredOutput(BaseModel):
    Topics: Dict[str, List[str]] = Field(
        ...,
        description="Dictionary where key is skill name and value is list of topics relevant to the skill"
    )

class InterviewerState(TypedDict):

    role: str
    skills: list[str]
    education: list[dict]
    experience: list[dict]

    topics: dict[str, list[str]]
    interview_plan: list[dict]
    current_question: dict
    current_question_index: int

    user_answer: str
    evaluation: dict

    interview_history: list[dict]
    topic_mastery_score: dict[str, float]
    overall_score: float
    follow_up_question: dict | None
    final_report: str

    phase: Literal[
        "planning",
        "asking",
        "waiting",
        "evaluating",
        "completed"
    ]


class InterviewQuestion(BaseModel):
    question: str = Field(..., description="The interview question text.")
    expected_key_points: List[str] = Field(..., description="Key points expected in the answer.")
    topic: str = Field(..., description="Topic being tested.")
    skill: str = Field(..., description="Skill being tested.")

class InterviewPlanOutput(BaseModel):
    questions: List[InterviewQuestion] = Field(..., description="List of 5-7 questions for the interview.")

class AnswerEvaluation(BaseModel):
    score: int = Field(..., description="Score out of 10 for the user's answer.")
    feedback: str = Field(..., description="Constructive feedback for the user on what was good and what was missing.")
    follow_up_required: bool = Field(..., description="True if a follow-up is needed to clarify or dig deeper.")
    follow_up_question: Optional[str] = Field(None, description="The follow up question if required.")

class AnswerRequest(BaseModel):
    answer: str