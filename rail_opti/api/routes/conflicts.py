"""Conflict Detection API endpoints for RAILOPT AI."""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
from rail_opti.database.session import get_db
from rail_opti.database.models import Conflict
from rail_opti.engines.conflict_detector import conflict_engine

router = APIRouter(prefix="/conflicts", tags=["Conflict Detection"])


class ConflictResolutionRequest(BaseModel):
    resolution_option_id: str = "OPT-SHIFT"
    notes: Optional[str] = "Approved by Section Controller"


@router.get("")
def list_conflicts(
    severity: Optional[str] = Query(None, description="Filter by severity: CRITICAL, HIGH, MEDIUM, INFO"),
    is_resolved: Optional[bool] = Query(None, description="Filter by resolution status"),
    plan_version_id: Optional[str] = Query("PLN-V1", description="Filter by plan version ID"),
    db: Session = Depends(get_db),
) -> List[Dict[str, Any]]:
    """List conflicts matching optional severity, resolved status, and plan version."""
    query = db.query(Conflict).filter(Conflict.plan_version_id == plan_version_id)
    if severity:
        query = query.filter(Conflict.severity == severity)
    if is_resolved is not None:
        query = query.filter(Conflict.is_resolved == is_resolved)

    conflicts = query.all()
    result = []
    for c in conflicts:
        result.append({
            "id": c.id,
            "plan_version_id": c.plan_version_id,
            "conflict_type": c.conflict_type,
            "severity": c.severity,
            "block_id": c.block_id,
            "train_id": c.train_id,
            "resource_id": c.resource_id,
            "explanation": c.explanation,
            "resolution_options": c.resolution_options_json or [],
            "is_resolved": c.is_resolved,
        })
    return result


@router.get("/summary")
def get_conflicts_summary(
    plan_version_id: Optional[str] = Query("PLN-V1"),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Retrieve summary counts of conflicts by severity and resolution status."""
    conflicts = db.query(Conflict).filter(Conflict.plan_version_id == plan_version_id).all()

    total = len(conflicts)
    critical_count = sum(1 for c in conflicts if c.severity == "CRITICAL" and not c.is_resolved)
    high_count = sum(1 for c in conflicts if c.severity == "HIGH" and not c.is_resolved)
    medium_count = sum(1 for c in conflicts if c.severity == "MEDIUM" and not c.is_resolved)
    resolved_count = sum(1 for c in conflicts if c.is_resolved)

    return {
        "total_conflicts": total,
        "critical_count": critical_count,
        "high_count": high_count,
        "medium_count": medium_count,
        "resolved_count": resolved_count,
        "unresolved_count": total - resolved_count,
        "resolution_rate_pct": round((resolved_count / total * 100), 1) if total > 0 else 100.0,
    }


@router.get("/{conflict_id}")
def get_conflict_detail(conflict_id: str, db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Retrieve detailed breakdown and resolution options for a specific conflict."""
    c = db.query(Conflict).filter_by(id=conflict_id).first()
    if not c:
        raise HTTPException(status_code=404, detail=f"Conflict '{conflict_id}' not found.")

    return {
        "id": c.id,
        "plan_version_id": c.plan_version_id,
        "conflict_type": c.conflict_type,
        "severity": c.severity,
        "block_id": c.block_id,
        "train_id": c.train_id,
        "resource_id": c.resource_id,
        "explanation": c.explanation,
        "resolution_options": c.resolution_options_json or [],
        "is_resolved": c.is_resolved,
    }


@router.post("/scan")
def trigger_conflict_scan(
    plan_version_id: Optional[str] = Query("PLN-V1"),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Run dynamic multi-rule conflict detection across the entire corridor plan."""
    detected = conflict_engine.scan_all_conflicts(db, plan_version_id=plan_version_id)
    return {
        "status": "COMPLETED",
        "plan_version_id": plan_version_id,
        "conflicts_detected_count": len(detected),
        "conflicts": detected,
    }


@router.post("/{conflict_id}/resolve")
def resolve_conflict(
    conflict_id: str,
    req: ConflictResolutionRequest,
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Apply selected resolution option to resolve a conflict."""
    res = conflict_engine.resolve_conflict(
        db,
        conflict_id=conflict_id,
        resolution_option_id=req.resolution_option_id,
    )
    if not res.get("success"):
        raise HTTPException(status_code=404, detail=res.get("error"))
    return res
