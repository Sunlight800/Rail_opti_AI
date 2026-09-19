"""Risk Engine API endpoints."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
from rail_opti.database.session import get_db
from rail_opti.database.models import MaintenanceTask, Asset, Defect
from rail_opti.engines.risk_engine import risk_engine

router = APIRouter(prefix="/risk", tags=["Risk Engine"])


class RiskEvaluationRequest(BaseModel):
    task_id: Optional[str] = "MT-SIM-01"
    asset_type: str = "TRACK"
    severity: str = "HIGH"
    section_speed_kmh: int = 130
    cumulative_gmt: float = 65.0
    overdue_days: int = 25
    age_years: float = 8.0
    defect_severities: List[str] = ["HIGH"]


@router.get("/{task_id}")
def get_task_risk(task_id: str, db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Retrieve or compute risk assessment for a specific maintenance task."""
    task = db.query(MaintenanceTask).filter_by(id=task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail=f"Task '{task_id}' not found.")

    asset = task.asset
    speed = task.section.speed_limit_kmh if task.section else 130
    gmt = asset.cumulative_gmt if asset else 50.0
    atype = asset.asset_type if asset else "TRACK"

    defects = [{"severity": d.severity} for d in asset.defects] if asset else []

    risk_profile = risk_engine.evaluate_task_risk(
        task_id=task.id,
        asset_type=atype,
        severity=task.severity,
        section_speed_kmh=speed,
        cumulative_gmt=gmt,
        defects=defects,
        overdue_days=30 if task.severity in ["CRITICAL", "HIGH"] else 5,
        age_years=7.0,
    )

    return risk_profile


@router.post("/evaluate")
def evaluate_custom_risk(req: RiskEvaluationRequest) -> Dict[str, Any]:
    """Dynamic risk evaluation for feature sensitivity testing."""
    defects = [{"severity": s} for s in req.defect_severities]

    risk_profile = risk_engine.evaluate_task_risk(
        task_id=req.task_id or "MT-SIM-01",
        asset_type=req.asset_type,
        severity=req.severity,
        section_speed_kmh=req.section_speed_kmh,
        cumulative_gmt=req.cumulative_gmt,
        defects=defects,
        overdue_days=req.overdue_days,
        age_years=req.age_years,
    )

    return risk_profile
