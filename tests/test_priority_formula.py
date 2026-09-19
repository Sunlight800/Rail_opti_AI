"""Unit tests for Phase 7: Priority Engine & 6-Factor Mathematical Formula."""
import pytest
from fastapi.testclient import TestClient
from rail_opti.api.app import create_app
from rail_opti.engines.priority_engine import priority_engine, PriorityEngine


@pytest.fixture
def client():
    app = create_app()
    with TestClient(app) as test_client:
        yield test_client


def test_priority_engine_direct_formula():
    """Verify exact weighted sum formula: 0.30S + 0.20P_f + 0.15C_a + 0.15U_m + 0.10I_o + 0.10D_s."""
    engine = PriorityEngine()
    # Test values where S < 90 so safety override is not triggered
    result = engine.calculate_priority(
        safety_risk=80.0,
        failure_probability=70.0,
        asset_criticality=60.0,
        maintenance_urgency=50.0,
        traffic_impact=40.0,
        defect_severity=30.0,
    )
    # Expected:
    # 0.30*80 = 24.0
    # 0.20*70 = 14.0
    # 0.15*60 = 9.0
    # 0.15*50 = 7.5
    # 0.10*40 = 4.0
    # 0.10*30 = 3.0
    # Total = 24 + 14 + 9 + 7.5 + 4 + 3 = 61.5
    assert pytest.approx(result["priority_score"], 0.1) == 61.5
    assert result["priority_band"] == "MEDIUM"
    assert result["safety_override"] is False
    assert len(result["factors"]) == 6


def test_safety_override_escalation():
    """Verify safety override triggers when S >= 90 or safety critical defect is flagged."""
    engine = PriorityEngine()
    # Case 1: S = 95
    res1 = engine.calculate_priority(
        safety_risk=95.0,
        failure_probability=50.0,
        asset_criticality=50.0,
        maintenance_urgency=50.0,
        traffic_impact=50.0,
        defect_severity=50.0,
    )
    assert res1["safety_override"] is True
    assert res1["priority_band"] == "CRITICAL"
    assert "SAFETY OVERRIDE ACTIVE" in res1["recommendation"]["escalation_reason"]

    # Case 2: S = 60, but has_safety_critical_defect = True
    res2 = engine.calculate_priority(
        safety_risk=60.0,
        failure_probability=50.0,
        asset_criticality=50.0,
        maintenance_urgency=50.0,
        traffic_impact=50.0,
        defect_severity=50.0,
        has_safety_critical_defect=True,
    )
    assert res2["safety_override"] is True
    assert res2["priority_band"] == "CRITICAL"


def test_custom_weights_normalization():
    """Verify custom weights normalize correctly to 1.0."""
    engine = PriorityEngine()
    custom_weights = {
        "safety_risk": 0.50,
        "failure_probability": 0.50,
        "asset_criticality": 0.0,
        "maintenance_urgency": 0.0,
        "traffic_impact": 0.0,
        "defect_severity": 0.0,
    }
    result = engine.calculate_priority(
        safety_risk=80.0,
        failure_probability=60.0,
        asset_criticality=10.0,
        maintenance_urgency=10.0,
        traffic_impact=10.0,
        defect_severity=10.0,
        weights=custom_weights,
    )
    # Expected: 0.5*80 + 0.5*60 = 70.0
    assert pytest.approx(result["priority_score"], 0.1) == 70.0
    assert result["priority_band"] == "MEDIUM"


def test_priority_api_get_task(client):
    """Test GET /api/priority/MT-001 endpoint."""
    response = client.get("/api/priority/MT-001")
    assert response.status_code == 200
    data = response.json()
    assert "priority_score" in data
    assert "priority_band" in data
    assert "factors" in data
    assert len(data["factors"]) == 6
    assert "recommendation" in data


def test_priority_api_recalculate(client):
    """Test POST /api/priority/recalculate endpoint."""
    payload = {
        "task_id": "MT-001",
        "safety_risk": 96.0,
        "failure_probability": 84.0,
        "asset_criticality": 78.0,
        "maintenance_urgency": 72.0,
        "traffic_impact": 65.0,
        "defect_severity": 83.0,
        "has_safety_critical_defect": False,
    }
    response = client.post("/api/priority/recalculate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["safety_override"] is True
    assert data["priority_band"] == "CRITICAL"
    assert data["priority_score"] >= 90.0


def test_priority_api_not_found(client):
    """Test GET /api/priority/{non_existent} returns 404."""
    response = client.get("/api/priority/MT-NONEXISTENT")
    assert response.status_code == 404
