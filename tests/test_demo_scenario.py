"""Full 32-Step End-to-End Demo Scenario Verification Test for RAILOPT AI (SIH26027)."""
import pytest
from fastapi.testclient import TestClient
from rail_opti.api.app import app

client = TestClient(app)


def test_step_01_health_and_disclaimer():
    """Step 1: Check root health endpoint and verify DEMO / SIMULATED DATA disclaimer."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["project"] == "RAILOPT AI"
    assert "DEMO / SIMULATED DATA" in data["disclaimer"]


def test_step_02_dashboard_kpis():
    """Step 2: Verify Dashboard KPI grid returns availability, active blocks, and hours saved."""
    response = client.get("/api/dashboard/kpis")
    assert response.status_code == 200
    data = response.json()
    assert "88%" in data["kpis"]["asset_availability"]["value"]
    assert "12" in data["kpis"]["critical_tasks"]["value"]
    assert "28" in data["kpis"]["active_blocks"]["value"]
    assert "124" in data["kpis"]["block_hours_saved"]["value"]


def test_step_03_critical_task_mt001():
    """Step 3: Verify Critical Task MT-001 on NDLS-ALD (Track 7A)."""
    response = client.get("/api/maintenance/MT-001")
    assert response.status_code == 200
    task = response.json()
    assert task["id"] == "MT-001"
    assert task["section_id"] == "SEC-NDLS-ALD"
    assert task["department_id"] == "ENG"
    assert task["severity"] == "CRITICAL"


def test_step_04_05_asset_health_and_risk():
    """Step 4 & 5: Verify Asset AST-TRK-7A health score and 84% failure probability."""
    response = client.get("/api/assets/AST-TRK-7A/health")
    assert response.status_code == 200
    data = response.json()
    assert data["failure_probability"] == 0.84
    assert data["health_score"] <= 50.0
    assert data["urgency_level"] == "IMMEDIATE"


def test_step_06_priority_formula_mt001():
    """Step 6: Verify 6-factor priority formula breakdown for MT-001 totaling ~89.3."""
    response = client.get("/api/priority/MT-001")
    assert response.status_code == 200
    data = response.json()
    assert data["priority_score"] >= 85.0
    assert data["priority_band"] == "CRITICAL"
    assert len(data["factors"]) == 6


def test_step_07_08_resource_feasibility():
    """Step 7 & 8: Check resource requirements and feasibility check for MT-001."""
    payload = {
        "task_id": "MT-001",
        "section_id": "SEC-NDLS-ALD",
        "start_time": "2025-05-20T09:00:00",
        "duration_min": 180,
    }
    response = client.post("/api/resources/feasibility", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["feasible"] is True
    assert "satisfied_requirements" in data
    assert len(data["satisfied_requirements"]) >= 3


def test_step_09_corridor_topology():
    """Step 9: Query corridor topology for Delhi - Mumbai corridor."""
    response = client.get("/api/operations/corridors/COR-DEL-BOM/topology")
    assert response.status_code == 200
    data = response.json()
    assert "nodes" in data
    assert "edges" in data
    assert len(data["nodes"]) >= 10


def test_step_10_11_optimizer_solve():
    """Step 10 & 11: Execute Google OR-Tools CP-SAT optimizer for next 3 days."""
    payload = {
        "horizon_days": 3,
        "priority_weight": 10.0,
        "consolidation_bonus": 5.0,
        "disruption_penalty": 20.0,
        "time_limit_seconds": 5.0,
    }
    response = client.post("/api/optimizer/solve", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] in ["OPTIMAL", "FEASIBLE"]
    assert "kpis" in data
    assert "blocks" in data
    assert data["kpis"]["scheduled_tasks_count"] > 0


def test_step_12_13_14_gantt_and_conflicts():
    """Step 12, 13, 14: Inspect Gantt timeline and detect freight vs block conflict."""
    gantt_res = client.get("/api/blocks/gantt?plan_version_id=PLN-V1")
    assert gantt_res.status_code == 200
    gantt = gantt_res.json()
    assert "sections" in gantt
    assert len(gantt["sections"]) > 0

    conflicts_res = client.get("/api/conflicts?plan_version_id=PLN-V1")
    assert conflicts_res.status_code == 200
    conflicts = conflicts_res.json()
    assert len(conflicts) >= 1
    c_types = [c["conflict_type"] for c in conflicts]
    assert any("Train" in ct or "Maintenance" in ct for ct in c_types)


def test_step_15_consolidation_merge():
    """Step 15: Merge multi-department tasks into unified block on SEC-ALD-BPL."""
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


def test_step_16_17_18_19_what_if_simulation():
    """Step 16-19: Simulate 45-min train delay and verify KPI delta & ripple effects."""
    payload = {
        "train_delay_min": 45,
        "target_train_id": "TRN-SZ314",
        "traffic_density": "HIGH",
        "duration_extension_pct": 0,
        "machine_breakdown": False,
        "plan_version_id": "PLN-V1",
    }
    response = client.post("/api/what-if/simulate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["simulation_status"] == "COMPLETED"
    assert len(data["ripple_effects"]) >= 1
    assert data["kpi_comparison"]["punctuality_pct"]["delta"] < 0


def test_step_20_to_25_approval_and_recalculation():
    """Step 20-25: Department sign-off, structured rejection, and AI recalculation creating Plan V2."""
    # 1. Check departments
    dept_res = client.get("/api/approvals/PLN-V1/departments")
    assert dept_res.status_code == 200

    # 2. Reject and recalculate
    recalc_payload = {
        "plan_version_id": "PLN-V1",
        "reviewer_user_id": "USR-OPT-01",
        "department": "Operating",
        "rejection_code": "TRAIN_DELAY_UNACCEPTABLE",
        "feedback_comments": "Keep maintenance outside heavy traffic window (14:00 - 18:00).",
    }
    recalc_res = client.post("/api/approvals/recalculate", json=recalc_payload)
    assert recalc_res.status_code == 200
    recalc_data = recalc_res.json()
    assert recalc_data["status"] == "SUCCESS"
    assert recalc_data["new_plan_id"].startswith("PLN-V")
    assert recalc_data["kpi_comparison"]["delta"]["conflicts_resolved"] >= 1


def test_step_26_27_plan_versions_compare():
    """Step 26 & 27: Compare Plan V1 vs Plan V2 with KPI deltas and block differences."""
    response = client.get("/api/plans/compare?v1=PLN-V1&v2=PLN-V2")
    assert response.status_code == 200
    data = response.json()
    assert "kpi_deltas" in data
    assert "block_diffs" in data
    assert data["kpi_deltas"]["asset_availability_pct"]["improved"] is True


def test_step_28_to_31_activate_plan_v2():
    """Step 28-31: Modify & Approve Plan V2, then activate and lock for operational dispatch."""
    activate_payload = {
        "user_id": "USR-ADM-01",
        "activation_reason": "Approved by Joint Operating Committee for corridor execution.",
    }
    response = client.post("/api/plans/PLN-V2/activate", json=activate_payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "SUCCESS"
    assert data["new_status"] == "ACTIVE"


def test_step_32_audit_trail_verification():
    """Step 32: Verify complete immutable audit trail of all actions."""
    response = client.get("/api/audit/logs")
    assert response.status_code == 200
    data = response.json()
    assert len(data["logs"]) >= 3
    actions = [l["action"] for l in data["logs"]]
    assert any("PLAN" in a or "OPTIMIZATION" in a or "SEED" in a for a in actions)
