"""Department metrics and directory API."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from rail_opti.database.session import get_db
from rail_opti.database.models import Department, MaintenanceTask, Asset

router = APIRouter(prefix="/departments", tags=["Departments"])


@router.get("")
def list_departments(db: Session = Depends(get_db)) -> List[Dict[str, Any]]:
    """Return all participating departments with active tasks and asset counts."""
    departments = db.query(Department).all()
    results = []

    for d in departments:
        active_tasks = db.query(MaintenanceTask).filter_by(department_id=d.id).count()
        asset_count = db.query(Asset).filter_by(department_id=d.id).count()
        results.append({
            "id": d.id,
            "name": d.name,
            "color_code": d.color_code,
            "active_tasks_count": active_tasks,
            "asset_count": asset_count,
        })

    return results
