"""Unit tests for Phase 10: Conflict Detection Engine across 14 categories."""
import pytest
from fastapi.testclient import TestClient
from rail_opti.api.app import create_app
from rail_opti.database.session import SessionLocal
from rail_opti.engines.conflict_detector import conflict_engine


@pytest.fixture
def client():
    app = create_app()
    with TestClient(app) as test_client:
        yield test_client


def test_conflict_engine_scan():
    """Test multi-rule conflict detection across corridor blocks and train schedules."""
    db = SessionLocal()
    try:
        detected = conflict_engine.scan_all_conflicts(db, plan_version_id="PLN-V1")
        assert isinstance(detected, list)
        assert len(detected) > 0

        # Check structure of detected conflicts
        for c in detected:
            assert "conflict_type" in c
            assert "severity" in c
            assert c["severity"] in ["CRITICAL", "HIGH", "MEDIUM", "INFO"]
            assert "explanation" in c
            assert "resolution_options" in c
            assert len(c["resolution_options"]) > 0
            assert "is_resolved" in c
            assert c["is_resolved"] is False
    finally:
        db.close()


def test_conflict_engine_resolve():
    """Test applying resolution to a pre-staged conflict."""
    db = SessionLocal()
    try:
        res = conflict_engine.resolve_conflict(
            db,
            conflict_id="CNF-2025-001",
            resolution_option_id="OPT-SHIFT",
        )
        assert res["success"] is True
        assert res["status"] == "RESOLVED"
        assert res["applied_option"] == "OPT-SHIFT"
    finally:
        db.close()


def test_api_list_conflicts(client):
    """Test GET /api/conflicts endpoint with filtering."""
    response = client.get("/api/conflicts")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    cnf = data[0]
    assert "conflict_type" in cnf
    assert "severity" in cnf
    assert "explanation" in cnf


def test_api_conflicts_summary(client):
    """Test GET /api/conflicts/summary endpoint."""
    response = client.get("/api/conflicts/summary")
    assert response.status_code == 200
    data = response.json()
    assert "total_conflicts" in data
    assert "critical_count" in data
    assert "high_count" in data
    assert "resolution_rate_pct" in data


def test_api_conflict_detail(client):
    """Test GET /api/conflicts/CNF-2025-001 endpoint."""
    response = client.get("/api/conflicts/CNF-2025-001")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == "CNF-2025-001"
    assert "resolution_options" in data


def test_api_conflict_detail_not_found(client):
    """Test GET /api/conflicts/{invalid} returns 404."""
    response = client.get("/api/conflicts/CNF-INVALID-999")
    assert response.status_code == 404


def test_api_trigger_scan(client):
    """Test POST /api/conflicts/scan endpoint."""
    response = client.post("/api/conflicts/scan?plan_version_id=PLN-V1")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "COMPLETED"
    assert "conflicts_detected_count" in data
    assert data["conflicts_detected_count"] > 0


def test_api_resolve_conflict_endpoint(client):
    """Test POST /api/conflicts/{id}/resolve endpoint."""
    payload = {"resolution_option_id": "OPT-REROUTE"}
    response = client.post("/api/conflicts/CNF-2025-001/resolve", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["status"] == "RESOLVED"
