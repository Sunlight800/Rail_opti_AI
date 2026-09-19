"""Verification tests for Phase 6: AI Risk Engine & Asset Health."""
from rail_opti.engines.asset_health import asset_health_engine
from rail_opti.engines.risk_engine import risk_engine


def test_asset_health_engine_calculation():
    """Verify health score and failure probability bounds."""
    # Pristine asset
    pristine = asset_health_engine.calculate_health(
        asset_type="TRACK",
        age_years=1.0,
        cumulative_gmt=10.0,
        defects=[],
        overdue_days=0,
    )
    assert pristine["health_score"] >= 90.0
    assert pristine["failure_probability"] <= 0.15
    assert pristine["urgency_level"] == "ROUTINE"

    # Degraded critical asset (similar to Track 7A)
    degraded = asset_health_engine.calculate_health(
        asset_type="TRACK",
        age_years=8.0,
        cumulative_gmt=68.5,
        defects=[{"severity": "CRITICAL"}, {"severity": "HIGH"}],
        overdue_days=42,
    )
    assert degraded["health_score"] <= 50.0
    assert degraded["failure_probability"] >= 0.75
    assert degraded["urgency_level"] == "IMMEDIATE"


def test_risk_engine_evaluation():
    """Verify multi-dimensional risk assessment."""
    risk = risk_engine.evaluate_task_risk(
        task_id="MT-TEST-01",
        asset_type="TRACK",
        severity="CRITICAL",
        section_speed_kmh=130,
        cumulative_gmt=75.0,
        defects=[{"severity": "CRITICAL"}],
        overdue_days=40,
    )
    assert risk["risk_category"] == "CRITICAL"
    assert risk["safety_risk"] >= 80.0
    assert risk["failure_probability"] >= 0.70
    assert len(risk["evidence"]) >= 3


def test_api_get_task_risk(client):
    """Verify GET /api/risk/MT-001 endpoint."""
    res = client.get("/api/risk/MT-001")
    assert res.status_code == 200
    data = res.json()
    assert data["task_id"] == "MT-001"
    assert data["risk_category"] in ["CRITICAL", "HIGH"]
    assert data["failure_probability"] >= 0.70
    assert data["safety_risk"] >= 80.0
    assert "explanation" in data


def test_api_evaluate_custom_risk(client):
    """Verify POST /api/risk/evaluate endpoint for sensitivity simulation."""
    payload = {
        "task_id": "MT-SIM",
        "asset_type": "OHE_MAST",
        "severity": "HIGH",
        "section_speed_kmh": 120,
        "cumulative_gmt": 50.0,
        "overdue_days": 15,
        "age_years": 6.0,
        "defect_severities": ["HIGH"],
    }
    res = client.post("/api/risk/evaluate", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "safety_risk" in data
    assert "failure_probability" in data
    assert 0.0 <= data["failure_probability"] <= 1.0
