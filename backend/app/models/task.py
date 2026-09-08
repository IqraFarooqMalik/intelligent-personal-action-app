import enum
from sqlalchemy import Column, String, Text, Integer, Float, Boolean, ForeignKey, Enum as SQLEnum, JSON
from sqlalchemy.orm import relationship
from app.database.base import Base, TimestampMixin

class TaskStatus(str, enum.Enum):
    INBOX = "INBOX"
    UNDERSTOOD = "UNDERSTOOD"
    READY = "READY"
    IN_PROGRESS = "IN_PROGRESS"
    WAITING = "WAITING"
    SOMEDAY = "SOMEDAY"
    POSTPONED = "POSTPONED"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"

class TaskType(str, enum.Enum):
    ONE_TIME = "ONE_TIME"
    PURCHASE = "PURCHASE"
    ERRAND = "ERRAND"
    WORK = "WORK"
    REUSABLE = "REUSABLE"
    ROUTINE = "ROUTINE"
    RECOVERY = "RECOVERY"
    COMFORT = "COMFORT"
    LEISURE = "LEISURE"
    SOMEDAY = "SOMEDAY"

class EnergyLevel(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"

class FocusLevel(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"

class SocialLevel(str, enum.Enum):
    NONE = "NONE"
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"

class ActivationDifficulty(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"

class CostType(str, enum.Enum):
    FREE = "FREE"
    PAID = "PAID"

class LocationRequirement(str, enum.Enum):
    ANY = "ANY"
    HOME = "HOME"
    OFFICE = "OFFICE"
    OUTSIDE = "OUTSIDE"
    SPECIFIC_STORE = "SPECIFIC_STORE"

class DeviceRequirement(str, enum.Enum):
    NONE = "NONE"
    PHONE = "PHONE"
    LAPTOP = "LAPTOP"
    ANY = "ANY"

class Task(Base, TimestampMixin):
    __tablename__ = "tasks"

    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String(500), nullable=False)
    execution_context = Column(Text, nullable=True)  # "How do you want to do it?"
    
    # Lifecycle & Classification
    status = Column(SQLEnum(TaskStatus), default=TaskStatus.INBOX, nullable=False, index=True)
    task_type = Column(SQLEnum(TaskType), default=TaskType.ONE_TIME, nullable=False)
    
    # Inferred or user-provided metadata
    estimated_duration = Column(Integer, nullable=True)  # in minutes
    energy_level = Column(SQLEnum(EnergyLevel), default=EnergyLevel.MEDIUM, nullable=False)
    focus_level = Column(SQLEnum(FocusLevel), default=FocusLevel.MEDIUM, nullable=False)
    social_level = Column(SQLEnum(SocialLevel), default=SocialLevel.NONE, nullable=False)
    activation_difficulty = Column(SQLEnum(ActivationDifficulty), default=ActivationDifficulty.MEDIUM, nullable=False)
    
    # Financials & Location
    cost_type = Column(SQLEnum(CostType), default=CostType.FREE, nullable=False)
    estimated_cost = Column(Float, default=0.0, nullable=False)
    location_requirement = Column(SQLEnum(LocationRequirement), default=LocationRequirement.ANY, nullable=False)
    device_requirement = Column(SQLEnum(DeviceRequirement), default=DeviceRequirement.NONE, nullable=False)
    
    # Advanced attributes
    is_reusable = Column(Boolean, default=False, nullable=False)
    splittable = Column(Boolean, default=False, nullable=False)
    overuse_risk = Column(SQLEnum(EnergyLevel), default=EnergyLevel.LOW, nullable=False)
    
    # Learning & Provenance
    postpone_count = Column(Integer, default=0, nullable=False)
    good_for = Column(JSON, default=list, nullable=True)  # e.g. ["tired", "stiff"]
    provenance = Column(JSON, default=dict, nullable=True)  # source tracking
    notes = Column(Text, nullable=True)
    links = Column(JSON, default=list, nullable=True)  # [{url, title, type}]

    # Relationships
    user = relationship("User", back_populates="tasks")
    steps = relationship("TaskStep", back_populates="task", cascade="all, delete-orphan", order_by="TaskStep.order")
    sessions = relationship("ActiveSession", back_populates="task")
