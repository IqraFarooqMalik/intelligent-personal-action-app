import pytest
from app.services.ai_inference import AIInferenceService
from app.models.task import TaskType, EnergyLevel, CostType, LocationRequirement

@pytest.mark.asyncio
async def test_infer_recovery_task():
    result = await AIInferenceService.infer_metadata("10-minute stretching")
    assert result["task_type"] == TaskType.RECOVERY
    assert result["energy_level"] == EnergyLevel.LOW
    assert result["estimated_duration"] == 10
    assert result["is_reusable"] is True
    assert "tired" in result["good_for"]
    assert result["minimum_step"] is not None

@pytest.mark.asyncio
async def test_infer_purchase_task():
    result = await AIInferenceService.infer_metadata("Buy running shoes", "research online and compare models")
    assert result["task_type"] == TaskType.PURCHASE
    assert result["cost_type"] == CostType.PAID
    assert result["splittable"] is True
    assert len(result["steps"]) > 0

@pytest.mark.asyncio
async def test_infer_work_task():
    result = await AIInferenceService.infer_metadata("Finish office report", "write quarterly summary")
    assert result["task_type"] == TaskType.WORK
    assert result["energy_level"] == EnergyLevel.HIGH
    assert result["minimum_step"] is not None
