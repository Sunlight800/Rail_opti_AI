"""Tests for Role-Based Access Control (RBAC) in RAILOPT AI."""
import pytest
from fastapi.testclient import TestClient
from rail_opti.api.app import app
from rail_opti.core.security import create_access_token


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture(autouse=True)
def ensure_plan_status():
    """Ensure PLN-V1 remains PENDING_REVIEW across all tests."""
    yield
    from rail_opti.database.session import SessionLocal
    from rail_opti.database.models import PlanVersion
    db = SessionLocal()
    try:
        p = db.query(PlanVersion).filter(PlanVersion.id == "PLN-V1").first()
        if p:
            p.status = "PENDING_REVIEW"
            db.commit()
    finally:
        db.close()


def get_auth_headers(role: str, user_id: str, dept: str = None) -> dict:
    """Generate auth headers containing a valid signed JWT for testing."""
    token = create_access_token(data={"sub": user_id, "role": role, "dept": dept})
    return {"Authorization": f"Bearer {token}", "X-User-Role": role}


class TestAuthenticationAndTokens:
    """Verify login and JWT token issuance for all 6 roles."""

    @pytest.mark.parametrize("username,password,expected_role", [
        ("admin", "admin123", "ADMIN"),
        ("control_office", "control123", "CONTROL_OFFICE"),
        ("engineering", "eng123", "ENGINEERING"),
        ("trd", "trd123", "TRD"),
        ("snt", "snt123", "SNT"),
        ("demo_user", "demo123", "DEMO_USER"),
    ])
    def test_login_success_all_roles(self, client, username, password, expected_role):
        response = client.post("/api/auth/login", json={"username": username, "password": password})
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert data["user"]["role"] == expected_role
        assert "permissions" in data["user"]
        assert len(data["user"]["permissions"]) > 0

    def test_login_invalid_credentials(self, client):
        response = client.post("/api/auth/login", json={"username": "admin", "password": "wrongpassword"})
        assert response.status_code == 401

    def test_current_user_me_endpoint(self, client):
        headers = get_auth_headers("CONTROL_OFFICE", "USR-CTRL-01", "OPERATING")
        response = client.get("/api/auth/me", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["role"] == "CONTROL_OFFICE"
        assert "APPROVE_PLAN" in data["permissions"]


class TestAdminModuleProtection:
    """Verify system-level audit logs are strictly protected."""

    def test_admin_can_access_audit_logs(self, client):
        headers = get_auth_headers("ADMIN", "USR-ADM-01")
        response = client.get("/api/audit", headers=headers)
        assert response.status_code == 200

    @pytest.mark.parametrize("role,user_id,dept", [
        ("CONTROL_OFFICE", "USR-CTRL-01", "OPERATING"),
        ("ENGINEERING", "USR-ENG-01", "ENG"),
        ("TRD", "USR-TRD-01", "TRD"),
        ("SNT", "USR-SNT-01", "SNT"),
        ("DEMO_USER", "USR-DEMO-01", None),
    ])
    def test_non_admin_forbidden_from_audit_logs(self, client, role, user_id, dept):
        headers = get_auth_headers(role, user_id, dept)
        response = client.get("/api/audit", headers=headers)
        assert response.status_code == 403
        assert "Access forbidden" in response.json()["detail"]


class TestOperationalApprovalsProtection:
    """Verify plan activation and sign-off restrictions."""

    def test_control_office_can_activate_plan(self, client):
        headers = get_auth_headers("CONTROL_OFFICE", "USR-CTRL-01", "OPERATING")
        response = client.post(
            "/api/plans/PLN-V2/activate",
            json={"activation_reason": "Approved by Section Controller"},
            headers=headers,
        )
        assert response.status_code == 200
        assert response.json()["new_status"] == "ACTIVE"

    def test_admin_can_activate_plan(self, client):
        headers = get_auth_headers("ADMIN", "USR-ADM-01")
        response = client.post(
            "/api/plans/PLN-V2/activate",
            json={"activation_reason": "Emergency Activation by Admin"},
            headers=headers,
        )
        assert response.status_code == 200

    @pytest.mark.parametrize("role,user_id,dept", [
        ("ENGINEERING", "USR-ENG-01", "ENG"),
        ("TRD", "USR-TRD-01", "TRD"),
        ("SNT", "USR-SNT-01", "SNT"),
        ("DEMO_USER", "USR-DEMO-01", None),
    ])
    def test_non_operations_forbidden_from_activating_plan(self, client, role, user_id, dept):
        headers = get_auth_headers(role, user_id, dept)
        response = client.post(
            "/api/plans/PLN-V1/activate",
            json={"activation_reason": "Attempted unauthorized activation"},
            headers=headers,
        )
        assert response.status_code == 403

    def test_demo_user_forbidden_from_signoff(self, client):
        headers = get_auth_headers("DEMO_USER", "USR-DEMO-01")
        response = client.post(
            "/api/approvals/PLN-V1/sign",
            json={"reviewer_user_id": "USR-DEMO-01", "department": "Civil", "action": "APPROVE"},
            headers=headers,
        )
        assert response.status_code == 403
        assert "Demo users have read-only access" in response.json()["detail"]

    def test_demo_user_forbidden_from_recalculate(self, client):
        headers = get_auth_headers("DEMO_USER", "USR-DEMO-01")
        response = client.post(
            "/api/approvals/recalculate",
            json={"plan_version_id": "PLN-V1", "reviewer_user_id": "USR-DEMO-01", "department": "Operating"},
            headers=headers,
        )
        assert response.status_code == 403

    def test_engineering_cannot_sign_electrical_clearance(self, client):
        headers = get_auth_headers("ENGINEERING", "USR-ENG-01", "ENG")
        response = client.post(
            "/api/approvals/PLN-V1/sign",
            json={"reviewer_user_id": "USR-ENG-01", "department": "Electrical", "action": "APPROVE"},
            headers=headers,
        )
        assert response.status_code == 403
        assert "only authorized to sign off for Civil Engineering" in response.json()["detail"]

    def test_engineering_can_sign_civil_clearance(self, client):
        headers = get_auth_headers("ENGINEERING", "USR-ENG-01", "ENG")
        response = client.post(
            "/api/approvals/PLN-V1/sign",
            json={"reviewer_user_id": "USR-ENG-01", "department": "Civil", "action": "APPROVE"},
            headers=headers,
        )
        assert response.status_code == 200
        assert response.json()["status"] == "SUCCESS"


class TestDepartmentalDataScoping:
    """Verify department filtering on tasks and assets."""

    def test_engineering_user_sees_only_eng_tasks(self, client):
        headers = get_auth_headers("ENGINEERING", "USR-ENG-01", "ENG")
        response = client.get("/api/maintenance", headers=headers)
        assert response.status_code == 200
        tasks = response.json()["tasks"]
        assert len(tasks) > 0
        assert all(t["department_id"] == "ENG" for t in tasks)

    def test_trd_user_sees_only_trd_tasks(self, client):
        headers = get_auth_headers("TRD", "USR-TRD-01", "TRD")
        response = client.get("/api/maintenance", headers=headers)
        assert response.status_code == 200
        tasks = response.json()["tasks"]
        assert len(tasks) > 0
        assert all(t["department_id"] == "TRD" for t in tasks)

    def test_snt_user_sees_only_snt_tasks(self, client):
        headers = get_auth_headers("SNT", "USR-SNT-01", "SNT")
        response = client.get("/api/maintenance", headers=headers)
        assert response.status_code == 200
        tasks = response.json()["tasks"]
        assert len(tasks) > 0
        assert all(t["department_id"] == "SNT" for t in tasks)

    def test_admin_sees_cross_departmental_tasks(self, client):
        headers = get_auth_headers("ADMIN", "USR-ADM-01")
        response = client.get("/api/maintenance", headers=headers)
        assert response.status_code == 200
        tasks = response.json()["tasks"]
        depts = {t["department_id"] for t in tasks}
        assert len(depts) > 1

    def test_demo_user_cannot_update_task_status(self, client):
        headers = get_auth_headers("DEMO_USER", "USR-DEMO-01")
        response = client.put("/api/maintenance/MT-001/status?new_status=COMPLETED", headers=headers)
        assert response.status_code == 403
        assert "Demo users have read-only access" in response.json()["detail"]
