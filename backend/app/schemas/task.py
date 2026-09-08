from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from app.models.task import (
    TaskStatus,
    TaskType,
    EnergyLevel,
    FocusLevel,
    SocialLevel,
    ActivationDifficulty,
    CostType,
    LocationRequirement,
    DeviceRequirement,
)

class TaskStepBase(BaseModel):
    title: str
    order: int = 0
    is_completed: bool = False
    estimated_duration: int = 5
    is_minimum_useful: bool = False

class TaskStepCreate(TaskStepBase):
    pass

class TaskStepResponse(TaskStepBase):
    id: int
    task_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class QuickCaptureRequest(BaseModel):
    title: str = Field(..., min_length=1, description="Raw thought or impulse")
    execution_context: Optional[str] = Field(None, description="Optional 'How do you want to do it?'")
    user_id: Optional[int] = None

class TaskCreate(BaseModel):
    title: str
    execution_context: Optional[str] = None
    status: TaskStatus = TaskStatus.READY
    task_type: TaskType = TaskType.ONE_TIME
    estimated_duration: Optional[int] = 15
    energy_level: EnergyLevel = EnergyLevel.MEDIUM
    focus_level: FocusLevel = FocusLevel.MEDIUM
    social_level: SocialLevel = SocialLevel.NONE
    activation_difficulty: ActivationDifficulty = ActivationDifficulty.MEDIUM
    cost_type: CostType = CostType.FREE
    estimated_cost: float = 0.0
    location_requirement: LocationRequirement = LocationRequirement.ANY
    device_requirement: DeviceRequirement = DeviceRequirement.NONE
    is_reusable: bool = False
    splittable: bool = False
    notes: Optional[str] = None
    links: Optional[List[Dict[str, Any]]] = None

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    execution_context: Optional[str] = None
    status: Optional[TaskStatus] = None
    task_type: Optional[TaskType] = None
    estimated_duration: Optional[int] = None
    energy_level: Optional[EnergyLevel] = None
    focus_level: Optional[FocusLevel] = None
    social_level: Optional[SocialLevel] = None
    activation_difficulty: Optional[ActivationDifficulty] = None
    cost_type: Optional[CostType] = None
    estimated_cost: Optional[float] = None
    location_requirement: Optional[LocationRequirement] = None
    device_requirement: Optional[DeviceRequirement] = None
    is_reusable: Optional[bool] = None
    splittable: Optional[bool] = None
    notes: Optional[str] = None
    links: Optional[List[Dict[str, Any]]] = None

class TaskResponse(BaseModel):
    id: int
    user_id: int
    title: str
    execution_context: Optional[str] = None
    status: TaskStatus
    task_type: TaskType
    estimated_duration: Optional[int] = None
    energy_level: EnergyLevel
    focus_level: FocusLevel
    social_level: SocialLevel
    activation_difficulty: ActivationDifficulty
    cost_type: CostType
    estimated_cost: float
    location_requirement: LocationRequirement
    device_requirement: DeviceRequirement
    is_reusable: bool
    splittable: bool
    notes: Optional[str] = None
    links: Optional[List[Dict[str, Any]]] = None
    good_for: Optional[List[str]] = None
    provenance: Optional[Dict[str, Any]] = None
    steps: List[TaskStepResponse] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class DecomposeResponse(BaseModel):
    task_id: int
    steps: List[TaskStepResponse]
    minimum_useful_step: Optional[TaskStepResponse] = None
