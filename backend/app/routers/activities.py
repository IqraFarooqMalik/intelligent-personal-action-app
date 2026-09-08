from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database.session import get_db
from app.models.task import Task, TaskType, TaskStatus
from app.schemas.task import TaskResponse

router = APIRouter(prefix="/activities", tags=["Activities"])

@router.get("/recovery", response_model=List[TaskResponse])
async def list_recovery_activities(db: AsyncSession = Depends(get_db)):
    """Fetch reusable recovery activities (stretching, walk, water, breathing)"""
    query = (
        select(Task)
        .filter(
            Task.task_type.in_([TaskType.RECOVERY, TaskType.COMFORT, TaskType.ROUTINE])
            | (Task.is_reusable == True)
        )
    )
    result = await db.execute(query)
    return result.scalars().all()
