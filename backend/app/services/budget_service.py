from datetime import datetime
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from app.models.budget import BudgetExpense
from app.models.task import Task, TaskType, TaskStatus
from app.models.user import User
from app.schemas.budget import ExpenseCreate, BudgetSummaryResponse, ExpenseResponse
from app.services.task_service import TaskService

class BudgetService:

    @classmethod
    async def get_summary(cls, db: AsyncSession) -> BudgetSummaryResponse:
        user = await TaskService.get_or_create_default_user(db)
        
        # 1. Total spent this month
        now = datetime.utcnow()
        month_start = datetime(now.year, now.month, 1)
        
        spent_query = (
            select(func.sum(BudgetExpense.amount))
            .filter(BudgetExpense.user_id == user.id, BudgetExpense.created_at >= month_start)
        )
        spent_result = await db.execute(spent_query)
        spent_this_month = spent_result.scalar() or 0.0

        # 2. Planned purchases total
        purchase_query = (
            select(func.sum(Task.estimated_cost))
            .filter(
                Task.user_id == user.id,
                Task.task_type == TaskType.PURCHASE,
                Task.status.in_([TaskStatus.INBOX, TaskStatus.READY, TaskStatus.UNDERSTOOD])
            )
        )
        purchase_result = await db.execute(purchase_query)
        planned_total = purchase_result.scalar() or 0.0

        # 3. Recent expenses
        expenses_query = (
            select(BudgetExpense)
            .filter(BudgetExpense.user_id == user.id)
            .order_by(desc(BudgetExpense.created_at))
            .limit(10)
        )
        exp_result = await db.execute(expenses_query)
        recent = exp_result.scalars().all()

        remaining = max(0.0, user.monthly_budget - spent_this_month)

        return BudgetSummaryResponse(
            monthly_budget=user.monthly_budget,
            currency=user.currency,
            spent_this_month=round(spent_this_month, 2),
            remaining_budget=round(remaining, 2),
            planned_purchases_total=round(planned_total, 2),
            recent_expenses=[ExpenseResponse.model_validate(e) for e in recent]
        )

    @classmethod
    async def log_expense(cls, db: AsyncSession, data: ExpenseCreate) -> BudgetExpense:
        user = await TaskService.get_or_create_default_user(db)
        expense = BudgetExpense(
            user_id=user.id,
            title=data.title.strip(),
            amount=data.amount,
            category=data.category or "General",
            task_id=data.task_id
        )
        db.add(expense)
        await db.commit()
        await db.refresh(expense)
        return expense

    @classmethod
    async def update_budget(cls, db: AsyncSession, monthly_budget: float, currency: str = "EUR") -> User:
        user = await TaskService.get_or_create_default_user(db)
        user.monthly_budget = monthly_budget
        user.currency = currency
        await db.commit()
        await db.refresh(user)
        return user
