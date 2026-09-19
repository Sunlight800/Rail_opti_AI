"""Priority Engine API endpoints for RAILOPT AI."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
from rail_opti.database.session import get_db
from rail_opti.database.models import MaintenanceTask, PriorityScore
from rail_opti.engines.priority_engine import priority_engine

router = APIRouter(prefix="/priority", tags=["Priority Engine"])


class PriorityRecalculationRequest(BaseModel):
    task_id: Optional[str] = "MT-001"
    safety_risk: float = 96.0
    failure_probability: float = 84.0
    asset_criticality: float = 78.0
    maintenance_urgency: float = 72.0
    traffic_impact: float = 65.0
    defect_severity: float = 83.0
    weights: Optional[Dict[str, float]] = None
    has_safety_critical_defect: bool = False


@router.get("/{task_id}")
def get_task_priority(task_id: str, db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Retrieve 6-factor priority formula breakdown for a specific task."""
    task = db.query(MaintenanceTask).filter_by(id=task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail=f"Task '{task_id}' not found.")

    ps = task.priority_scores[0] if task.priority_scores else None
    if ps:
        # Use recorded values
        return priority_engine.calculate_priority(
            safety_risk=ps.safety_risk,
            failure_probability=ps.failure_probability,
            asset_criticality=ps.asset_criticality,
            maintenance_urgency=ps.maintenance_urgency,
            traffic_impact=ps.traffic_impact,
            defect_severity=ps.defect_severity,
            has_safety_critical_defect=task.safety_critical_flag,
        )

    # Fallback to defaults
    return priority_engine.calculate_priority(
        safety_risk=80.0,
        failure_probability=70.0,
        asset_criticality=65.0,
        maintenance_urgency=60.0,
        traffic_impact=50.0,
        defect_severity=60.0,
    )


@router.post("/recalculate")
def recalculate_priority(req: PriorityRecalculationRequest) -> Dict[str, Any]:
    """Recalculate priority with custom factors and weight adjustments."""
    return priority_engine.calculate_priority(
        safety_risk=req.safety_risk,
        failure_probability=req.failure_probability,
        asset_criticality=req.asset_criticality,
        maintenance_urgency=req.maintenance_urgency,
        traffic_impact=req.traffic_impact,
        defect_severity=req.defect_severity,
        weights=req.weights,
        has_safety_critical_defect=req.has_safety_critical_defect,
    )
