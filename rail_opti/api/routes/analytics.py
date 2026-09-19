"""Analytics and Operations Research Performance Reporting API for RAILOPT AI (Phase 19)."""
import datetime
from typing import Dict, Any, List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from rail_opti.database.session import get_db
from rail_opti.database.models import (
    MaintenanceTask,
    MaintenanceBlock,
    RailwaySection,
    Department,
    Conflict,
    PlanVersion,
    Asset,
)

router = APIRouter(prefix="/analytics", tags=["Analytics & KPIs"])


@router.get("/kpi-trends")
def get_kpi_trends(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Retrieve 7-day rolling KPI trends for asset availability, punctuality, and downtime savings."""
    today = datetime.date.today()
    days = []
    
    # 7-day historical + forecast trend
    base_avail = 86.5
    base_punct = 91.0
    base_hours = 95.0

    for i in range(7):
        day_date = today - datetime.timedelta(days=(6 - i))
        # Simulated progressive improvement as AI optimization is applied
        avail = round(base_avail + (i * 0.9) + (0.3 if i % 2 == 0 else -0.2), 1)
        punct = round(base_punct + (i * 0.7) + (0.4 if i % 3 == 0 else -0.3), 1)
        hours = round(base_hours + (i * 4.8), 1)
        conflicts = max(1, 12 - (i * 2) + (1 if i % 2 == 1 else 0))

        days.append({
            "date": day_date.strftime("%b %d"),
            "full_date": day_date.isoformat(),
            "asset_availability_pct": min(95.0, avail),
            "train_punctuality_pct": min(98.0, punct),
            "block_hours_saved": hours,
            "conflicts_count": conflicts,
            "maintenance_downtime_hours": round(42.0 - (i * 2.1), 1),
        })

    return {
        "corridor": "Delhi - Mumbai High-Density Corridor",
        "trend_days": days,
        "summary": {
            "current_availability_pct": days[-1]["asset_availability_pct"],
            "current_punctuality_pct": days[-1]["train_punctuality_pct"],
            "total_block_hours_saved": days[-1]["block_hours_saved"],
            "net_availability_gain_pct": round(days[-1]["asset_availability_pct"] - days[0]["asset_availability_pct"], 1),
        }
    }


@router.get("/departmental-breakdown")
def get_departmental_breakdown(db: Session = Depends(get_db)) -> List[Dict[str, Any]]:
    """Retrieve maintenance task distribution, block hours, and resource utilization per department."""
    departments = db.query(Department).all()
    results = []

    for d in departments:
        tasks = db.query(MaintenanceTask).filter(MaintenanceTask.department_id == d.id).all()
        total_tasks = len(tasks)
        scheduled = sum(1 for t in tasks if t.status in ["SCHEDULED", "AI SCHEDULED"])
        pending = sum(1 for t in tasks if t.status in ["PENDING", "OPEN", "UNDER REVIEW"])
        critical = sum(1 for t in tasks if t.severity == "CRITICAL" or t.safety_critical_flag)

        # Department-specific metrics
        dept_utilization = {
            "ENG": 88.5,
            "TRD": 76.2,
            "SNT": 81.0,
            "OPT": 92.4,
        }.get(d.id, 75.0)

        block_hours = {
            "ENG": 68.0,
            "TRD": 34.5,
            "SNT": 26.0,
            "OPT": 14.0,
        }.get(d.id, 20.0)

        results.append({
            "department_id": d.id,
            "department_name": d.name,
            "color_code": d.color_code,
            "total_tasks": total_tasks,
            "scheduled_tasks": scheduled,
            "pending_tasks": pending,
            "critical_tasks": critical,
            "block_hours_consumed": block_hours,
            "resource_utilization_pct": dept_utilization,
        })

    return results


@router.get("/corridor-performance")
def get_corridor_performance(db: Session = Depends(get_db)) -> List[Dict[str, Any]]:
    """Retrieve section-by-section health, congestion factor, and maintenance efficiency scorecard."""
    sections = db.query(RailwaySection).all()
    results = []

    for sec in sections:
        tasks_count = db.query(MaintenanceTask).filter(MaintenanceTask.section_id == sec.id).count()
        blocks_count = db.query(MaintenanceBlock).filter(MaintenanceBlock.section_id == sec.id).count()
        assets_count = db.query(Asset).filter(Asset.section_id == sec.id).count()

        # Efficiency index calculation
        health_score = 92.0 if sec.status == "NORMAL" else (84.0 if sec.status == "RESTRICTED" else 76.0)
        congestion_index = round(1.2 + (tasks_count * 0.08), 2)

        results.append({
            "section_id": sec.id,
            "section_name": sec.name,
            "track_type": sec.track_type,
            "length_km": sec.length_km,
            "speed_limit_kmh": sec.speed_limit_kmh,
            "status": sec.status,
            "assets_monitored": assets_count,
            "active_tasks": tasks_count,
            "scheduled_blocks": blocks_count,
            "section_health_pct": health_score,
            "congestion_index": congestion_index,
            "punctuality_risk": "LOW" if congestion_index < 1.6 else ("MEDIUM" if congestion_index < 2.0 else "HIGH"),
        })

    return results
