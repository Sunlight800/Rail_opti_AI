"""Unit tests for Phase 9: Railway Operations, Corridors, Trains, and Network Topology."""
import pytest
from fastapi.testclient import TestClient
from rail_opti.api.app import create_app


@pytest.fixture
def client():
    app = create_app()
    with TestClient(app) as test_client:
        yield test_client


def test_list_corridors(client):
    """Test GET /api/operations/corridors endpoint."""
    response = client.get("/api/operations/corridors")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    corridor = data[0]
    assert corridor["id"] == "COR-DEL-BOM"
    assert "total_length_km" in corridor
    assert corridor["section_count"] >= 10


def test_corridor_topology(client):
    """Test GET /api/operations/corridors/{id}/topology endpoint."""
    response = client.get("/api/operations/corridors/COR-DEL-BOM/topology")
    assert response.status_code == 200
    data = response.json()
    assert "nodes" in data
    assert "edges" in data
    assert len(data["nodes"]) >= 10
    assert len(data["edges"]) >= 10
    first_edge = data["edges"][0]
    assert "gis_coordinates" in first_edge
    assert "active_blocks" in first_edge
    assert "max_speed_kmh" in first_edge


def test_corridor_topology_not_found(client):
    """Test GET /api/operations/corridors/{invalid}/topology returns 404."""
    response = client.get("/api/operations/corridors/COR-INVALID/topology")
    assert response.status_code == 404


def test_list_sections(client):
    """Test GET /api/operations/sections endpoint."""
    response = client.get("/api/operations/sections")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 10
    first_sec = data[0]
    assert "line_type" in first_sec
    assert "max_speed_kmh" in first_sec
    assert "gis_coordinates" in first_sec


def test_list_trains_and_filtering(client):
    """Test GET /api/operations/trains with category filter."""
    response = client.get("/api/operations/trains")
    assert response.status_code == 200
    all_trains = response.json()
    assert len(all_trains) >= 20

    # Filter premium
    prem_resp = client.get("/api/operations/trains?category=COACHING_PREMIUM")
    assert prem_resp.status_code == 200
    prem_trains = prem_resp.json()
    assert len(prem_trains) >= 4
    for t in prem_trains:
        assert t["train_category"] == "COACHING_PREMIUM"
        assert t["priority_rank"] == 1


def test_train_timetable(client):
    """Test GET /api/operations/trains/{id}/timetable endpoint."""
    response = client.get("/api/operations/trains/TRN-12951/timetable")
    assert response.status_code == 200
    data = response.json()
    assert data["train_number"] == "12951"
    assert "schedules" in data
    assert len(data["schedules"]) >= 1
    assert "scheduled_entry" in data["schedules"][0]


def test_train_timetable_not_found(client):
    """Test GET /api/operations/trains/{invalid}/timetable returns 404."""
    response = client.get("/api/operations/trains/TRN-NONEXISTENT/timetable")
    assert response.status_code == 404


def test_operations_live_status(client):
    """Test GET /api/operations/live-status endpoint."""
    response = client.get("/api/operations/live-status")
    assert response.status_code == 200
    data = response.json()
    assert "total_trains_monitored" in data
    assert data["total_trains_monitored"] >= 20
    assert "system_punctuality_pct" in data
    assert "active_speed_restrictions" in data
    assert len(data["active_speed_restrictions"]) >= 1
