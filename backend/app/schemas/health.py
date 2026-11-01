"""
Health Check and System Status Pydantic Schemas
"""

from typing import Dict, Any, List
from pydantic import BaseModel, Field


class DatabaseHealth(BaseModel):
    status: str = Field(..., example="connected")
    database_type: str = Field(..., example="postgresql")
    url: str = Field(..., example="localhost:5432/cartcraft_db")
    error: str | None = None


class HealthResponse(BaseModel):
    status: str = Field(..., example="ok")
    app_name: str = Field(..., example="CartCraft Online Shopping System")
    version: str = Field(..., example="1.0.0")
    timestamp: str
    database: DatabaseHealth


class SystemInfoResponse(BaseModel):
    project_name: str
    version: str
    phase: str
    modules_ready: List[str]
    upcoming_phases: List[str]
    endpoints: Dict[str, str]
