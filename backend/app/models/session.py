import enum
from datetime import datetime
from sqlalchemy import Column, String, Integer, ForeignKey, Enum as SQLEnum, DateTime, Text
from sqlalchemy.orm import relationship
from app.database.base import Base, TimestampMixin

class SessionStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    PAUSED = "PAUSED"
    COMPLETED = "COMPLETED"
    ABANDONED = "ABANDONED"

class ImpulseAction(str, enum.Enum):
    DO_NOW = "DO_NOW"
    AFTER_BLOCK = "AFTER_BLOCK"
    LATER = "LATER"

class ActiveSession(Base, TimestampMixin):
    __tablename__ = "active_sessions"

    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id"), nullable=False)
    status = Column(SQLEnum(SessionStatus), default=SessionStatus.ACTIVE, nullable=False)
    
    started_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    paused_at = Column(DateTime, nullable=True)
    ended_at = Column(DateTime, nullable=True)
    
    # Return-to-task bridge details
    checkpoint_step_title = Column(String(300), nullable=True)
    resume_note = Column(Text, nullable=True)
    
    user = relationship("User", back_populates="sessions")
    task = relationship("Task", back_populates="sessions")
    detours = relationship("ImpulseDetour", back_populates="session", cascade="all, delete-orphan")

class ImpulseDetour(Base, TimestampMixin):
    __tablename__ = "impulse_detours"

    session_id = Column(Integer, ForeignKey("active_sessions.id"), nullable=False, index=True)
    impulse_task_id = Column(Integer, ForeignKey("tasks.id"), nullable=False)
    action = Column(SQLEnum(ImpulseAction), default=ImpulseAction.DO_NOW, nullable=False)
    
    started_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    returned_at = Column(DateTime, nullable=True)

    session = relationship("ActiveSession", back_populates="detours")
    impulse_task = relationship("Task")
