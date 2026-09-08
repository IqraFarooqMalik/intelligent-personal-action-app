from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel

class ExpenseCreate(BaseModel):
    title: str
    amount: float
    category: Optional[str] = "General"
    task_id: Optional[int] = None

class ExpenseResponse(BaseModel):
    id: int
    title: str
    amount: float
    category: str
    task_id: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True

class BudgetUpdate(BaseModel):
    monthly_budget: float
    currency: Optional[str] = "EUR"

class BudgetSummaryResponse(BaseModel):
    monthly_budget: float
    currency: str
    spent_this_month: float
    remaining_budget: float
    planned_purchases_total: float
    recent_expenses: List[ExpenseResponse] = []
