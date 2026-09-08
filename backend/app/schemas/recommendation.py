import enum
from typing import Optional, List
from pydantic import BaseModel, Field
from app.models.task import EnergyLevel, FocusLevel, SocialLevel, LocationRequirement
from app.schemas.task import TaskResponse, TaskStepResponse

class RecommendationMode(str, enum.Enum):
    BEST_MATCH = "BEST_MATCH"
    SURPRISE_ME = "SURPRISE_ME"
    QUICK_WIN = "QUICK_WIN"
    LOW_EFFORT = "LOW_EFFORT"
    RECOVERY = "RECOVERY"

class StateInput(BaseModel):
    energy: EnergyLevel = EnergyLevel.MEDIUM
    focus: FocusLevel = FocusLevel.MEDIUM
    social_battery: SocialLevel = SocialLevel.NONE
    available_time_minutes: int = Field(default=30, ge=5, le=360)
    spending_allowed: bool = True
    current_location: LocationRequirement = LocationRequirement.HOME
    mode: RecommendationMode = RecommendationMode.BEST_MATCH

class RecommendationResponse(BaseModel):
    task: Optional[TaskResponse] = None
    reason: str
    suggested_step: Optional[TaskStepResponse] = None
    score: float = 0.0
    alternative_count: int = 0

class FeedbackType(str, enum.Enum):
    ACCEPTED = "ACCEPTED"
    NOT_NOW = "NOT_NOW"
    TOO_TIRING = "TOO_TIRING"
    TAKES_LONGER = "TAKES_LONGER"
    TOO_EXPENSIVE = "TOO_EXPENSIVE"
    WRONG_LOCATION = "WRONG_LOCATION"

class FeedbackRequest(BaseModel):
    task_id: int
    feedback: FeedbackType
    current_mode: RecommendationMode = RecommendationMode.BEST_MATCH
