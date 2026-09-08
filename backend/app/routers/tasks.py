from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database.session import get_db
from app.models.task import TaskStatus, TaskType
from app.models.step import TaskStep
from app.schemas.task import (
    QuickCaptureRequest,
    TaskResponse,
    TaskUpdate,
    TaskStepResponse,
)
from app.services.task_service import TaskService

router = APIRouter(prefix="/tasks", tags=["Tasks"])

@router.post("/quick-capture", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def quick_capture(
    request: QuickCaptureRequest,
    db: AsyncSession = Depends(get_db)
):
    """Frictionless quick capture endpoint. Incurs instant AI/heuristic enrichment."""
    return await TaskService.quick_capture(db, request)

@router.get("", response_model=List[TaskResponse])
async def list_tasks(
    status: Optional[TaskStatus] = None,
    task_type: Optional[TaskType] = None,
    limit: int = 100,
    db: AsyncSession = Depends(get_db)
):
    """List tasks with optional filtering"""
    return await TaskService.list_tasks(db, status=status, task_type=task_type, limit=limit)

@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(task_id: int, db: AsyncSession = Depends(get_db)):
    """Retrieve single task details with decomposed steps"""
    task = await TaskService.get_task(db, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task

@router.patch("/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: int,
    updates: TaskUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Update task attributes or apply user corrections to AI-inferred values"""
    updated = await TaskService.update_task(db, task_id, updates)
    if not updated:
        raise HTTPException(status_code=404, detail="Task not found")
    return updated

@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(task_id: int, db: AsyncSession = Depends(get_db)):
    """Remove a task"""
    deleted = await TaskService.delete_task(db, task_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Task not found")
    return None

@router.post("/{task_id}/complete", response_model=TaskResponse)
async def complete_task(task_id: int, db: AsyncSession = Depends(get_db)):
    """Mark a task as completed"""
    task = await TaskService.get_task(db, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    task.status = TaskStatus.COMPLETED
    await db.commit()
    await db.refresh(task)
    return task

@router.post("/{task_id}/steps/{step_id}/toggle", response_model=TaskStepResponse)
async def toggle_step(task_id: int, step_id: int, db: AsyncSession = Depends(get_db)):
    """Toggle step completion state"""
    result = await db.execute(select(TaskStep).filter(TaskStep.id == step_id, TaskStep.task_id == task_id))
    step = result.scalar_one_or_none()
    if not step:
        raise HTTPException(status_code=404, detail="Step not found")
    step.is_completed = not step.is_completed
    await db.commit()
    await db.refresh(step)
    return step
