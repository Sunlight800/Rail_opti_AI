"""Verification tests for Phase 1: Project Skeleton & Configuration."""
from rail_opti.core.config import settings
from rail_opti.database.session import engine, SessionLocal, Base


def test_package_metadata():
    """Verify package configuration and settings."""
    assert settings.PROJECT_NAME == "RAILOPT AI"
    assert settings.VERSION == "0.1.0"
    assert settings.DEMO_MODE is True
    assert "DEMO / SIMULATED DATA" in settings.DEMO_DATA_DISCLAIMER


def test_database_session_engine():
    """Verify database engine and session creation."""
    assert engine is not None
    session = SessionLocal()
    assert session is not None
    session.close()


def test_health_check_endpoint(client):
    """Verify that FastAPI application health endpoint returns 200 and expected payload."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["project"] == "RAILOPT AI"
    assert data["version"] == "0.1.0"
    assert data["demo_mode"] is True
    assert "DEMO / SIMULATED DATA" in data["disclaimer"]
