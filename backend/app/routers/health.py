"""
Health and System Status Router
Provides endpoints to monitor application status and database connectivity.
"""

from datetime import datetime, timezone
from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db, check_db_connection
from app.schemas.health import HealthResponse, SystemInfoResponse

router = APIRouter(prefix="", tags=["System & Health"])


@router.get("/health", response_model=HealthResponse, summary="System Health Check")
def health_check():
    """
    Returns the health status of the application, including:
    - Overall server status
    - App name and version
    - Current ISO timestamp
    - Live database connectivity status (SQLAlchemy query test)
    """
    db_status = check_db_connection()
    return HealthResponse(
        status="ok" if db_status["status"] == "connected" else "degraded",
        app_name=settings.PROJECT_NAME,
        version=settings.VERSION,
        timestamp=datetime.now(timezone.utc).isoformat(),
        database=db_status
    )


@router.get("/info", response_model=SystemInfoResponse, summary="Project Information & Architecture")
def system_info():
    """
    Returns metadata about the project architecture, current active phase,
    and roadmaps for college demonstration.
    """
    return SystemInfoResponse(
        project_name=settings.PROJECT_NAME,
        version=settings.VERSION,
        phase="Phase 1: Project Setup & Core Scaffolding",
        modules_ready=[
            "FastAPI Application Scaffolding",
            "SQLAlchemy 2.0 Engine & Connection Pool",
            "Pydantic Settings & Environment Configurations",
            "Alembic Database Migration Architecture",
            "CORS Middleware Configuration",
            "Health Check & Database Probe API",
            "React 19 + Vite 6 Modern Frontend with Tailwind CSS"
        ],
        upcoming_phases=[
            "Phase 2: PostgreSQL Tables & SQLAlchemy Models",
            "Phase 3: User Registration, Login & JWT Auth",
            "Phase 4: Categories & Product Catalog Management",
            "Phase 5: React Auth State & Protected Views",
            "Phase 6: Search, Filters & Category Browsing",
            "Phase 7: Wishlist Module",
            "Phase 8: Persistent Shopping Cart",
            "Phase 9: Checkout & Order Processing",
            "Phase 10: Visual Order Tracking",
            "Phase 11: Verified Customer Reviews & Ratings",
            "Phase 12: Admin Analytics Dashboard",
            "Phase 13-16: Smart Features (Rule-based Recommendations, Similar Items, Purchase Analytics)"
        ],
        endpoints={
            "health_check": f"{settings.API_V1_STR}/health",
            "system_info": f"{settings.API_V1_STR}/info",
            "swagger_docs": "/docs",
            "redoc": "/redoc",
            "openapi": "/openapi.json"
        }
    )


@router.get("/routes", summary="List All Registered Endpoints")
def list_registered_routes(request: Request):
    """
    Lists all endpoints registered in FastAPI for quick verification and Postman testing.
    """
    routes = []
    for route in request.app.routes:
        routes.append({
            "path": getattr(route, "path", None),
            "name": getattr(route, "name", None),
            "methods": list(getattr(route, "methods", []))
        })
    return {"total_routes": len(routes), "routes": routes}
