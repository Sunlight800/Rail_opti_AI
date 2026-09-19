"""Tests for Analytics, Reports Engine, and Audit Trail (Phases 19 & 20)."""
import pytest
from fastapi.testclient import TestClient
from rail_opti.api.app import app

client = TestClient(app)


def test_analytics_kpi_trends():
    """Verify 7-day rolling KPI trends return valid metrics."""
    response = client.get("/api/analytics/kpi-trends")
    assert response.status_code == 200
    data = response.json()
    assert "trend_days" in data
    assert len(data["trend_days"]) == 7
    assert "summary" in data
    assert "current_availability_pct" in data["summary"]
    assert "current_punctuality_pct" in data["summary"]


def test_analytics_departmental_breakdown():
    """Verify 4-department breakdown has tasks and utilization metrics."""
    response = client.get("/api/analytics/departmental-breakdown")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 4
    dept_ids = [d["department_id"] for d in data]
    assert "ENG" in dept_ids
    assert "TRD" in dept_ids
    assert "SNT" in dept_ids
    assert "OPT" in dept_ids


def test_analytics_corridor_performance():
    """Verify corridor section performance scorecard returns all sections."""
    response = client.get("/api/analytics/corridor-performance")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 10
    sec_ids = [s["section_id"] for s in data]
    assert "SEC-NDLS-ALD" in sec_ids


def test_reports_list_templates():
    """Verify available report templates are listed."""
    response = client.get("/api/reports/list")
    assert response.status_code == 200
    templates = response.json()
    assert len(templates) >= 4
    t_ids = [t["id"] for t in templates]
    assert "REP-DAILY-BLOCKS" in t_ids
    assert "REP-7DAY-CORRIDOR" in t_ids


def test_reports_generate():
    """Verify generating a report produces executive summary, tables, and disclaimer."""
    payload = {
        "template_id": "REP-DAILY-BLOCKS",
        "corridor_id": "COR-DEL-BOM",
        "department_id": "ALL",
    }
    response = client.post("/api/reports/generate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["report_id"].startswith("REP-")
    assert "executive_summary" in data
    assert "table_data" in data
    assert "disclaimer" in data
    assert "SIMULATED DATA" in data["disclaimer"]


def test_audit_logs_list():
    """Verify immutable audit log records are queryable."""
    response = client.get("/api/audit/logs")
    assert response.status_code == 200
    data = response.json()
    assert "logs" in data
    assert len(data["logs"]) >= 1


def test_audit_actions():
    """Verify distinct audit action types are returned."""
    response = client.get("/api/audit/actions")
    assert response.status_code == 200
    actions = response.json()
    assert isinstance(actions, list)
    assert len(actions) >= 1
