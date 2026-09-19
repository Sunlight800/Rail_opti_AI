"""Reports Generation and Executive Export API for RAILOPT AI (Phase 19)."""
import datetime
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from rail_opti.database.session import get_db
from rail_opti.database.models import (
    PlanVersion,
    MaintenanceBlock,
    MaintenanceTask,
    Conflict,
    Department,
    RailwaySection,
)

router = APIRouter(prefix="/reports", tags=["Reports & Executive Exports"])


class ReportRequest(BaseModel):
    template_id: str = "REP-DAILY-BLOCKS"
    date_from: Optional[str] = None
    date_to: Optional[str] = None
    corridor_id: Optional[str] = "COR-DEL-BOM"
    department_id: Optional[str] = "ALL"


REPORT_TEMPLATES = [
    {
        "id": "REP-DAILY-BLOCKS",
        "title": "Daily Maintenance Block Execution Report",
        "category": "OPERATIONS",
        "frequency": "Daily",
        "description": "Comprehensive schedule of all approved, completed, and pending track, power, and integrated blocks for today.",
    },
    {
        "id": "REP-7DAY-CORRIDOR",
        "title": "7-Day Rolling Corridor Maintenance Plan",
        "category": "PLANNING",
        "frequency": "Weekly",
        "description": "Forward-looking 7-day schedule synthesized across Civil, TRD, and S&T departments with train headway safety buffers.",
    },
    {
        "id": "REP-AVAILABILITY-DOSSIER",
        "title": "Corridor Asset Availability & Reliability Dossier",
        "category": "EXECUTIVE",
        "frequency": "Monthly",
        "description": "Executive summary of gross asset availability, failure risk reductions, and cumulative block hours saved through AI consolidation.",
    },
    {
        "id": "REP-JOINT-SIGNOFF",
        "title": "Joint Multi-Department Sign-off & Audit Clearance",
        "category": "GOVERNANCE",
        "frequency": "Per Plan Version",
        "description": "Statutory 4-way departmental sign-off record with officer endorsements, reason codes, and constraint modification history.",
    },
]


@router.get("/list")
def list_report_templates() -> List[Dict[str, Any]]:
    """List available report templates."""
    return REPORT_TEMPLATES


@router.post("/generate")
def generate_report(
    req: ReportRequest,
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Generate structured report document ready for viewing and export."""
    now = datetime.datetime.now(datetime.UTC)
    template = next((t for t in REPORT_TEMPLATES if t["id"] == req.template_id), None)
    if not template:
        raise HTTPException(status_code=404, detail=f"Report template '{req.template_id}' not found.")

    # Fetch active or latest plan
    active_plan = db.query(PlanVersion).filter(PlanVersion.status == "ACTIVE").first()
    if not active_plan:
        active_plan = db.query(PlanVersion).order_by(PlanVersion.version_number.desc()).first()

    plan_kpis = active_plan.summary_kpis_json if active_plan else {}

    # Sample report sections based on template
    blocks = db.query(MaintenanceBlock).all()
    tasks = db.query(MaintenanceTask).all()

    report_payload = {
        "report_id": f"REP-{datetime.datetime.now().strftime('%Y%m%d')}-{req.template_id}",
        "template": template,
        "generated_at": now.isoformat(),
        "generated_by": "RAILOPT AI Automated Reporting System",
        "corridor": "Delhi - Mumbai Corridor (1384 km)",
        "parameters": {
            "template_id": req.template_id,
            "department": req.department_id,
            "corridor": req.corridor_id,
        },
        "executive_summary": {
            "active_plan_version": active_plan.id if active_plan else "PLN-V1",
            "total_blocks_scheduled": len(blocks),
            "asset_availability_pct": plan_kpis.get("asset_availability_pct", 88.4),
            "block_hours_saved": plan_kpis.get("block_hours_saved", 124.0),
            "train_punctuality_index": f"{plan_kpis.get('train_punctuality_pct', 94.2)}%",
            "high_risk_defects_rectified": 12,
        },
        "table_data": [
            {
                "block_id": b.id,
                "section": b.section_id,
                "block_type": b.block_type,
                "start_time": b.start_time.strftime("%H:%M"),
                "end_time": b.end_time.strftime("%H:%M"),
                "duration_min": b.duration_min,
                "safety_status": b.safety_status,
                "ai_explanation": b.ai_explanation,
            }
            for b in blocks[:10]
        ],
        "export_formats": ["CSV", "JSON", "PDF"],
        "disclaimer": "DEMO / SIMULATED DATA — NOT CONNECTED TO LIVE INDIAN RAILWAYS SYSTEMS",
    }

    return report_payload
