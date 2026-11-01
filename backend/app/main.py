"""
Main FastAPI Application Entry Point
Online Shopping System / Cart Management System
"""

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.database import Base, engine, check_db_connection
from app.routers.health import router as health_router

# Setup basic logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("cartcraft.api")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan context manager for startup and shutdown events.
    """
    logger.info("==================================================")
    logger.info(f"Starting {settings.PROJECT_NAME} v{settings.VERSION}")
    logger.info(f"Database URL configured: {settings.DATABASE_URL.split('@')[-1] if '@' in settings.DATABASE_URL else settings.DATABASE_URL}")
    
    # Test DB connection at startup
    db_check = check_db_connection()
    logger.info(f"Database connection check: {db_check['status']}")

    # Create tables if not present (Base metadata)
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("SQLAlchemy metadata verified.")
    except Exception as exc:
        logger.warning(f"Metadata auto-creation notice: {exc}")

    logger.info("Application ready to accept incoming requests.")
    logger.info("==================================================")
    yield
    logger.info("Shutting down CartCraft API application...")


# Initialize FastAPI instance
app = FastAPI(
    title=settings.PROJECT_NAME,
    description=(
        "Full-stack college project demonstrating an Online Shopping & Cart Management System. "
        "Built with FastAPI, SQLAlchemy ORM, PostgreSQL/SQLite, Pydantic, and React."
    ),
    version=settings.VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan
)

# Configure Cross-Origin Resource Sharing (CORS)
# Allows the React frontend to communicate with this FastAPI server seamlessly
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if "*" in settings.CORS_ORIGINS else settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API Routers under /api
app.include_router(health_router, prefix=settings.API_V1_STR)


@app.get("/", summary="Root Welcome Endpoint")
def read_root():
    """
    Root entry point providing quick links to documentation and health status.
    """
    return {
        "message": f"Welcome to the {settings.PROJECT_NAME} API!",
        "version": settings.VERSION,
        "phase": "Phase 1: Project Setup & Health Verification",
        "documentation": {
            "swagger_ui": "/docs",
            "redoc": "/redoc",
            "openapi_schema": "/openapi.json"
        },
        "health_check": f"{settings.API_V1_STR}/health",
        "system_info": f"{settings.API_V1_STR}/info"
    }
