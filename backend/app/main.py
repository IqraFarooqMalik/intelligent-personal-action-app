from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select

from app.config import settings
from app.database.base import Base
from app.database.session import engine, AsyncSessionLocal
from app.models import Task, TaskType, EnergyLevel, FocusLevel, CostType, LocationRequirement
from app.services.task_service import TaskService
from app.routers import health, tasks, recommendations, sessions, budget, activities

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. Initialize SQLite tables on startup
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # 2. Ensure default user and seed helpful starter recovery activities
    async with AsyncSessionLocal() as db:
        user = await TaskService.get_or_create_default_user(db)
        # Check if tasks exist
        existing = await db.execute(select(Task).limit(1))
        if not existing.scalar_one_or_none():
            seed_tasks = [
                Task(
                    user_id=user.id,
                    title="10-minute mindful stretching",
                    execution_context="Follow gentle full-body mobility routine",
                    task_type=TaskType.RECOVERY,
                    estimated_duration=10,
                    energy_level=EnergyLevel.LOW,
                    focus_level=FocusLevel.LOW,
                    cost_type=CostType.FREE,
                    location_requirement=LocationRequirement.HOME,
                    is_reusable=True,
                    good_for=["tired", "stiff", "restless"]
                ),
                Task(
                    user_id=user.id,
                    title="Quick 15-minute walk outside",
                    execution_context="Get fresh air and change of environment",
                    task_type=TaskType.RECOVERY,
                    estimated_duration=15,
                    energy_level=EnergyLevel.LOW,
                    focus_level=FocusLevel.LOW,
                    cost_type=CostType.FREE,
                    location_requirement=LocationRequirement.OUTSIDE,
                    is_reusable=True,
                    good_for=["mental fatigue", "brain fog"]
                ),
                Task(
                    user_id=user.id,
                    title="Clear kitchen counter and wash 3 dishes",
                    execution_context="Low activation chore to reset space",
                    task_type=TaskType.ERRAND,
                    estimated_duration=10,
                    energy_level=EnergyLevel.MEDIUM,
                    focus_level=FocusLevel.LOW,
                    cost_type=CostType.FREE,
                    location_requirement=LocationRequirement.HOME,
                    is_reusable=False,
                    good_for=["stuck", "low momentum"]
                )
            ]
            db.add_all(seed_tasks)
            await db.commit()

    yield
    # Shutdown
    await engine.dispose()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    lifespan=lifespan
)

# CORS Configuration for local Vite PWA
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Attach Routers under /api
app.include_router(health.router, prefix="/api")
app.include_router(tasks.router, prefix="/api")
app.include_router(recommendations.router, prefix="/api")
app.include_router(sessions.router, prefix="/api")
app.include_router(budget.router, prefix="/api")
app.include_router(activities.router, prefix="/api")

@app.get("/")
async def root():
    return {
        "app": settings.PROJECT_NAME,
        "docs": "/docs",
        "api_health": "/api/health"
    }
