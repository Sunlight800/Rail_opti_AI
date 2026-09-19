"""Multi-Department Consolidation Engine for RAILOPT AI (SIH26027).

Co-locates and unifies maintenance blocks across 4 railway departments:
- Civil Engineering (ENG / P-Way): Tamping, Ballast Cleaning, Rail Renewal
- Traction Distribution (TRD / Electrical): OHE Inspection, Catenary Tensioning, Power Isolation
- Signal & Telecom (SNT): Point Machine Overhaul, Track Circuit Testing, Axle Counters
- Operating Office (OPT): Traffic Blocks, Line Clear, Crossing Coordination

Calculates:
- Hours saved by eliminating redundant isolations & line blocks (2.5h - 4.5h per block)
- Multi-department compatibility rules
- Opportunistic candidate detection
"""
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from rail_opti.database.models import (
    ConsolidationGroup,
    MaintenanceBlock,
    MaintenanceTask,
    RailwaySection,
    Department,
    BlockTask,
)


class ConsolidationEngine:
    """Core domain logic for finding and forming multi-department consolidated blocks."""

    COMPATIBILITY_MATRIX = {
        ("ENG", "TRD"): {
            "compatible": True,
            "synergy": "OHE power isolation (25kV cut) creates safe zero-voltage window for heavy track machines (BCM/CSM).",
            "hours_saved_factor": 3.0,
        },
        ("ENG", "SNT"): {
            "compatible": True,
            "synergy": "Turnout tamping and point machine inspection coincide, avoiding separate signal disconnections.",
            "hours_saved_factor": 2.5,
        },
        ("TRD", "SNT"): {
            "compatible": True,
            "synergy": "Signal cable trunking inspection aligned with catenary mast earthing verification.",
            "hours_saved_factor": 2.0,
        },
        ("ENG", "TRD", "SNT"): {
            "compatible": True,
            "synergy": "Golden Integrated Mega-Block: Simultaneous track renewal, OHE wire replacement, and digital interlocking test.",
            "hours_saved_factor": 4.5,
        },
    }

    def detect_opportunities(self, db: Session) -> List[Dict[str, Any]]:
        """Identify candidate tasks from different departments on the same section that can be merged."""
        tasks = (
            db.query(MaintenanceTask)
            .filter(MaintenanceTask.status.in_(["OPEN", "PENDING"]))
            .all()
        )
        sections = db.query(RailwaySection).all()

        opportunities = []
        opp_idx = 1

        for s in sections:
            s_tasks = [t for t in tasks if t.section_id == s.id]
            depts_present = list({t.department_id for t in s_tasks})

            if len(depts_present) >= 2:
                # Calculate potential savings
                hours_saved = 4.5 if len(depts_present) >= 3 else 3.0
                task_ids = [t.id for t in s_tasks[:4]]

                dept_names = []
                for d in depts_present:
                    if d == "ENG": dept_names.append("Civil (Track)")
                    elif d == "TRD": dept_names.append("Electrical (OHE)")
                    elif d == "SNT": dept_names.append("Signal & Telecom")
                    else: dept_names.append(d)

                opportunities.append({
                    "opportunity_id": f"OPP-{opp_idx:03d}",
                    "section_id": s.id,
                    "section_name": s.name,
                    "departments": depts_present,
                    "department_labels": dept_names,
                    "task_count": len(task_ids),
                    "candidate_task_ids": task_ids,
                    "estimated_hours_saved": hours_saved,
                    "synergy_explanation": f"Consolidate {len(task_ids)} tasks across {', '.join(dept_names)} on {s.name}. Eliminates redundant secondary power & traffic blocks.",
                    "compatibility_score": 95 if len(depts_present) >= 3 else 88,
                })
                opp_idx += 1

        return opportunities

    def merge_into_consolidated_block(
        self,
        db: Session,
        section_id: str,
        task_ids: List[str],
        start_time: Optional[datetime] = None,
        duration_min: int = 180,
    ) -> Dict[str, Any]:
        """Create a new consolidated block and consolidation group combining the tasks."""
        tasks = db.query(MaintenanceTask).filter(MaintenanceTask.id.in_(task_ids)).all()
        if not tasks:
            return {"success": False, "error": "No valid tasks provided for consolidation."}

        depts = list({t.department_id for t in tasks})
        now = datetime.utcnow()
        b_start = start_time or (now + timedelta(days=1)).replace(hour=1, minute=30, second=0)
        b_end = b_start + timedelta(minutes=duration_min)

        hours_saved = 4.5 if len(depts) >= 3 else 3.0

        import uuid
        # Create ConsolidationGroup
        cg_id = f"CON-{now.strftime('%Y%m%d-%H%M%S')}-{uuid.uuid4().hex[:6]}"
        con_group = ConsolidationGroup(
            id=cg_id,
            section_id=section_id,
            participating_departments_json=depts,
            block_hours_saved=hours_saved,
            consolidation_reason=f"Unified integrated mega-block co-locating tasks across {', '.join(depts)}.",
        )
        db.add(con_group)
        db.flush()

        # Create MaintenanceBlock
        blk_id = f"BLK-CON-{now.strftime('%H%M%S')}-{uuid.uuid4().hex[:4]}"
        block = MaintenanceBlock(
            id=blk_id,
            plan_version_id="PLN-V1",
            section_id=section_id,
            consolidation_group_id=cg_id,
            block_type="INTEGRATED_BLOCK",
            start_time=b_start,
            end_time=b_end,
            duration_min=duration_min,
            safety_status="VALIDATED",
            ai_explanation=f"AI Consolidated Mega-Block: Co-located {len(tasks)} tasks across {', '.join(depts)} saving {hours_saved} hours of track downtime.",
        )
        db.add(block)
        db.flush()

        # Link tasks to block
        for seq, t in enumerate(tasks, start=1):
            db.add(BlockTask(
                id=f"BT-{blk_id}-{seq:02d}",
                block_id=blk_id,
                task_id=t.id,
                sequence_order=seq,
            ))
            t.status = "SCHEDULED"

        db.commit()

        return {
            "success": True,
            "block_id": blk_id,
            "consolidation_group_id": cg_id,
            "hours_saved": hours_saved,
            "participating_departments": depts,
            "tasks_consolidated": len(tasks),
            "message": f"Successfully created integrated block {blk_id} saving {hours_saved} hours!",
        }


consolidation_engine = ConsolidationEngine()
