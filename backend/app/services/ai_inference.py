import re
from typing import Dict, Any, List, Optional
from app.models.task import (
    TaskType,
    EnergyLevel,
    FocusLevel,
    SocialLevel,
    ActivationDifficulty,
    CostType,
    LocationRequirement,
    DeviceRequirement,
)
from app.config import settings

class AIInferenceService:
    """
    Dual-mode inference service:
    1. Heuristics Engine (Offline, deterministic, zero-cost, instant)
    2. Cloud LLM Engine (Gemini / OpenAI API when configured)
    """

    @classmethod
    async def infer_metadata(cls, title: str, execution_context: Optional[str] = None) -> Dict[str, Any]:
        """Infer task metadata and actionable starting step from title and context"""
        # If API key configured and provider enabled, can call LLM; otherwise fallback to heuristics
        if settings.AI_PROVIDER in ["gemini", "openai"] and (settings.GEMINI_API_KEY or settings.OPENAI_API_KEY):
            try:
                return await cls._call_llm(title, execution_context)
            except Exception:
                # Gracefully fallback on network or API failure
                return cls._infer_heuristics(title, execution_context)
        return cls._infer_heuristics(title, execution_context)

    @classmethod
    def _infer_heuristics(cls, title: str, execution_context: Optional[str] = None) -> Dict[str, Any]:
        text = f"{title} {execution_context or ''}".lower()
        
        # 1. Detect explicit time patterns (e.g. "10-minute", "15 min", "2 hours", "half hour")
        duration = 15
        time_min_match = re.search(r'(\d+)\s*(?:min|minute|minutes)', text)
        time_hour_match = re.search(r'(\d+(?:\.\d+)?)\s*(?:h|hr|hour|hours)', text)
        if time_min_match:
            duration = int(time_min_match.group(1))
        elif time_hour_match:
            duration = int(float(time_hour_match.group(1)) * 60)
        elif "quick" in text:
            duration = 5

        # 2. Defaults
        task_type = TaskType.ONE_TIME
        energy = EnergyLevel.MEDIUM
        focus = FocusLevel.MEDIUM
        social = SocialLevel.NONE
        activation = ActivationDifficulty.MEDIUM
        cost_type = CostType.FREE
        estimated_cost = 0.0
        location = LocationRequirement.ANY
        device = DeviceRequirement.NONE
        is_reusable = False
        splittable = False
        good_for = []
        minimum_step = f"Open or prepare the first detail for '{title}'"
        steps: List[Dict[str, Any]] = []

        # 3. Domain Rules
        # Self-care / Recovery / Reusable
        if any(k in text for k in ["stretch", "walk", "nap", "breathe", "water", "tea", "shower"]):
            task_type = TaskType.RECOVERY
            energy = EnergyLevel.LOW
            focus = FocusLevel.LOW
            activation = ActivationDifficulty.LOW
            is_reusable = True
            location = LocationRequirement.OUTSIDE if "walk" in text else LocationRequirement.HOME
            good_for = ["tired", "stiff", "restless"]
            minimum_step = "Take 3 deep breaths and start the first 2 minutes"
            if "stretch" in text:
                duration = duration if time_min_match else 10
                minimum_step = "Stand up and do one light shoulder roll"
            elif "walk" in text:
                duration = duration if time_min_match else 20
                minimum_step = "Put on your walking shoes and step outside"
            elif "nap" in text:
                duration = 20
                minimum_step = "Lie down and set a 20-minute gentle alarm"

        # Comfort / Leisure
        elif any(k in text for k in ["friends", "movie", "watch", "show", "game", "read fiction"]):
            task_type = TaskType.COMFORT
            energy = EnergyLevel.LOW
            focus = FocusLevel.LOW
            activation = ActivationDifficulty.LOW
            is_reusable = True
            location = LocationRequirement.HOME
            duration = duration if time_min_match else 25
            good_for = ["stressed", "overwhelmed"]
            minimum_step = "Select one episode and set an intentional end time"

        # Purchases & Shopping
        elif any(k in text for k in ["buy", "purchase", "order", "shop", "shoes", "laptop"]):
            task_type = TaskType.PURCHASE
            cost_type = CostType.PAID
            estimated_cost = 50.0  # sensible baseline
            
            # Check context: simple online purchase vs extensive research
            if any(k in text for k in ["research", "compare", "visit store", "try"]):
                duration = 120
                energy = EnergyLevel.MEDIUM
                focus = FocusLevel.MEDIUM
                activation = ActivationDifficulty.MEDIUM
                splittable = True
                location = LocationRequirement.ANY
                device = DeviceRequirement.LAPTOP
                minimum_step = "Open a browser tab and find the top 2 candidate models"
                steps = [
                    {"title": "Research suitable models and compare reviews", "order": 1, "estimated_duration": 30, "is_minimum_useful": True},
                    {"title": "Compare prices across major stores", "order": 2, "estimated_duration": 20, "is_minimum_useful": False},
                    {"title": "Visit store or finalize checkout", "order": 3, "estimated_duration": 40, "is_minimum_useful": False},
                ]
            else:
                duration = 10
                energy = EnergyLevel.LOW
                focus = FocusLevel.LOW
                activation = ActivationDifficulty.LOW
                device = DeviceRequirement.PHONE
                minimum_step = "Open shopping site and add item to cart"

        # Work / Deep Focus / Reports
        elif any(k in text for k in ["report", "code", "coding", "bug", "feature", "document", "office", "presentation"]):
            task_type = TaskType.WORK
            duration = duration if time_min_match else 60
            energy = EnergyLevel.HIGH
            focus = FocusLevel.HIGH
            activation = ActivationDifficulty.HIGH
            device = DeviceRequirement.LAPTOP
            location = LocationRequirement.OFFICE
            splittable = True
            minimum_step = "Open the document and review the last section worked on"
            steps = [
                {"title": "Open document and review notes", "order": 1, "estimated_duration": 5, "is_minimum_useful": True},
                {"title": "Draft the next 3 key bullet points", "order": 2, "estimated_duration": 20, "is_minimum_useful": False},
                {"title": "Review and finalize section", "order": 3, "estimated_duration": 25, "is_minimum_useful": False},
            ]

        # Errands & Chores
        elif any(k in text for k in ["clean", "kitchen", "dishes", "laundry", "trash", "groceries", "store"]):
            task_type = TaskType.ERRAND
            duration = duration if time_min_match else 20
            energy = EnergyLevel.MEDIUM
            focus = FocusLevel.LOW
            activation = ActivationDifficulty.MEDIUM
            location = LocationRequirement.HOME if "store" not in text and "groceries" not in text else LocationRequirement.OUTSIDE
            if "trash" in text:
                duration = 5
                activation = ActivationDifficulty.LOW
                minimum_step = "Tie the bag and take it to the door"
            elif "kitchen" in text or "dishes" in text:
                minimum_step = "Clear just 3 dishes or wipe one counter surface"
            else:
                minimum_step = "Make a quick 3-item checklist"

        # Social / Communication
        elif any(k in text for k in ["call", "reply", "email", "message", "sarah", "talk"]):
            task_type = TaskType.ONE_TIME
            duration = duration if time_min_match else 10
            social = SocialLevel.HIGH if "call" in text else SocialLevel.MEDIUM
            activation = ActivationDifficulty.HIGH if "email" in text or "reply" in text else ActivationDifficulty.MEDIUM
            device = DeviceRequirement.PHONE
            minimum_step = "Open message thread and read the last received message"

        # Someday / Maybe
        elif any(k in text for k in ["someday", "maybe", "pottery", "learn piano", "learn language"]):
            task_type = TaskType.SOMEDAY
            duration = 60
            energy = EnergyLevel.MEDIUM
            focus = FocusLevel.HIGH
            minimum_step = "Bookmark one introductory guide or video"

        return {
            "task_type": task_type,
            "estimated_duration": duration,
            "energy_level": energy,
            "focus_level": focus,
            "social_level": social,
            "activation_difficulty": activation,
            "cost_type": cost_type,
            "estimated_cost": estimated_cost,
            "location_requirement": location,
            "device_requirement": device,
            "is_reusable": is_reusable,
            "splittable": splittable,
            "good_for": good_for,
            "minimum_step": minimum_step,
            "steps": steps,
            "provenance": {"source": "HEURISTIC_INFERRED", "confidence": 0.85}
        }

    @classmethod
    async def _call_llm(cls, title: str, execution_context: Optional[str] = None) -> Dict[str, Any]:
        """Placeholder for external structured LLM call (Gemini or OpenAI)"""
        # In this implementation, returns heuristics if API is unreachable
        return cls._infer_heuristics(title, execution_context)

    @classmethod
    def parse_natural_language_state(cls, text: str) -> Dict[str, Any]:
        """Convert natural-language state input into structured capacity values"""
        lower = text.lower()

        # 1. Energy
        energy = EnergyLevel.MEDIUM
        if any(w in lower for w in ["tired", "exhausted", "drained", "sleepy", "low energy", "burned out", "lazy"]):
            energy = EnergyLevel.LOW
        elif any(w in lower for w in ["motivated", "high energy", "pumped", "wired", "ready to work", "focused"]):
            energy = EnergyLevel.HIGH

        # 2. Focus
        focus = FocusLevel.MEDIUM
        if any(w in lower for w in ["scattered", "brain fog", "foggy", "distracted", "can't focus", "low focus"]):
            focus = FocusLevel.LOW
        elif any(w in lower for w in ["sharp", "deep focus", "zoned in", "creative"]):
            focus = FocusLevel.HIGH

        # 3. Social Battery
        social = SocialLevel.NONE
        if any(w in lower for w in ["no people", "don't want to talk", "alone", "quiet", "introvert"]):
            social = SocialLevel.NONE
        elif any(w in lower for w in ["social", "with friends", "talk", "people", "outgoing"]):
            social = SocialLevel.HIGH

        # 4. Available Time
        available_time = 30
        time_min_match = re.search(r'(\d+)\s*(?:min|minute|minutes)', lower)
        time_hour_match = re.search(r'(\d+(?:\.\d+)?)\s*(?:h|hr|hour|hours)', lower)
        if time_min_match:
            available_time = int(time_min_match.group(1))
        elif time_hour_match:
            available_time = int(float(time_hour_match.group(1)) * 60)
        elif "quick" in lower:
            available_time = 15

        # 5. Budget constraint
        spending_allowed = True
        if any(w in lower for w in ["free", "no money", "spend nothing", "broke", "zero cost"]):
            spending_allowed = False

        # 6. Mode
        mode = "BEST_MATCH"
        if any(w in lower for w in ["recover", "rest", "tired", "recharge", "break"]):
            mode = "RECOVERY"
        elif any(w in lower for w in ["surprise", "random"]):
            mode = "SURPRISE_ME"
        elif any(w in lower for w in ["quick", "short", "fast"]):
            mode = "QUICK_WIN"
        elif any(w in lower for w in ["easy", "low effort", "simple"]):
            mode = "LOW_EFFORT"

        return {
            "energy": energy,
            "focus": focus,
            "social_battery": social,
            "available_time_minutes": available_time,
            "spending_allowed": spending_allowed,
            "current_location": LocationRequirement.HOME,
            "mode": mode
        }
