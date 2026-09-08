from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from sqlalchemy.orm import selectinload
from app.models.task import Task, TaskStatus, TaskType
from app.models.step import TaskStep
from app.models.user import User
from app.schemas.task import QuickCaptureRequest, TaskUpdate
from app.services.ai_inference import AIInferenceService

class TaskService:

    @classmethod
    async def get_or_create_default_user(cls, db: AsyncSession) -> User:
        """Ensures a default user exists for immediate, zero-friction local development"""
        result = await db.execute(select(User).limit(1))
        user = result.scalar_one_or_none()
        if not user:
            user = User(
                email="me@intelligent-action.local",
                hashed_password="local_development_mode",
                monthly_budget=500.0,
                currency="EUR",
                preferences={"energy_peak": "morning"}
            )
            db.add(user)
            await db.commit()
            await db.refresh(user)
        return user

    @classmethod
    async def quick_capture(cls, db: AsyncSession, request: QuickCaptureRequest) -> Task:
        """Sub-second quick capture with automatic AI inference and minimum useful step derivation"""
        user = await cls.get_or_create_default_user(db)
        
        # 1. Infer metadata via AI / Heuristic Service
        inferred = await AIInferenceService.infer_metadata(request.title, request.execution_context)
        
        # 2. Instantiate Task
        task = Task(
            user_id=user.id,
            title=request.title.strip(),
            execution_context=request.execution_context.strip() if request.execution_context else None,
            status=TaskStatus.READY,
            task_type=inferred["task_type"],
            estimated_duration=inferred["estimated_duration"],
            energy_level=inferred["energy_level"],
            focus_level=inferred["focus_level"],
            social_level=inferred["social_level"],
            activation_difficulty=inferred["activation_difficulty"],
            cost_type=inferred["cost_type"],
            estimated_cost=inferred["estimated_cost"],
            location_requirement=inferred["location_requirement"],
            device_requirement=inferred["device_requirement"],
            is_reusable=inferred["is_reusable"],
            splittable=inferred["splittable"],
            good_for=inferred["good_for"],
            provenance=inferred["provenance"]
        )
        db.add(task)
        await db.flush()  # get task.id

        # 3. Create minimum useful step & decomposed steps
        if inferred.get("steps"):
            for step_data in inferred["steps"]:
                step = TaskStep(
                    task_id=task.id,
                    title=step_data["title"],
                    order=step_data["order"],
                    estimated_duration=step_data["estimated_duration"],
                    is_minimum_useful=step_data.get("is_minimum_useful", False)
                )
                db.add(step)
        elif inferred.get("minimum_step"):
            min_step = TaskStep(
                task_id=task.id,
                title=inferred["minimum_step"],
                order=1,
                estimated_duration=min(5, inferred["estimated_duration"] or 5),
                is_minimum_useful=True
            )
            db.add(min_step)

        await db.commit()
        await db.refresh(task)

        # Load with steps relationship
        return await cls.get_task(db, task.id)

    @classmethod
    async def list_tasks(
        cls,
        db: AsyncSession,
        status: Optional[TaskStatus] = None,
        task_type: Optional[TaskType] = None,
        limit: int = 100
    ) -> List[Task]:
        """Fetch tasks with steps loaded, newest first"""
        query = select(Task).options(selectinload(Task.steps)).order_by(desc(Task.created_at)).limit(limit)
        if status:
            query = query.filter(Task.status == status)
        if task_type:
            query = query.filter(Task.task_type == task_type)
        result = await db.execute(query)
        return result.scalars().all()

    @classmethod
    async def get_task(cls, db: AsyncSession, task_id: int) -> Optional[Task]:
        """Fetch a single task by ID with steps"""
        query = select(Task).options(selectinload(Task.steps)).filter(Task.id == task_id)
        result = await db.execute(query)
        return result.scalar_one_or_none()

    @classmethod
    async def update_task(cls, db: AsyncSession, task_id: int, updates: TaskUpdate) -> Optional[Task]:
        """Apply user corrections to task metadata"""
        task = await cls.get_task(db, task_id)
        if not task:
            return None

        update_data = updates.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(task, key, value)
        
        # Track provenance if user modified metadata
        prov = dict(task.provenance or {})
        prov["user_modified"] = True
        task.provenance = prov

        await db.commit()
        await db.refresh(task)
        return task

    @classmethod
    async def delete_task(cls, db: AsyncSession, task_id: int) -> bool:
        """Delete task by ID"""
        task = await cls.get_task(db, task_id)
        if not task:
            return False
        await db.delete(task)
        await db.commit()
        return True
