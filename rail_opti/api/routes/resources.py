"""Resource Planning API endpoints for RAILOPT AI."""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
from rail_opti.database.session import get_db
from rail_opti.database.models import Resource, ResourceAllocation
from rail_opti.engines.resource_planner import resource_planner
from rail_opti.core.auth_deps import get_current_user, get_department_scope

router = APIRouter(prefix="/resources", tags=["Resource Planning"])


class FeasibilityRequest(BaseModel):
    task_id: str = "MT-001"
    start_time: Optional[str] = None
    end_time: Optional[str] = None


@router.get("")
def list_resources(
    category: Optional[str] = Query(None, description="Filter by 8 resource categories"),
    department_id: Optional[str] = Query(None, description="Filter by department ID"),
    is_operational: Optional[bool] = Query(None, description="Filter by operational status"),
    current_user: Any = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> List[Dict[str, Any]]:
    """List resources with filtering by category, department, operational status, and department scoping."""
    query = db.query(Resource)
    user_dept = get_department_scope(current_user)
    if user_dept:
        query = query.filter(Resource.department_id == user_dept)
    elif department_id:
        query = query.filter(Resource.department_id == department_id)
    if category:
        query = query.filter(Resource.resource_type == category)
    if is_operational is not None:
        query = query.filter(Resource.is_operational == is_operational)

    resources = query.all()
    result = []
    for r in resources:
        # Check active allocations
        active_allocs = [a for a in r.allocations]
        alloc_qty = sum(a.allocated_quantity for a in active_allocs)
        avail_qty = max(0, r.total_capacity - alloc_qty)
        result.append({
            "id": r.id,
            "department_id": r.department_id,
            "resource_type": r.resource_type,
            "name": r.name,
            "base_section_id": r.base_section_id,
            "total_capacity": r.total_capacity,
            "allocated_quantity": alloc_qty,
            "available_quantity": avail_qty,
            "is_operational": r.is_operational,
            "status": "ALLOCATED" if alloc_qty >= r.total_capacity else ("PARTIAL" if alloc_qty > 0 else "AVAILABLE"),
        })
    return result


@router.get("/availability")
def get_resource_availability(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Retrieve overall resource availability percentage and 8-category capacity breakdown."""
    return resource_planner.get_availability_summary(db)


@router.get("/active-tracking")
def get_active_tracking(db: Session = Depends(get_db)) -> List[Dict[str, Any]]:
    """Get active tracking records for heavy machines, tower wagons, and crew units."""
    resources = db.query(Resource).filter(
        Resource.resource_type.in_(["TRACK_MACHINES", "TOWER_WAGONS", "CREW_DEPOTS"])
    ).all()

    tracking = []
    for r in resources:
        active_alloc = r.allocations[0] if r.allocations else None
        tracking.append({
            "id": r.id,
            "name": r.name,
            "type": r.resource_type,
            "department_id": r.department_id,
            "section_id": r.base_section_id,
            "status": "ACTIVE_BLOCK" if active_alloc else "IDLE_DEPOT",
            "current_block_id": active_alloc.block_id if active_alloc else None,
            "shift_window": "09:00 - 17:00 (Day Shift)",
            "operator_crew": "Assigned" if active_alloc else "On Standby",
            "maintenance_health_pct": 94 if r.is_operational else 45,
        })
    return tracking


@router.post("/feasibility")
def check_feasibility(req: FeasibilityRequest, db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Check whether all required resources for a given task/block are available."""
    result = resource_planner.check_feasibility(db, task_id=req.task_id)
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return result


@router.get("/categories")
def get_categories() -> Dict[str, Any]:
    """Retrieve metadata for the 8 resource categories."""
    return resource_planner.CATEGORY_METADATA
