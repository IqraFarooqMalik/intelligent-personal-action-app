from sqlalchemy import Column, String, Float, JSON
from sqlalchemy.orm import relationship
from app.database.base import Base, TimestampMixin

class User(Base, TimestampMixin):
    __tablename__ = "users"

    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    monthly_budget = Column(Float, default=0.0, nullable=False)
    currency = Column(String(10), default="EUR", nullable=False)
    preferences = Column(JSON, default=dict, nullable=True)

    tasks = relationship("Task", back_populates="user", cascade="all, delete-orphan")
    activities = relationship("Activity", back_populates="user", cascade="all, delete-orphan")
    sessions = relationship("ActiveSession", back_populates="user", cascade="all, delete-orphan")
    expenses = relationship("BudgetExpense", back_populates="user", cascade="all, delete-orphan")
