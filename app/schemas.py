from pydantic import BaseModel, Field
from typing import List, Optional

class QARequest(BaseModel):
    question: str
    k: int = 6

class SolveRequest(BaseModel):
    question: str
    k: int = 8

class MCQGenRequest(BaseModel):
    topic: str
    difficulty: str = Field(default="متوسط")
    k: int = 12

class IngestItem(BaseModel):
    subject: str
    topic: str
    source: str
    difficulty: str
    question: str
    options: List[str]
    correct_option_index: int
    explanation: str

class IngestBulk(BaseModel):
    items: List[IngestItem]

class QuizStepRequest(BaseModel):
    topic: Optional[str] = None
    k: int = 6
