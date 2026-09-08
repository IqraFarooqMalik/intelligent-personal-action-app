from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.session import get_db
from app.schemas.budget import BudgetSummaryResponse, ExpenseCreate, ExpenseResponse, BudgetUpdate
from app.services.budget_service import BudgetService

router = APIRouter(prefix="/budget", tags=["Budget"])

@router.get("/summary", response_model=BudgetSummaryResponse)
async def get_budget_summary(db: AsyncSession = Depends(get_db)):
    """Retrieve monthly spending cap, spent amount, remaining balance, and planned purchases"""
    return await BudgetService.get_summary(db)

@router.post("/expenses", response_model=ExpenseResponse)
async def log_expense(
    data: ExpenseCreate,
    db: AsyncSession = Depends(get_db)
):
    """Log an expense (optionally tied to a task)"""
    return await BudgetService.log_expense(db, data)

@router.patch("/settings")
async def update_budget_settings(
    settings_data: BudgetUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Update user monthly budget cap and currency"""
    user = await BudgetService.update_budget(db, settings_data.monthly_budget, settings_data.currency or "EUR")
    return {
        "monthly_budget": user.monthly_budget,
        "currency": user.currency,
        "message": "Budget settings updated"
    }
