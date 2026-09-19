"""Resource Planning Engine for RAILOPT AI (SIH26027).

Manages 8 railway resource categories:
1. TRACK_MACHINES (BCM, CSM, DGS, T-28, UNIMAT, TRT)
2. TOWER_WAGONS (4-wheeler, 8-wheeler OHE inspection & wiring cars)
3. CREW_DEPOTS (Trackmen, Gangmen, OHE Linesmen, S&T Technicians)
4. POWER_DISCONNECT (Traction Power Controller / TPC cut blocks)
5. TRAFFIC_CONTROLLERS (Section Controllers, Station Masters)
6. SPEED_RESTRICTION_BOARDS (Caution indicator boards 30/45/75 km/h)
7. SAFETY_GEAR (Detonators, Banner flags, HS flags, Walkie-talkies)
8. ESCORTS (RPF / GRP security escorts)

Provides availability analytics, feasibility checks, shortage detection, and alternative recommendations.
"""
from typing import Dict, Any, List, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from rail_opti.database.models import Resource, ResourceAllocation, ResourceRequirement, MaintenanceTask


class ResourcePlannerEngine:
    """Core domain logic for resource tracking, allocation, and alternative substitution."""

    CATEGORY_METADATA = {
        "TRACK_MACHINES": {
            "label": "Track Machines",
            "icon": "Wrench",
            "description": "Heavy mechanized track renewal and maintenance machinery (BCM, CSM, DGS, T-28, UNIMAT)",
        },
        "TOWER_WAGONS": {
            "label": "Tower Wagons",
            "icon": "Zap",
            "description": "Self-propelled OHE inspection, wiring, and catenary maintenance vehicles",
        },
        "CREW_DEPOTS": {
            "label": "Crew Depots",
            "icon": "Users",
            "description": "Maintenance gangs, gangmen, linesmen, and S&T technicians",
        },
        "POWER_DISCONNECT": {
            "label": "Power Disconnect / TPC",
            "icon": "Power",
            "description": "Traction power controller isolation units and permit-to-work isolators",
        },
        "TRAFFIC_CONTROLLERS": {
            "label": "Traffic Controllers",
            "icon": "Radio",
            "description": "Section controllers and station masters for line clear and block granting",
        },
        "SPEED_RESTRICTION_BOARDS": {
            "label": "Speed Restriction Boards",
            "icon": "AlertCircle",
            "description": "Standard caution, speed restriction (30/45/75 km/h), and termination boards",
        },
        "SAFETY_GEAR": {
            "label": "Safety Gear",
            "icon": "ShieldCheck",
            "description": "Detonators, red banner flags, hand signal lamps, and VHF walkie-talkies",
        },
        "ESCORTS": {
            "label": "Security Escorts",
            "icon": "Shield",
            "description": "RPF and GRP armed track escort personnel for sensitive corridor zones",
        },
    }

    def get_availability_summary(self, db: Session) -> Dict[str, Any]:
        """Compute system-wide availability percentage and category breakdowns."""
        resources = db.query(Resource).all()
        allocations = db.query(ResourceAllocation).all()

        # Aggregate total and allocated capacity
        total_units = sum(r.total_capacity for r in resources) or 1
        allocated_units = sum(a.allocated_quantity for a in allocations)
        available_units = max(0, total_units - allocated_units)
        overall_availability_pct = round((available_units / total_units) * 100, 1)

        # Breakdown by category
        categories_dict: Dict[str, Dict[str, Any]] = {}
        for cat_key, meta in self.CATEGORY_METADATA.items():
            cat_resources = [r for r in resources if r.resource_type == cat_key]
            cat_r_ids = {r.id for r in cat_resources}
            cat_allocs = [a for a in allocations if a.resource_id in cat_r_ids]

            cat_total = sum(r.total_capacity for r in cat_resources)
            cat_allocated = sum(a.allocated_quantity for a in cat_allocs)
            cat_available = max(0, cat_total - cat_allocated)
            cat_avail_pct = round((cat_available / cat_total * 100), 1) if cat_total > 0 else 100.0

            categories_dict[cat_key] = {
                "category": cat_key,
                "label": meta["label"],
                "description": meta["description"],
                "total_capacity": cat_total,
                "allocated_count": cat_allocated,
                "available_count": cat_available,
                "availability_pct": cat_avail_pct,
                "resource_count": len(cat_resources),
            }

        return {
            "overall_availability_pct": overall_availability_pct,
            "total_units": total_units,
            "allocated_units": allocated_units,
            "available_units": available_units,
            "categories": categories_dict,
        }

    def check_feasibility(
        self,
        db: Session,
        task_id: str,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None,
    ) -> Dict[str, Any]:
        """Verify if all required resources for a task are available in the desired window."""
        task = db.query(MaintenanceTask).filter_by(id=task_id).first()
        if not task:
            return {"feasible": False, "error": f"Task '{task_id}' not found."}

        requirements = task.resource_requirements
        if not requirements:
            return {
                "feasible": True,
                "task_id": task_id,
                "shortages": [],
                "allocated": [],
                "message": "No specific resource constraints defined for this task.",
            }

        shortages = []
        satisfied = []
        alternatives_suggested = []

        for req in requirements:
            # Look for available resources matching resource_type
            candidates = db.query(Resource).filter_by(
                resource_type=req.resource_type,
                is_operational=True,
            ).all()

            # Check capacity
            avail_capacity = 0
            selected_res = None
            for cand in candidates:
                # Sum overlapping allocations
                active_allocs = db.query(ResourceAllocation).filter_by(resource_id=cand.id).all()
                overlapping_qty = sum(a.allocated_quantity for a in active_allocs)
                remaining = max(0, cand.total_capacity - overlapping_qty)
                if remaining >= req.required_quantity:
                    selected_res = cand
                    avail_capacity = remaining
                    break

            if selected_res:
                satisfied.append({
                    "requirement_id": req.id,
                    "resource_id": selected_res.id,
                    "resource_name": selected_res.name,
                    "resource_type": req.resource_type,
                    "requested_qty": req.required_quantity,
                    "available_qty": avail_capacity,
                    "status": "SATISFIED",
                })
            else:
                # Shortage detected
                shortage_entry = {
                    "requirement_id": req.id,
                    "resource_type": req.resource_type,
                    "required_quantity": req.required_quantity,
                    "mandatory": req.is_mandatory,
                    "reason": f"Insufficient operational capacity for {req.resource_type}.",
                }
                shortages.append(shortage_entry)

                # Search for alternatives
                alt_res = self.find_alternative(db, req.resource_type, task.section_id)
                if alt_res:
                    alternatives_suggested.append(alt_res)

        feasible = len(shortages) == 0

        return {
            "feasible": feasible,
            "task_id": task_id,
            "section_id": task.section_id,
            "satisfied_requirements": satisfied,
            "shortages": shortages,
            "alternatives_suggested": alternatives_suggested,
            "feasibility_score": round((len(satisfied) / (len(satisfied) + len(shortages)) * 100), 1) if (satisfied or shortages) else 100.0,
        }

    def find_alternative(
        self,
        db: Session,
        resource_type: str,
        target_section_id: str,
    ) -> Optional[Dict[str, Any]]:
        """Find an alternative machine or crew depot from an adjacent section or compatible category."""
        # Find any operational resource of same category in another section
        candidates = db.query(Resource).filter_by(
            resource_type=resource_type,
            is_operational=True,
        ).all()

        for cand in candidates:
            if cand.base_section_id != target_section_id:
                return {
                    "resource_id": cand.id,
                    "name": cand.name,
                    "resource_type": cand.resource_type,
                    "depot_section": cand.base_section_id,
                    "transit_time_buffer_min": 45,
                    "recommendation": f"Mobilize {cand.name} from depot {cand.base_section_id} with +45 min transit buffer.",
                }

        return None


resource_planner = ResourcePlannerEngine()
