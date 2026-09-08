from sqlalchemy import Column, String, Integer, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.database.base import Base, TimestampMixin

class TaskStep(Base, TimestampMixin):
    __tablename__ = "task_steps"

    task_id = Column(Integer, ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(300), nullable=False)
    order = Column(Integer, default=0, nullable=False)
    is_completed = Column(Boolean, default=False, nullable=False)
    estimated_duration = Column(Integer, default=5, nullable=False)  # minutes
    is_minimum_useful = Column(Boolean, default=False, nullable=False)  # tiny starting step

    task = relationship("Task", back_populates="steps")
