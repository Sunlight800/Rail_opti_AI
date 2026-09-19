"""Asset inventory and health API endpoints."""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from rail_opti.database.session import get_db
from rail_opti.database.models import Asset, AssetHealth, Defect, RailwaySection
from rail_opti.core.auth_deps import get_current_user, get_department_scope

router = APIRouter(prefix="/assets", tags=["Assets"])


@router.get("")
def list_assets(
    department_id: Optional[str] = Query(None),
    asset_type: Optional[str] = Query(None),
    criticality: Optional[str] = Query(None),
    section_id: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(25, ge=1, le=100),
    current_user: Any = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Return paginated list of railway assets with health indicators and department scoping."""
    query = db.query(Asset)

    user_dept = get_department_scope(current_user)
    if user_dept:
        query = query.filter(Asset.department_id == user_dept)
    elif department_id:
        query = query.filter(Asset.department_id == department_id.upper())
    if asset_type:
        query = query.filter(Asset.asset_type == asset_type.upper())
    if criticality:
        query = query.filter(Asset.criticality == criticality.upper())
    if section_id:
        query = query.filter(Asset.section_id == section_id)

    total_count = query.count()
    assets = query.order_by(Asset.cumulative_gmt.desc()).offset((page - 1) * limit).limit(limit).all()

    results = []
    for a in assets:
        h = a.health_records[0] if a.health_records else None
        results.append({
            "id": a.id,
            "name": a.name,
            "section_id": a.section_id,
            "department_id": a.department_id,
            "asset_type": a.asset_type,
            "criticality": a.criticality,
            "cumulative_gmt": a.cumulative_gmt,
            "health_score": h.health_score if h else 85.0,
            "failure_probability": h.failure_probability if h else 0.2,
            "urgency_level": h.urgency_level if h else "ROUTINE",
            "active_defects_count": len(a.defects),
        })

    return {
        "total_count": total_count,
        "page": page,
        "limit": limit,
        "assets": results,
    }


@router.get("/{asset_id}")
def get_asset_detail(asset_id: str, db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Return full details for a specific asset including defect and inspection history."""
    a = db.query(Asset).filter_by(id=asset_id).first()
    if not a:
        raise HTTPException(status_code=404, detail=f"Asset '{asset_id}' not found.")

    h = a.health_records[0] if a.health_records else None
    defects = [
        {
            "id": d.id,
            "defect_type": d.defect_type,
            "severity": d.severity,
            "detected_date": d.detected_date.isoformat(),
            "status": d.status,
            "description": d.description,
        }
        for d in a.defects
    ]

    return {
        "id": a.id,
        "name": a.name,
        "section": {
            "id": a.section.id if a.section else a.section_id,
            "name": a.section.name if a.section else a.section_id,
            "speed_limit_kmh": a.section.speed_limit_kmh if a.section else 130,
        },
        "department_id": a.department_id,
        "asset_type": a.asset_type,
        "criticality": a.criticality,
        "cumulative_gmt": a.cumulative_gmt,
        "installation_date": a.installation_date.isoformat(),
        "last_maintenance_date": a.last_maintenance_date.isoformat() if a.last_maintenance_date else None,
        "health": {
            "health_score": h.health_score if h else 85.0,
            "failure_probability": h.failure_probability if h else 0.2,
            "overdue_days": h.overdue_days if h else 0,
            "urgency_level": h.urgency_level if h else "ROUTINE",
            "evidence_summary": h.evidence_summary if h else "Normal operational status.",
        },
        "defects": defects,
    }


@router.get("/{asset_id}/health")
def get_asset_health(asset_id: str, db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Return computed health index and AI failure probability for an asset."""
    a = db.query(Asset).filter_by(id=asset_id).first()
    if not a:
        raise HTTPException(status_code=404, detail=f"Asset '{asset_id}' not found.")

    h = a.health_records[0] if a.health_records else None
    return {
        "asset_id": a.id,
        "asset_name": a.name,
        "health_score": h.health_score if h else 85.0,
        "failure_probability": h.failure_probability if h else 0.2,
        "overdue_days": h.overdue_days if h else 0,
        "urgency_level": h.urgency_level if h else "ROUTINE",
        "evidence_summary": h.evidence_summary if h else "Normal diagnostic evaluation.",
        "disclaimer": "DEMO / SIMULATED AI HEALTH ENGINE — NOT CONNECTED TO LIVE IR SYSTEMS",
    }
