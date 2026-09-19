"""Unit tests for Phase 8: Resource Planning Engine & Capacity Tracking."""
import pytest
from fastapi.testclient import TestClient
from rail_opti.api.app import create_app
from rail_opti.database.session import SessionLocal
from rail_opti.engines.resource_planner import resource_planner


@pytest.fixture
def client():
    app = create_app()
    with TestClient(app) as test_client:
        yield test_client


def test_resource_availability_calculation():
    """Test availability summary across all 8 resource categories."""
    db = SessionLocal()
    try:
        summary = resource_planner.get_availability_summary(db)
        assert "overall_availability_pct" in summary
        assert 0.0 <= summary["overall_availability_pct"] <= 100.0
        assert summary["total_units"] > 0
        assert summary["available_units"] >= 0

        # Check all 8 categories exist
        expected_cats = [
            "TRACK_MACHINES",
            "TOWER_WAGONS",
            "CREW_DEPOTS",
            "POWER_DISCONNECT",
            "TRAFFIC_CONTROLLERS",
            "SPEED_RESTRICTION_BOARDS",
            "SAFETY_GEAR",
            "ESCORTS",
        ]
        for cat in expected_cats:
            assert cat in summary["categories"]
            assert summary["categories"][cat]["total_capacity"] >= 0
    finally:
        db.close()


def test_resource_feasibility_check():
    """Test feasibility checker for MT-001 with satisfied requirements."""
    db = SessionLocal()
    try:
        result = resource_planner.check_feasibility(db, task_id="MT-001")
        assert "feasible" in result
        assert "task_id" in result
        assert result["task_id"] == "MT-001"
        assert "satisfied_requirements" in result
        assert "shortages" in result
        assert "feasibility_score" in result
    finally:
        db.close()


def test_resource_alternative_finding():
    """Test alternative resource suggestion from adjacent depot."""
    db = SessionLocal()
    try:
        alt = resource_planner.find_alternative(
            db,
            resource_type="TRACK_MACHINES",
            target_section_id="SEC-NDLS-ALD",
        )
        assert alt is not None
        assert alt["resource_type"] == "TRACK_MACHINES"
        assert alt["depot_section"] != "SEC-NDLS-ALD"
        assert "transit_time_buffer_min" in alt
        assert alt["transit_time_buffer_min"] > 0
    finally:
        db.close()


def test_api_list_resources(client):
    """Test GET /api/resources with category filtering."""
    response = client.get("/api/resources?category=TRACK_MACHINES")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0
    for r in data:
        assert r["resource_type"] == "TRACK_MACHINES"
        assert "status" in r
        assert "total_capacity" in r


def test_api_availability_endpoint(client):
    """Test GET /api/resources/availability endpoint."""
    response = client.get("/api/resources/availability")
    assert response.status_code == 200
    data = response.json()
    assert "overall_availability_pct" in data
    assert "categories" in data
    assert len(data["categories"]) == 8


def test_api_active_tracking(client):
    """Test GET /api/resources/active-tracking endpoint."""
    response = client.get("/api/resources/active-tracking")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0
    first = data[0]
    assert "name" in first
    assert "shift_window" in first
    assert "operator_crew" in first
    assert "maintenance_health_pct" in first


def test_api_feasibility_post(client):
    """Test POST /api/resources/feasibility endpoint."""
    response = client.post("/api/resources/feasibility", json={"task_id": "MT-001"})
    assert response.status_code == 200
    data = response.json()
    assert "task_id" in data
    assert "feasible" in data


def test_api_feasibility_not_found(client):
    """Test POST /api/resources/feasibility with invalid task returns 404."""
    response = client.post("/api/resources/feasibility", json={"task_id": "MT-NONEXISTENT"})
    assert response.status_code == 404
