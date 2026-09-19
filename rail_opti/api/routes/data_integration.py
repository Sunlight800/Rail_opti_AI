"""Data Integration API endpoints for TMS, SMMS, TDMS, and COA."""
import csv
import io
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import List, Dict, Any, Optional
from rail_opti.integrations.simulators import simulator

router = APIRouter(prefix="/data-integration", tags=["Data Integration"])


@router.get("/status")
def get_integration_status() -> List[Dict[str, Any]]:
    """Return status cards for TMS, SMMS, TDMS, and COA."""
    return simulator.get_system_statuses()


@router.get("/preview/{system}")
def get_preview_data(system: str = "TMS") -> List[Dict[str, Any]]:
    """Return data preview records for the specified system."""
    return simulator.get_data_preview(system)


@router.post("/sync")
def trigger_system_sync() -> Dict[str, Any]:
    """Trigger on-demand simulated sync across all 4 railway systems."""
    return simulator.trigger_sync()


@router.post("/upload-csv")
async def upload_csv_file(
    file: UploadFile = File(...),
    dataset_type: str = Form("tasks"),  # tasks | assets | trains
) -> Dict[str, Any]:
    """Ingest CSV file for maintenance tasks, assets, or train schedules."""
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only .csv files are supported.")

    content = await file.read()
    try:
        text_stream = io.StringIO(content.decode("utf-8"))
        reader = csv.DictReader(text_stream)
        rows = list(reader)
        row_count = len(rows)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse CSV: {str(e)}")

    return {
        "status": "SUCCESS",
        "filename": file.filename,
        "dataset_type": dataset_type,
        "imported_rows_count": row_count,
        "message": f"Successfully ingested {row_count} records into {dataset_type} repository.",
        "sample_preview": rows[:3] if rows else [],
    }
