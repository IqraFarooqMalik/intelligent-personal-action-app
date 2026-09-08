import enum
from sqlalchemy import Column, String, Integer, Float, ForeignKey, Enum as SQLEnum, JSON, Text
from sqlalchemy.orm import relationship
from app.database.base import Base, TimestampMixin
from app.models.task import EnergyLevel, FocusLevel, SocialLevel, CostType

class ActivityCategory(str, enum.Enum):
    RECOVERY = "RECOVERY"
    COMFORT = "COMFORT"
    ROUTINE = "ROUTINE"
    LEISURE = "LEISURE"

class Activity(Base, TimestampMixin):
    __tablename__ = "activities"

    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String(300), nullable=False)
    category = Column(SQLEnum(ActivityCategory), default=ActivityCategory.RECOVERY, nullable=False)
    typical_duration = Column(Integer, default=10, nullable=False)  # minutes
    energy_level = Column(SQLEnum(EnergyLevel), default=EnergyLevel.LOW, nullable=False)
    focus_level = Column(SQLEnum(FocusLevel), default=FocusLevel.LOW, nullable=False)
    social_level = Column(SQLEnum(SocialLevel), default=SocialLevel.NONE, nullable=False)
    cost_type = Column(SQLEnum(CostType), default=CostType.FREE, nullable=False)
    estimated_cost = Column(Float, default=0.0, nullable=False)
    
    good_for = Column(JSON, default=list, nullable=True)  # e.g. ["tired", "stiff", "restless"]
    resource_url = Column(String(1000), nullable=True)   # e.g. YouTube stretching link
    notes = Column(Text, nullable=True)

    user = relationship("User", back_populates="activities")
