from typing import Optional, Dict, Any
from pydantic import BaseModel, EmailStr

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    monthly_budget: Optional[float] = 0.0
    currency: Optional[str] = "EUR"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class UserResponse(BaseModel):
    id: int
    email: str
    monthly_budget: float
    currency: str
    preferences: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True
