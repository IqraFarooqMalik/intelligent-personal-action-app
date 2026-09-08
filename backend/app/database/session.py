import os
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from app.config import settings

# Ensure data directory exists for SQLite
if "sqlite" in settings.DATABASE_URL:
    db_path = settings.DATABASE_URL.replace("sqlite+aiosqlite:///", "")
    db_dir = os.path.dirname(db_path)
    if db_dir and not os.path.exists(db_dir):
        os.makedirs(db_dir, exist_ok=True)

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    connect_args={"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {}
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False
)

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency for obtaining an asynchronous database session"""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
