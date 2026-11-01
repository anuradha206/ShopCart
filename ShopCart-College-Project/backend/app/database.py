"""
Database Engine & Session Configuration Module
Handles SQLAlchemy engine initialization, session lifecycle, and base model class.
"""

from typing import Generator
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker
from app.config import settings

# Configure engine arguments based on database driver
# SQLite requires `check_same_thread: False` when used in multithreaded environments like FastAPI.
connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args["check_same_thread"] = False

# Create the SQLAlchemy Engine
engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True,  # Automatically check connections for liveness before using
    echo=False,          # Set to True if SQL query logging is desired
)

# Session factory bound to the engine
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Declarative Base for ORM models
Base = declarative_base()


def get_db() -> Generator:
    """
    FastAPI dependency that provides a database session to a request
    and ensures it is closed when the request finishes.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def check_db_connection() -> dict:
    """
    Helper function to verify if the database is reachable.
    Used by the health check endpoint.
    """
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        return {
            "status": "connected",
            "database_type": "postgresql" if "postgres" in settings.DATABASE_URL else "sqlite",
            "url": settings.DATABASE_URL.split("@")[-1] if "@" in settings.DATABASE_URL else settings.DATABASE_URL
        }
    except Exception as exc:
        return {
            "status": "disconnected",
            "error": str(exc),
            "database_type": "postgresql" if "postgres" in settings.DATABASE_URL else "sqlite"
        }
