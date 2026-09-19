"""Verification tests for Phase 4: Data Integration Modules (TMS, SMMS, TDMS, COA)."""
import io


def test_integration_status(client):
    """Verify integration status endpoint returns all 4 systems."""
    response = client.get("/api/data-integration/status")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 4
    system_ids = {s["id"] for s in data}
    assert {"TMS", "SMMS", "TDMS", "COA"} == system_ids
    for s in data:
        assert s["status"] == "Connected"
        assert s["mode"] == "Demo Data"
        assert s["data_quality_pct"] >= 95.0


def test_integration_preview_tms(client):
    """Verify data preview for TMS."""
    response = client.get("/api/data-integration/preview/TMS")
    assert response.status_code == 200
    rows = response.json()
    assert len(rows) >= 5
    assert rows[0]["task_id"] == "MT-001"
    assert rows[0]["priority"] == "CRITICAL"


def test_integration_preview_smms_tdms_coa(client):
    """Verify data preview for other systems."""
    for sys in ["SMMS", "TDMS", "COA"]:
        response = client.get(f"/api/data-integration/preview/{sys}")
        assert response.status_code == 200
        assert len(response.json()) >= 3


def test_integration_sync_all(client):
    """Verify on-demand sync endpoint."""
    response = client.post("/api/data-integration/sync")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "SUCCESS"
    assert "TMS, SMMS, TDMS, COA" in data["message"]


def test_upload_csv_file(client):
    """Verify CSV file upload and parsing."""
    csv_content = "task_id,asset_id,section,priority\nMT-999,Track 10X,NDLS-ALD,HIGH\nMT-998,OHE-99,ALD-BPL,MEDIUM"
    files = {"file": ("test_tasks.csv", io.BytesIO(csv_content.encode("utf-8")), "text/csv")}
    data = {"dataset_type": "tasks"}

    response = client.post("/api/data-integration/upload-csv", files=files, data=data)
    assert response.status_code == 200
    res_data = response.json()
    assert res_data["status"] == "SUCCESS"
    assert res_data["imported_rows_count"] == 2
    assert len(res_data["sample_preview"]) == 2
    assert res_data["sample_preview"][0]["task_id"] == "MT-999"
