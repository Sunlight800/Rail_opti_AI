"""Tests for Authentication and Dashboard API endpoints."""


def test_auth_login(client):
    """Test login with demo admin account."""
    response = client.post(
        "/api/auth/login",
        json={"username": "admin", "password": "demoPassword123"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["username"] == "admin"
    assert data["user"]["role"] == "ADMIN"


def test_auth_me(client):
    """Test getting current user profile."""
    response = client.get("/api/auth/me")
    assert response.status_code == 200
    data = response.json()
    assert data["username"] == "admin"
    assert data["avatar_initials"] == "AD"


def test_dashboard_kpis(client):
    """Test dashboard KPIs match the concept specifications."""
    response = client.get("/api/dashboard/kpis")
    assert response.status_code == 200
    data = response.json()
    assert data["network_health_score"] == 92
    assert data["active_corridor"]["name"] == "Delhi - Mumbai"
    assert data["kpis"]["critical_tasks"]["value"] == "12"
    assert data["kpis"]["active_blocks"]["value"] == "28"
    assert data["kpis"]["asset_availability"]["value"] == "88%"
    assert data["kpis"]["conflicts"]["value"] == "7"
    assert data["kpis"]["pending_approvals"]["value"] == "5"
    assert data["kpis"]["block_hours_saved"]["value"] == "124"
    assert len(data["critical_tasks"]) == 5
    assert data["critical_tasks"][0]["id"] == "MT-001"
    assert data["resource_availability"]["overall_utilization_pct"] == 76
    assert len(data["pending_verifications"]) == 5


def test_dashboard_timeline(client):
    """Test dashboard timeline data."""
    response = client.get("/api/dashboard/timeline")
    assert response.status_code == 200
    data = response.json()
    assert len(data["trains"]) == 3
    assert len(data["maintenance_blocks"]) == 4
    assert len(data["network_sections"]) == 3
    assert data["trains"][0]["train_name"] == "Rajdhani Exp"
