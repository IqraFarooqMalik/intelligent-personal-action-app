from sqlalchemy import Column, String, Float, Integer, ForeignKey
from sqlalchemy.orm import relationship
from app.database.base import Base, TimestampMixin

class BudgetExpense(Base, TimestampMixin):
    __tablename__ = "budget_expenses"

    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id"), nullable=True)
    title = Column(String(300), nullable=False)
    amount = Column(Float, nullable=False)
    category = Column(String(100), default="General", nullable=False)

    user = relationship("User", back_populates="expenses")
    task = relationship("Task")
