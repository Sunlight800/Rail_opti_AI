"""Unit tests for Phase 12: Maintenance Blocks & Gantt Timeline API."""
import pytest
from fastapi.testclient import TestClient
from rail_opti.api.app import create_app


@pytest.fixture
def client():
    app = create_app()
    with TestClient(app) as test_client:
        yield test_client


def test_list_blocks(client):
    """Test GET /api/blocks endpoint with plan version PLN-V1."""
    response = client.get("/api/blocks?plan_version_id=PLN-V1")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    blk = data[0]
    assert "duration_min" in blk
    assert "safety_status" in blk
    assert "assigned_task_ids" in blk


def test_list_blocks_filtered(client):
    """Test GET /api/blocks with section filtering."""
    response = client.get("/api/blocks?section_id=SEC-NDLS-ALD")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1
    for b in data:
        assert b["section_id"] == "SEC-NDLS-ALD"


def test_gantt_timeline_endpoint(client):
    """Test GET /api/blocks/gantt endpoint."""
    response = client.get("/api/blocks/gantt?plan_version_id=PLN-V1")
    assert response.status_code == 200
    data = response.json()
    assert "sections" in data
    assert len(data["sections"]) >= 1
    first_sec = data["sections"][0]
    assert "blocks" in first_sec
    assert "trains" in first_sec
    if first_sec["blocks"]:
        first_blk = first_sec["blocks"][0]
        assert "start_hour" in first_blk
        assert "end_hour" in first_blk


def test_block_detail(client):
    """Test GET /api/blocks/BLK-ENG-102 endpoint."""
    response = client.get("/api/blocks/BLK-ENG-102")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == "BLK-ENG-102"
    assert "tasks" in data
    assert len(data["tasks"]) >= 1
    assert data["tasks"][0]["task_id"] == "MT-001"
    assert "resources" in data


def test_block_detail_not_found(client):
    """Test GET /api/blocks/{invalid} returns 404."""
    response = client.get("/api/blocks/BLK-NONEXISTENT")
    assert response.status_code == 404


def test_update_block(client):
    """Test PUT /api/blocks/BLK-ENG-102 endpoint."""
    payload = {"safety_status": "VALIDATED"}
    response = client.put("/api/blocks/BLK-ENG-102", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["status"] == "VALIDATED"
