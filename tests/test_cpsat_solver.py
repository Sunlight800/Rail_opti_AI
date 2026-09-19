"""Unit tests for Phase 11: Google OR-Tools CP-SAT Block Optimization Solver."""
import pytest
from fastapi.testclient import TestClient
from rail_opti.api.app import create_app
from rail_opti.database.session import SessionLocal
from rail_opti.optimizer.cpsat_solver import cpsat_solver


@pytest.fixture
def client():
    app = create_app()
    with TestClient(app) as test_client:
        yield test_client


def test_cpsat_solver_direct_execution():
    """Test CP-SAT optimization execution on seeded database."""
    db = SessionLocal()
    try:
        result = cpsat_solver.solve_plan(
            db,
            horizon_days=3,
            priority_weight=10.0,
            consolidation_bonus=5.0,
            disruption_penalty=20.0,
            time_limit_seconds=5.0,
            create_db_records=False,
        )

        assert result["status"] in ["OPTIMAL", "FEASIBLE"]
        assert "execution_time_ms" in result
        assert result["execution_time_ms"] < 6000
        assert "kpis" in result
        assert result["kpis"]["scheduled_tasks_count"] > 0
        assert result["kpis"]["total_blocks_count"] > 0
        assert "blocks" in result

        # Check safety override: MT-001 must be scheduled
        all_scheduled_tasks = []
        for blk in result["blocks"]:
            all_scheduled_tasks.extend(blk["assigned_task_ids"])

        assert "MT-001" in all_scheduled_tasks, "Safety override task MT-001 must be scheduled!"
    finally:
        db.close()


def test_cpsat_infeasible_diagnosis():
    """Test infeasibility diagnosis returns structured root cause and relaxation suggestions."""
    diagnosis = cpsat_solver.diagnose_infeasibility(tasks=[], windows=[])
    assert "minimal_conflicting_core" in diagnosis
    assert "recommended_relaxations" in diagnosis
    assert len(diagnosis["recommended_relaxations"]) > 0
    assert "relaxation_parameters" in diagnosis


def test_api_optimizer_solve(client):
    """Test POST /api/optimizer/solve endpoint."""
    payload = {
        "horizon_days": 3,
        "priority_weight": 10.0,
        "consolidation_bonus": 5.0,
        "disruption_penalty": 20.0,
        "allow_rerouting": True,
        "time_limit_seconds": 4.0,
    }
    response = client.post("/api/optimizer/solve", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] in ["OPTIMAL", "FEASIBLE"]
    assert "kpis" in data
    assert "blocks" in data


def test_api_optimizer_runs(client):
    """Test GET /api/optimizer/runs endpoint."""
    response = client.get("/api/optimizer/runs")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    run = data[0]
    assert "solver_status" in run
    assert "execution_time_ms" in run


def test_api_optimizer_run_detail(client):
    """Test GET /api/optimizer/runs/{id} endpoint."""
    # OPT-2025-0520-001 was seeded in Phase 3
    response = client.get("/api/optimizer/runs/OPT-2025-0520-001")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == "OPT-2025-0520-001"
    assert data["solver_status"] == "OPTIMAL"
    assert "parameters" in data


def test_api_optimizer_run_not_found(client):
    """Test GET /api/optimizer/runs/{invalid} returns 404."""
    response = client.get("/api/optimizer/runs/OPT-NONEXISTENT")
    assert response.status_code == 404
