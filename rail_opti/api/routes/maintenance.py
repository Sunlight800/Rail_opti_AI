"""Maintenance Tasks API endpoints for RAILOPT AI."""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from rail_opti.database.session import get_db
from rail_opti.database.models import MaintenanceTask, PriorityScore, RiskAssessment, ResourceRequirement, Defect, Asset
from rail_opti.core.auth_deps import get_current_user, get_department_scope, RoleEnum

router = APIRouter(prefix="/maintenance", tags=["Maintenance"])


@router.get("")
def list_maintenance_tasks(
    department_id: Optional[str] = Query(None, description="Filter by department (ENG, TRD, SNT)"),
    priority: Optional[str] = Query(None, description="Filter by priority (CRITICAL, HIGH, MEDIUM, LOW)"),
    status: Optional[str] = Query(None, description="Filter by status"),
    section_id: Optional[str] = Query(None, description="Filter by railway section"),
    search: Optional[str] = Query(None, description="Search term for task ID or asset"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: Any = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Return paginated list of maintenance tasks with filtering and department scoping."""
    query = db.query(MaintenanceTask)

    user_dept = get_department_scope(current_user)
    if user_dept:
        query = query.filter(MaintenanceTask.department_id == user_dept)
    elif department_id:
        query = query.filter(MaintenanceTask.department_id == department_id.upper())
    if priority:
        query = query.filter(MaintenanceTask.severity == priority.upper())
    if status:
        query = query.filter(MaintenanceTask.status == status.upper())
    if section_id:
        query = query.filter(MaintenanceTask.section_id == section_id)
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (MaintenanceTask.id.ilike(search_term)) |
            (MaintenanceTask.task_type.ilike(search_term))
        )

    total_count = query.count()
    tasks = query.order_by(MaintenanceTask.requested_date.desc()).offset((page - 1) * limit).limit(limit).all()

    results = []
    for t in tasks:
        ps = t.priority_scores[0] if t.priority_scores else None
        ra = t.risk_assessments[0] if t.risk_assessments else None
        results.append({
            "id": t.id,
            "asset_id": t.asset_id,
            "asset_name": t.asset.name if t.asset else t.asset_id,
            "section_id": t.section_id,
            "department_id": t.department_id,
            "task_type": t.task_type,
            "severity": t.severity,
            "priority_score": ps.total_priority_score if ps else None,
            "risk_pct": int(ra.failure_probability_val * 100) if ra else 50,
            "requested_date": t.requested_date.isoformat(),
            "due_date": t.due_date.isoformat(),
            "estimated_duration_min": t.estimated_duration_min,
            "safety_critical_flag": t.safety_critical_flag,
            "status": t.status,
            "notes": t.notes,
        })

    return {
        "total_count": total_count,
        "page": page,
        "limit": limit,
        "tasks": results,
    }


@router.get("/{task_id}")
def get_maintenance_task_detail(task_id: str, db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Return full details for a specific task including defects, priority, and resource demands."""
    t = db.query(MaintenanceTask).filter_by(id=task_id).first()
    if not t:
        raise HTTPException(status_code=404, detail=f"Task '{task_id}' not found.")

    ps = t.priority_scores[0] if t.priority_scores else None
    ra = t.risk_assessments[0] if t.risk_assessments else None

    # Resource requirements
    resources = [
        {
            "id": r.id,
            "resource_type": r.resource_type,
            "required_quantity": r.required_quantity,
            "is_mandatory": r.is_mandatory,
            "alternative": r.alternative_resource_type,
        }
        for r in t.resource_requirements
    ]

    return {
        "id": t.id,
        "asset": {
            "id": t.asset.id if t.asset else t.asset_id,
            "name": t.asset.name if t.asset else t.asset_id,
            "type": t.asset.asset_type if t.asset else "UNKNOWN",
            "criticality": t.asset.criticality if t.asset else "MEDIUM",
            "cumulative_gmt": t.asset.cumulative_gmt if t.asset else 0.0,
        },
        "section_id": t.section_id,
        "department_id": t.department_id,
        "task_type": t.task_type,
        "severity": t.severity,
        "defect": {
            "id": t.defect.id if t.defect else None,
            "type": t.defect.defect_type if t.defect else None,
            "defect_type": t.defect.defect_type if t.defect else None,
            "severity": t.defect.severity if t.defect else None,
            "description": t.defect.description if t.defect else None,
        } if t.defect else None,

        "priority_score": {
            "total_score": ps.total_priority_score if ps else 0.0,
            "category": ps.priority_category if ps else t.severity,
            "factors": [
                {"name": "Safety Risk", "value": ps.safety_risk if ps else 0, "weight": 0.30, "contribution": round((ps.safety_risk if ps else 0) * 0.30, 1)},
                {"name": "Failure Probability", "value": ps.failure_probability if ps else 0, "weight": 0.20, "contribution": round((ps.failure_probability if ps else 0) * 0.20, 1)},
                {"name": "Asset Criticality", "value": ps.asset_criticality if ps else 0, "weight": 0.15, "contribution": round((ps.asset_criticality if ps else 0) * 0.15, 1)},
                {"name": "Maintenance Urgency", "value": ps.maintenance_urgency if ps else 0, "weight": 0.15, "contribution": round((ps.maintenance_urgency if ps else 0) * 0.15, 1)},
                {"name": "Traffic Impact", "value": ps.traffic_impact if ps else 0, "weight": 0.10, "contribution": round((ps.traffic_impact if ps else 0) * 0.10, 1)},
                {"name": "Defect Severity", "value": ps.defect_severity if ps else 0, "weight": 0.10, "contribution": round((ps.defect_severity if ps else 0) * 0.10, 1)},
            ] if ps else [],
            "ai_rationale": ps.ai_rationale if ps else "Standard priority calculation.",
        },
        "risk_assessment": {
            "safety_risk_level": ra.safety_risk_level if ra else t.severity,
            "failure_probability": ra.failure_probability_val if ra else 0.5,
            "operational_impact": ra.operational_impact_level if ra else "MEDIUM",
            "explanation": ra.explanation if ra else "Calculated based on asset operational logs.",
        },
        "resources_required": resources,
        "requested_date": t.requested_date.isoformat(),
        "due_date": t.due_date.isoformat(),
        "estimated_duration_min": t.estimated_duration_min,
        "safety_critical_flag": t.safety_critical_flag,
        "status": t.status,
        "notes": t.notes,
    }


@router.put("/{task_id}/status")
def update_task_status(
    task_id: str,
    new_status: str = Query(..., description="Target status"),
    current_user: Any = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Update task status with RBAC checks."""
    if getattr(current_user, "role", None) == RoleEnum.DEMO_USER.value:
        raise HTTPException(status_code=403, detail="Demo users have read-only access and cannot modify task statuses.")

    t = db.query(MaintenanceTask).filter_by(id=task_id).first()
    if not t:
        raise HTTPException(status_code=404, detail=f"Task '{task_id}' not found.")

    user_dept = get_department_scope(current_user)
    if user_dept and t.department_id != user_dept:
        raise HTTPException(
            status_code=403,
            detail=f"Users in {user_dept} department cannot modify tasks belonging to {t.department_id}."
        )

    valid_statuses = {"PENDING", "AT_RISK", "SCHEDULED", "IN_PROGRESS", "COMPLETED", "DEFERRED", "REJECTED", "BLOCKED", "OPEN"}
    status_upper = new_status.upper()
    if status_upper not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status '{new_status}'.")

    old_status = t.status
    t.status = status_upper
    db.commit()

    return {
        "task_id": task_id,
        "old_status": old_status,
        "new_status": status_upper,
        "message": f"Task {task_id} status updated to {status_upper}.",
    }
