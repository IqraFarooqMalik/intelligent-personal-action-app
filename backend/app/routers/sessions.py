from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from sqlalchemy.orm import selectinload
from app.database.session import get_db
from app.models.session import ActiveSession, ImpulseDetour, SessionStatus, ImpulseAction
from app.models.task import Task, TaskStatus
from app.schemas.session import SessionStartRequest, ImpulseRequest, SessionResponse
from app.schemas.task import QuickCaptureRequest
from app.services.task_service import TaskService

router = APIRouter(prefix="/sessions", tags=["Sessions"])

@router.get("/active", response_model=SessionResponse)
async def get_active_session(db: AsyncSession = Depends(get_db)):
    """Retrieve currently active or paused session if any"""
    query = (
        select(ActiveSession)
        .options(selectinload(ActiveSession.task).selectinload(Task.steps))
        .filter(ActiveSession.status.in_([SessionStatus.ACTIVE, SessionStatus.PAUSED]))
        .order_by(desc(ActiveSession.started_at))
        .limit(1)
    )
    result = await db.execute(query)
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="No active session found")
    return session

@router.post("/start", response_model=SessionResponse)
async def start_session(
    request: SessionStartRequest,
    db: AsyncSession = Depends(get_db)
):
    """Begin an active work session on a task"""
    # Check if task exists
    task = await TaskService.get_task(db, request.task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    # Mark task as in progress
    task.status = TaskStatus.IN_PROGRESS

    # Create session
    session = ActiveSession(
        user_id=task.user_id,
        task_id=task.id,
        status=SessionStatus.ACTIVE,
        started_at=datetime.utcnow(),
        checkpoint_step_title=request.checkpoint_step_title,
        resume_note=request.resume_note
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)
    
    # Load relationships
    return await get_active_session(db)

@router.post("/pause", response_model=SessionResponse)
async def pause_session(
    resume_note: str = "",
    checkpoint_step: str = "",
    db: AsyncSession = Depends(get_db)
):
    """Save return checkpoint and pause active session for a break"""
    session = await get_active_session(db)
    session.status = SessionStatus.PAUSED
    session.paused_at = datetime.utcnow()
    if resume_note:
        session.resume_note = resume_note
    if checkpoint_step:
        session.checkpoint_step_title = checkpoint_step
    
    await db.commit()
    await db.refresh(session)
    return session

@router.post("/resume", response_model=SessionResponse)
async def resume_session(db: AsyncSession = Depends(get_db)):
    """Resume a paused session with return bridge context"""
    session = await get_active_session(db)
    session.status = SessionStatus.ACTIVE
    session.paused_at = None
    await db.commit()
    await db.refresh(session)
    return session

@router.post("/complete", response_model=SessionResponse)
async def complete_session(db: AsyncSession = Depends(get_db)):
    """Finish the session and mark task as completed"""
    session = await get_active_session(db)
    session.status = SessionStatus.COMPLETED
    session.ended_at = datetime.utcnow()
    
    task = await TaskService.get_task(db, session.task_id)
    if task:
        task.status = TaskStatus.COMPLETED

    await db.commit()
    await db.refresh(session)
    return session

@router.post("/impulse")
async def handle_runtime_impulse(
    request: ImpulseRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Handle impulse captured while in an active session:
    - DO_NOW: pauses active task, creates checkpoint, starts detour
    - AFTER_BLOCK / LATER: captures task into inbox
    """
    # 1. Quick capture the impulse
    impulse_task = await TaskService.quick_capture(
        db,
        QuickCaptureRequest(title=request.thought, execution_context=request.execution_context)
    )

    # 2. Check active session
    try:
        session = await get_active_session(db)
    except HTTPException:
        session = None

    if session and request.action == ImpulseAction.DO_NOW:
        # Save return checkpoint
        session.status = SessionStatus.PAUSED
        session.paused_at = datetime.utcnow()
        session.resume_note = f"Paused for immediate impulse: {impulse_task.title}"
        
        # Log detour
        detour = ImpulseDetour(
            session_id=session.id,
            impulse_task_id=impulse_task.id,
            action=ImpulseAction.DO_NOW,
            started_at=datetime.utcnow()
        )
        db.add(detour)
        await db.commit()
        return {
            "action": "DO_NOW",
            "message": f"Paused active task. Starting detour: {impulse_task.title}",
            "impulse_task": impulse_task,
            "session_id": session.id
        }
    
    return {
        "action": request.action.value,
        "message": f"Impulse saved safely for {request.action.value.lower()}.",
        "impulse_task": impulse_task
    }
