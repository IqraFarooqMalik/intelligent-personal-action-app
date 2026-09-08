from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel
from app.models.session import SessionStatus, ImpulseAction
from app.schemas.task import TaskResponse

class SessionStartRequest(BaseModel):
    task_id: int
    checkpoint_step_title: Optional[str] = None
    resume_note: Optional[str] = None

class ImpulseRequest(BaseModel):
    thought: str
    execution_context: Optional[str] = None
    action: ImpulseAction = ImpulseAction.DO_NOW

class SessionResponse(BaseModel):
    id: int
    task_id: int
    status: SessionStatus
    started_at: datetime
    paused_at: Optional[datetime] = None
    checkpoint_step_title: Optional[str] = None
    resume_note: Optional[str] = None
    task: Optional[TaskResponse] = None

    class Config:
        from_attributes = True
