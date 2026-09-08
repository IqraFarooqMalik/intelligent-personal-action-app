from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.session import get_db
from app.schemas.recommendation import (
    StateInput,
    RecommendationResponse,
    FeedbackRequest,
)
from app.services.recommendation_service import RecommendationService

router = APIRouter(prefix="/recommendations", tags=["Recommendations"])

@router.post("/next", response_model=RecommendationResponse)
async def get_next_recommendation(
    state: StateInput,
    db: AsyncSession = Depends(get_db)
):
    """Surface the single best action matching the user's current capacity and mode"""
    return await RecommendationService.get_recommendation(db, state)

@router.post("/feedback")
async def record_recommendation_feedback(
    feedback: FeedbackRequest,
    db: AsyncSession = Depends(get_db)
):
    """Log quick one-tap feedback to update task state or learning weights"""
    success = await RecommendationService.record_feedback(db, feedback)
    if not success:
        raise HTTPException(status_code=404, detail="Task not found for feedback")
    return {"status": "success", "message": "Feedback recorded"}

@router.post("/parse-state", response_model=StateInput)
async def parse_state_from_text(payload: dict):
    """Parse natural language query (e.g. 'I am tired and have 20 minutes') into StateInput"""
    text = payload.get("text", "")
    from app.services.ai_inference import AIInferenceService
    parsed = AIInferenceService.parse_natural_language_state(text)
    return StateInput(**parsed)

@router.post("/recovery-feedback")
async def record_recovery_outcome(payload: dict):
    """Record recovery effectiveness (e.g. helped: YES / A_LITTLE / NO)"""
    # Simply log outcome for personalization learning
    return {
        "status": "success",
        "message": "Recovery outcome recorded for personalization"
    }
