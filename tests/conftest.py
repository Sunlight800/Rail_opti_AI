"""Pytest fixtures for RAILOPT AI."""
import pytest
from fastapi.testclient import TestClient
from rail_opti.api.app import app


@pytest.fixture(scope="session")
def client():
    """Test client for FastAPI app."""
    with TestClient(app) as test_client:
        yield test_client
