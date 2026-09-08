from fastapi import APIRouter

router = APIRouter(tags=["Health"])

@router.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "Intelligent Personal Action App API",
        "version": "1.0.0"
    }
