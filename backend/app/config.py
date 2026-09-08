import os
from typing import List
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Intelligent Personal Action App"
    DEBUG: bool = True
    ENVIRONMENT: str = "development"
    
    SECRET_KEY: str = "dev-secret-key-replace-in-production-random-token-xyz-12345"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 43200  # 30 days
    
    DATABASE_URL: str = "sqlite+aiosqlite:///./data/app.db"
    
    AI_PROVIDER: str = "heuristic"
    GEMINI_API_KEY: str = ""
    OPENAI_API_KEY: str = ""
    
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173"

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()
