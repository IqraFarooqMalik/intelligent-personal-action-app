import random
from typing import Optional, List, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.models.task import Task, TaskStatus, EnergyLevel, FocusLevel, CostType
from app.schemas.recommendation import StateInput, RecommendationResponse, RecommendationMode, FeedbackRequest, FeedbackType
from app.schemas.task import TaskResponse, TaskStepResponse

class RecommendationService:

    LEVEL_VALUES = {
        "LOW": 1,
        "MEDIUM": 2,
        "HIGH": 3,
        "NONE": 0
    }

    @classmethod
    def _level_match(cls, user_level: str, task_level: str) -> float:
        u = cls.LEVEL_VALUES.get(user_level, 2)
        t = cls.LEVEL_VALUES.get(task_level, 2)
        if u == t:
            return 1.0
        elif u > t:
            return 0.8  # User has capacity headroom
        else:
            return 0.2  # Task demands more than user currently has

    @classmethod
    async def get_recommendation(cls, db: AsyncSession, state: StateInput) -> RecommendationResponse:
        """Execute two-stage filtering and personalized scoring to surface 1 top action"""
        # 1. Fetch actionable candidates
        query = (
            select(Task)
            .options(selectinload(Task.steps))
            .filter(Task.status.in_([TaskStatus.READY, TaskStatus.INBOX, TaskStatus.POSTPONED]))
        )
        result = await db.execute(query)
        candidates: List[Task] = result.scalars().all()

        if not candidates:
            return RecommendationResponse(
                task=None,
                reason="No active tasks in your inbox. Capture a new thought to get started!",
                score=0.0,
                alternative_count=0
            )

        # 2. Stage 1: Hard Filtering
        filtered: List[Task] = []
        for task in candidates:
            # Duration check (if task duration is known and exceeds available time, check if it has a splittable step)
            duration = task.estimated_duration or 15
            if duration > state.available_time_minutes:
                # If task has a small sub-step that fits, keep it
                has_fitting_step = any(s.estimated_duration <= state.available_time_minutes for s in task.steps)
                if not has_fitting_step:
                    continue

            # Budget constraint check
            if not state.spending_allowed and task.cost_type == CostType.PAID:
                continue

            filtered.append(task)

        if not filtered:
            # Relax duration constraint to minimum useful versions
            filtered = candidates

        # 3. Stage 2: Mode-based Scoring & Ranking
        scored: List[Tuple[Task, float, str]] = []

        for task in filtered:
            energy_score = cls._level_match(state.energy.value, task.energy_level.value)
            focus_score = cls._level_match(state.focus.value, task.focus_level.value)
            
            # Neglect boost
            neglect_boost = min(task.postpone_count * 0.1, 0.5)

            # Base score
            base_score = (energy_score * 0.4) + (focus_score * 0.3) + neglect_boost

            # Mode modifications
            reasons = []
            if state.mode == RecommendationMode.QUICK_WIN:
                duration = task.estimated_duration or 15
                if duration <= 15:
                    base_score += 1.0
                    reasons.append("quick win under 15 minutes")
            elif state.mode == RecommendationMode.LOW_EFFORT:
                if task.energy_level == EnergyLevel.LOW:
                    base_score += 1.0
                    reasons.append("minimal energy required")
            elif state.mode == RecommendationMode.RECOVERY:
                if task.is_reusable or task.task_type.value in ["RECOVERY", "COMFORT"]:
                    base_score += 1.5
                    reasons.append("designed for restorative rest")
            else:
                reasons.append(f"matches your {state.energy.value.lower()} energy and {state.available_time_minutes}m time window")

            if task.postpone_count > 0:
                reasons.append(f"postponed {task.postpone_count}x previously")

            reason_str = "Recommended because: " + ", ".join(reasons)
            scored.append((task, base_score, reason_str))

        # Sort descending by score
        scored.sort(key=lambda x: x[1], reverse=True)

        # Selection
        if state.mode == RecommendationMode.SURPRISE_ME and len(scored) > 1:
            top_candidates = scored[:min(5, len(scored))]
            chosen_task, score, reason = random.choice(top_candidates)
        else:
            chosen_task, score, reason = scored[0]

        # Identify suggested step if any
        suggested_step = None
        if chosen_task.steps:
            # Find first uncompleted step or minimum useful step
            for step in chosen_task.steps:
                if not step.is_completed:
                    suggested_step = TaskStepResponse.model_validate(step)
                    break

        return RecommendationResponse(
            task=TaskResponse.model_validate(chosen_task),
            reason=reason,
            suggested_step=suggested_step,
            score=round(score, 2),
            alternative_count=len(scored) - 1
        )

    @classmethod
    async def record_feedback(cls, db: AsyncSession, feedback: FeedbackRequest) -> bool:
        """Handle 1-tap feedback: increment postpone counts or update status"""
        result = await db.execute(select(Task).filter(Task.id == feedback.task_id))
        task = result.scalar_one_or_none()
        if not task:
            return False

        if feedback.feedback == FeedbackType.NOT_NOW:
            task.postpone_count += 1
            task.status = TaskStatus.POSTPONED
        elif feedback.feedback == FeedbackType.ACCEPTED:
            task.status = TaskStatus.IN_PROGRESS
        
        await db.commit()
        return True
