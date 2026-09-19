"""Tests for Approval Workflow, Structured Rejection/Recalculation, and Plan Versioning (Phases 16, 17, 18)."""
import pytest
from fastapi.testclient import TestClient
from rail_opti.api.app import app
from rail_opti.database.session import SessionLocal
from rail_opti.database.models import PlanVersion, Approval, AuditLog

client = TestClient(app)


def test_get_rejection_reasons():
    """Verify structured rejection reasons and mitigation strategies are available."""
    response = client.get("/api/approvals/rejection-reasons")
    assert response.status_code == 200
    data = response.json()
    assert "TRAIN_DELAY_UNACCEPTABLE" in data
    assert "RESOURCE_UNAVAILABLE" in data
    assert "WINDOW_TOO_SHORT" in data
    assert "WEATHER_UNFAVORABLE" in data
    assert "EMERGENCY_OVERRIDE" in data


def test_list_pending_approvals():
    """Verify pending approval plans are listed."""
    response = client.get("/api/approvals/pending")
    assert response.status_code == 200
    data = response.json()
    assert "pending_count" in data
    assert "plans" in data
    plan_ids = [p["plan_id"] for p in data["plans"]]
    assert "PLN-V1" in plan_ids


def test_department_signoff_status():
    """Verify 4-department sign-off status for PLN-V1."""
    response = client.get("/api/approvals/PLN-V1/departments")
    assert response.status_code == 200
    data = response.json()
    assert data["plan_id"] == "PLN-V1"
    assert len(data["departments"]) == 4
    dept_ids = [d["id"] for d in data["departments"]]
    assert "ENG" in dept_ids
    assert "TRD" in dept_ids
    assert "SNT" in dept_ids
    assert "OPT" in dept_ids


def test_department_sign_approve():
    """Verify submitting departmental approval updates status."""
    payload = {
        "reviewer_user_id": "USR-ENG-01",
        "department": "Civil Engineering",
        "action": "APPROVE",
        "comments": "Civil track clearance granted for tamping operations.",
    }
    response = client.post("/api/approvals/PLN-V1/sign", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "SUCCESS"
    assert data["action"] == "APPROVE"
    assert data["department"] == "Civil Engineering"


def test_recalculate_plan_creates_v2():
    """Verify rejecting PLN-V1 triggers AI recalculation creating PLN-V2."""
    payload = {
        "plan_version_id": "PLN-V1",
        "reviewer_user_id": "USR-OPT-01",
        "department": "Operating",
        "rejection_code": "TRAIN_DELAY_UNACCEPTABLE",
        "feedback_comments": "Delay to coaching train 12951 exceeds tolerance. Shift block to night window.",
    }
    response = client.post("/api/approvals/recalculate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "SUCCESS"
    assert data["base_plan_id"] == "PLN-V1"
    assert data["new_plan_id"].startswith("PLN-V")
    assert data["rejection_code"] == "TRAIN_DELAY_UNACCEPTABLE"
    assert data["kpi_comparison"]["delta"]["conflicts_resolved"] >= 1
    assert data["kpi_comparison"]["delta"]["punctuality_gain_pct"] > 0


def test_list_plan_versions():
    """Verify all plan versions including base and recalculated plans are listed."""
    response = client.get("/api/plans")
    assert response.status_code == 200
    plans = response.json()
    assert isinstance(plans, list)
    assert len(plans) >= 2
    plan_ids = [p["id"] for p in plans]
    assert "PLN-V1" in plan_ids


def test_plan_version_detail():
    """Verify retrieving detailed blocks and tasks for PLN-V1."""
    response = client.get("/api/plans/PLN-V1")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == "PLN-V1"
    assert "blocks" in data
    assert "conflicts" in data
    assert len(data["blocks"]) > 0


def test_compare_plan_versions():
    """Verify side-by-side comparison between PLN-V1 and PLN-V2."""
    response = client.get("/api/plans/compare?v1=PLN-V1&v2=PLN-V2")
    assert response.status_code == 200
    data = response.json()
    assert "v1" in data
    assert "v2" in data
    assert "kpi_deltas" in data
    assert "scheduled_tasks" in data["kpi_deltas"]
    assert "asset_availability_pct" in data["kpi_deltas"]
    assert "train_punctuality_pct" in data["kpi_deltas"]
    assert "block_diffs" in data
    assert len(data["block_diffs"]) > 0
    assert "overall_verdict" in data


def test_activate_plan_version():
    """Verify activating a plan version sets status to ACTIVE."""
    payload = {
        "user_id": "USR-ADM-01",
        "activation_reason": "Approved by Joint Operating Committee for corridor execution.",
    }
    response = client.post("/api/plans/PLN-V2/activate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "SUCCESS"
    assert data["plan_id"] == "PLN-V2"
    assert data["new_status"] == "ACTIVE"

    # Verify via database that audit log was recorded
    db = SessionLocal()
    try:
        log = db.query(AuditLog).filter(AuditLog.entity_id == "PLN-V2", AuditLog.action == "PLAN_ACTIVATED").first()
        assert log is not None
        assert log.user_id == "USR-ADM-01"
    finally:
        db.close()
