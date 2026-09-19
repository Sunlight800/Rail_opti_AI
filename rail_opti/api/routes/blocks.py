"""Maintenance Blocks & Gantt Timeline API for RAILOPT AI."""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
from datetime import datetime
from rail_opti.database.session import get_db
from rail_opti.database.models import (
    MaintenanceBlock,
    BlockTask,
    MaintenanceTask,
    RailwaySection,
    TrainSchedule,
    Train,
    ConsolidationGroup,
)

router = APIRouter(prefix="/blocks", tags=["Maintenance Blocks & Gantt"])


class BlockUpdateRequest(BaseModel):
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    safety_status: Optional[str] = None


@router.get("")
def list_blocks(
    section_id: Optional[str] = Query(None),
    block_type: Optional[str] = Query(None),
    plan_version_id: Optional[str] = Query("PLN-V1"),
    db: Session = Depends(get_db),
) -> List[Dict[str, Any]]:
    """List maintenance blocks with section, timing, assigned tasks, and consolidation status."""
    query = db.query(MaintenanceBlock).filter(MaintenanceBlock.plan_version_id == plan_version_id)
    if section_id:
        query = query.filter(MaintenanceBlock.section_id == section_id)
    if block_type:
        query = query.filter(MaintenanceBlock.block_type == block_type)

    blocks = query.all()
    result = []
    for b in blocks:
        task_ids = [bt.task_id for bt in b.tasks]
        result.append({
            "id": b.id,
            "plan_version_id": b.plan_version_id,
            "section_id": b.section_id,
            "section_name": b.section.name if b.section else b.section_id,
            "block_type": b.block_type,
            "start_time": b.start_time.isoformat(),
            "end_time": b.end_time.isoformat(),
            "duration_min": b.duration_min,
            "safety_status": b.safety_status,
            "ai_explanation": b.ai_explanation,
            "task_count": len(task_ids),
            "assigned_task_ids": task_ids,
            "is_consolidated": b.consolidation_group_id is not None,
            "consolidation_group_id": b.consolidation_group_id,
        })
    return result


@router.get("/gantt")
def get_gantt_timeline_data(
    plan_version_id: Optional[str] = Query("PLN-V1"),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Retrieve combined Gantt timeline data: sections, maintenance blocks, and train occupancies."""
    sections = db.query(RailwaySection).all()
    blocks = db.query(MaintenanceBlock).filter(MaintenanceBlock.plan_version_id == plan_version_id).all()
    schedules = db.query(TrainSchedule).all()
    trains_map = {t.id: t for t in db.query(Train).all()}

    gantt_sections = []
    for s in sections[:6]:  # Primary Golden Quadrilateral sections
        # Filter blocks on section
        s_blocks = []
        for b in blocks:
            if b.section_id == s.id:
                s_blocks.append({
                    "id": b.id,
                    "type": "MAINTENANCE_BLOCK",
                    "block_type": b.block_type,
                    "title": f"{b.id} ({b.block_type.replace('_', ' ')})",
                    "start_time": b.start_time.strftime("%H:%M"),
                    "end_time": b.end_time.strftime("%H:%M"),
                    "start_hour": b.start_time.hour + b.start_time.minute / 60.0,
                    "end_hour": b.end_time.hour + b.end_time.minute / 60.0,
                    "duration_min": b.duration_min,
                    "safety_status": b.safety_status,
                    "task_count": len(b.tasks),
                    "is_consolidated": b.consolidation_group_id is not None,
                })

        # Filter trains on section
        s_trains = []
        for sch in schedules:
            if sch.section_id == s.id:
                trn = trains_map.get(sch.train_id)
                s_trains.append({
                    "id": sch.id,
                    "type": "TRAIN_OCCUPANCY",
                    "train_id": sch.train_id,
                    "train_number": trn.train_number if trn else sch.train_id,
                    "train_name": trn.train_name if trn else "Express",
                    "train_category": trn.train_category if trn else "COACHING_MAIL",
                    "entry_time": sch.scheduled_entry.strftime("%H:%M"),
                    "exit_time": sch.scheduled_exit.strftime("%H:%M"),
                    "start_hour": sch.scheduled_entry.hour + sch.scheduled_entry.minute / 60.0,
                    "end_hour": sch.scheduled_exit.hour + sch.scheduled_exit.minute / 60.0,
                    "delay_minutes": sch.delay_minutes,
                })

        gantt_sections.append({
            "section_id": s.id,
            "section_name": s.name,
            "track_type": s.track_type,
            "blocks": s_blocks,
            "trains": s_trains,
        })

    return {
        "timeline_window": "24_HOURS",
        "reference_date": datetime.utcnow().strftime("%Y-%m-%d"),
        "sections": gantt_sections,
    }


@router.get("/{block_id}")
def get_block_detail(block_id: str, db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Retrieve detailed information for a single maintenance block."""
    b = db.query(MaintenanceBlock).filter_by(id=block_id).first()
    if not b:
        raise HTTPException(status_code=404, detail=f"Maintenance block '{block_id}' not found.")

    tasks = []
    for bt in b.tasks:
        t = bt.task
        if t:
            tasks.append({
                "task_id": t.id,
                "task_type": t.task_type,
                "department_id": t.department_id,
                "severity": t.severity,
                "status": t.status,
                "safety_critical_flag": t.safety_critical_flag,
            })

    resources = []
    for ra in b.resource_allocations:
        r = ra.resource
        if r:
            resources.append({
                "resource_id": r.id,
                "name": r.name,
                "type": r.resource_type,
                "allocated_quantity": ra.allocated_quantity,
            })

    return {
        "id": b.id,
        "plan_version_id": b.plan_version_id,
        "section_id": b.section_id,
        "section_name": b.section.name if b.section else b.section_id,
        "block_type": b.block_type,
        "start_time": b.start_time.isoformat(),
        "end_time": b.end_time.isoformat(),
        "duration_min": b.duration_min,
        "safety_status": b.safety_status,
        "ai_explanation": b.ai_explanation,
        "is_consolidated": b.consolidation_group_id is not None,
        "tasks": tasks,
        "resources": resources,
    }


@router.put("/{block_id}")
def update_block(
    block_id: str,
    req: BlockUpdateRequest,
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Update block timing or safety status."""
    b = db.query(MaintenanceBlock).filter_by(id=block_id).first()
    if not b:
        raise HTTPException(status_code=404, detail=f"Maintenance block '{block_id}' not found.")

    if req.safety_status:
        b.safety_status = req.safety_status
    if req.start_time:
        b.start_time = datetime.fromisoformat(req.start_time)
    if req.end_time:
        b.end_time = datetime.fromisoformat(req.end_time)

    db.commit()
    return {"success": True, "block_id": b.id, "status": b.safety_status}
