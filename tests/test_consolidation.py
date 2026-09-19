"""Unit tests for Phase 13: Multi-Department Consolidation Engine."""
import pytest
from fastapi.testclient import TestClient
from rail_opti.api.app import create_app
from rail_opti.database.session import SessionLocal
from rail_opti.engines.consolidation_engine import consolidation_engine


@pytest.fixture
def client():
    app = create_app()
    with TestClient(app) as test_client:
        yield test_client


def test_consolidation_detect_opportunities():
    """Test AI detection of multi-department consolidation opportunities."""
    db = SessionLocal()
    try:
        opps = consolidation_engine.detect_opportunities(db)
        assert isinstance(opps, list)
        assert len(opps) > 0
        first = opps[0]
        assert "departments" in first
        assert len(first["departments"]) >= 2
        assert "estimated_hours_saved" in first
        assert first["estimated_hours_saved"] > 0
    finally:
        db.close()


def test_consolidation_merge_block():
    """Test merging tasks into a consolidated block."""
    db = SessionLocal()
    try:
        res = consolidation_engine.merge_into_consolidated_block(
            db,
            section_id="SEC-NDLS-ALD",
            task_ids=["MT-001", "MT-002"],
            duration_min=180,
        )
        assert res["success"] is True
        assert "block_id" in res
        assert "hours_saved" in res
        assert res["hours_saved"] >= 2.5
    finally:
        db.close()


def test_api_list_consolidation_groups(client):
    """Test GET /api/consolidation/groups endpoint."""
    response = client.get("/api/consolidation/groups")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    grp = data[0]
    assert "participating_departments" in grp
    assert "block_hours_saved" in grp


def test_api_consolidation_opportunities(client):
    """Test GET /api/consolidation/opportunities endpoint."""
    response = client.get("/api/consolidation/opportunities")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    assert "candidate_task_ids" in data[0]


def test_api_consolidation_summary(client):
    """Test GET /api/consolidation/summary endpoint."""
    response = client.get("/api/consolidation/summary")
    assert response.status_code == 200
    data = response.json()
    assert "total_block_hours_saved" in data
    assert "synergy_index" in data
    assert "top_spotlight_group" in data


def test_api_merge_tasks(client):
    """Test POST /api/consolidation/merge endpoint."""
    payload = {
        "section_id": "SEC-ALD-BPL",
        "task_ids": ["MT-004", "MT-005"],
        "duration_min": 180,
    }
    response = client.post("/api/consolidation/merge", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "block_id" in data
