"""Verification tests for Phase 5: Maintenance Tasks, Assets & Departments APIs."""


def test_list_maintenance_tasks(client):
    """Verify paginated task listing and filtering."""
    # All tasks
    res = client.get("/api/maintenance?limit=50")
    assert res.status_code == 200
    data = res.json()
    assert data["total_count"] >= 100
    assert len(data["tasks"]) == 50

    # Department filter
    res_eng = client.get("/api/maintenance?department_id=ENG")
    assert res_eng.status_code == 200
    for t in res_eng.json()["tasks"]:
        assert t["department_id"] == "ENG"

    # Priority filter
    res_crit = client.get("/api/maintenance?priority=CRITICAL")
    assert res_crit.status_code == 200
    for t in res_crit.json()["tasks"]:
        assert t["severity"] == "CRITICAL"


def test_task_detail_mt001(client):
    """Verify detailed task breakdown for MT-001."""
    res = client.get("/api/maintenance/MT-001")
    assert res.status_code == 200
    data = res.json()
    assert data["id"] == "MT-001"
    assert data["asset"]["name"] == "Track Section 7A (Km 142/10-18)"
    assert data["defect"]["defect_type"] == "USFD_FLAW"
    assert data["priority_score"]["total_score"] == 89.3
    assert len(data["priority_score"]["factors"]) == 6
    assert len(data["resources_required"]) >= 4
    assert data["safety_critical_flag"] is True


def test_update_task_status(client):
    """Verify updating task status."""
    res = client.put("/api/maintenance/MT-003/status?new_status=IN_PROGRESS")
    assert res.status_code == 200
    assert res.json()["new_status"] == "IN_PROGRESS"

    # Verify updated status
    res_get = client.get("/api/maintenance/MT-003")
    assert res_get.json()["status"] == "IN_PROGRESS"


def test_list_assets_and_detail(client):
    """Verify assets listing and single asset detail."""
    res = client.get("/api/assets?limit=20")
    assert res.status_code == 200
    data = res.json()
    assert data["total_count"] >= 50
    assert len(data["assets"]) == 20

    # Asset detail
    res_ast = client.get("/api/assets/AST-TRK-7A")
    assert res_ast.status_code == 200
    ast_data = res_ast.json()
    assert ast_data["name"] == "Track Section 7A (Km 142/10-18)"
    assert ast_data["criticality"] == "CRITICAL"
    assert len(ast_data["defects"]) >= 2


def test_asset_health(client):
    """Verify asset health and failure probability."""
    res = client.get("/api/assets/AST-TRK-7A/health")
    assert res.status_code == 200
    h_data = res.json()
    assert h_data["failure_probability"] == 0.84
    assert h_data["health_score"] == 42.0
    assert h_data["urgency_level"] == "IMMEDIATE"


def test_list_departments(client):
    """Verify departments directory endpoint."""
    res = client.get("/api/departments")
    assert res.status_code == 200
    depts = res.json()
    assert len(depts) == 4
    dept_ids = {d["id"] for d in depts}
    assert {"ENG", "TRD", "SNT", "OPT"} == dept_ids
    for d in depts:
        assert d["active_tasks_count"] >= 0
