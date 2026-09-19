"""Tests for What-If Scenario Simulator & Ripple Effect Engine in RAILOPT AI."""
import pytest
from fastapi.testclient import TestClient
from rail_opti.api.app import app
from rail_opti.database.session import get_db, SessionLocal
from rail_opti.engines.what_if_simulator import what_if_simulator

client = TestClient(app)


def test_get_scenario_templates():
    """Verify pre-built scenario templates are exposed."""
    response = client.get("/api/what-if/scenarios")
    assert response.status_code == 200
    templates = response.json()
    assert isinstance(templates, list)
    assert len(templates) >= 3
    scenario_ids = [t["id"] for t in templates]
    assert "SCEN-FREIGHT-DELAY" in scenario_ids
    assert "SCEN-MONSOON-SURGE" in scenario_ids
    assert "SCEN-BCM-FAILURE" in scenario_ids


def test_simulate_baseline_normal():
    """Verify simulation with 0 delay and normal conditions."""
    payload = {
        "train_delay_min": 0,
        "target_train_id": "TRN-12951",
        "traffic_density": "NORMAL",
        "duration_extension_pct": 0,
        "machine_breakdown": False,
        "plan_version_id": "PLN-V1",
    }
    response = client.post("/api/what-if/simulate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["simulation_status"] == "COMPLETED"
    assert "kpi_comparison" in data
    assert "punctuality_pct" in data["kpi_comparison"]
    assert "conflicts_count" in data["kpi_comparison"]
    assert "deferred_tasks" in data["kpi_comparison"]
    assert "asset_availability_pct" in data["kpi_comparison"]
    assert "ripple_effects" in data
    assert "ai_contingency_recommendation" in data


def test_simulate_train_delay_ripple():
    """Verify train delay triggers ripple effects and KPI degradation."""
    payload = {
        "train_delay_min": 60,
        "target_train_id": "TRN-12951",
        "traffic_density": "HIGH",
        "duration_extension_pct": 10,
        "machine_breakdown": False,
        "plan_version_id": "PLN-V1",
    }
    response = client.post("/api/what-if/simulate", json=payload)
    assert response.status_code == 200
    data = response.json()
    # Punctuality should degrade
    punct = data["kpi_comparison"]["punctuality_pct"]
    assert punct["simulated"] < punct["baseline"]
    assert punct["delta"] < 0

    # Ripple effects should include the affected train
    ripple = data["ripple_effects"]
    assert len(ripple) > 0
    entity_names = [r["affected_entity"] for r in ripple]
    assert any("12951" in e or "TRN" in e for e in entity_names)


def test_simulate_machine_breakdown():
    """Verify machine breakdown creates severe ripple effects and contingency advice."""
    payload = {
        "train_delay_min": 30,
        "target_train_id": None,
        "traffic_density": "PEAK",
        "duration_extension_pct": 25,
        "machine_breakdown": True,
        "plan_version_id": "PLN-V1",
    }
    response = client.post("/api/what-if/simulate", json=payload)
    assert response.status_code == 200
    data = response.json()
    # Machine breakdown should increase conflicts or deferred tasks
    conflicts = data["kpi_comparison"]["conflicts_count"]
    assert conflicts["simulated"] >= conflicts["baseline"]
    assert "CRITICAL" in [r["severity"] for r in data["ripple_effects"]] or len(data["ripple_effects"]) >= 2
    assert len(data["ai_contingency_recommendation"]) > 20


def test_what_if_engine_direct():
    """Verify what-if engine runs directly against database session."""
    db = SessionLocal()
    try:
        res = what_if_simulator.run_simulation(
            db,
            train_delay_min=45,
            target_train_id="TRN-12951",
            traffic_density="PEAK",
            duration_extension_pct=15,
            machine_breakdown=True,
            plan_version_id="PLN-V1",
        )
        assert res["simulation_status"] == "COMPLETED"
        assert len(res["ripple_effects"]) >= 1
    finally:
        db.close()
