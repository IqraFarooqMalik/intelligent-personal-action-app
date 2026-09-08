from datetime import datetime
from sqlalchemy import Column, DateTime, Integer
from sqlalchemy.orm import declarative_base

Base = declarative_base()

class TimestampMixin:
    """Standard timestamp mixin for all database models"""
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
