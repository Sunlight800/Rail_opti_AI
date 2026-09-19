"""What-If Scenario Simulator API endpoints for RAILOPT AI."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
from rail_opti.database.session import get_db
from rail_opti.engines.what_if_simulator import what_if_simulator

router = APIRouter(prefix="/what-if", tags=["What-If Simulator"])


class SimulationRequest(BaseModel):
    train_delay_min: int = 45
    target_train_id: Optional[str] = "TRN-SZ314"
    traffic_density: str = "NORMAL"
    duration_extension_pct: int = 0
    machine_breakdown: bool = False
    plan_version_id: str = "PLN-V1"


@router.post("/simulate")
def run_simulation(
    req: SimulationRequest,
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Execute dynamic what-if simulation and return side-by-side KPI comparison & ripple cascade."""
    return what_if_simulator.run_simulation(
        db,
        train_delay_min=req.train_delay_min,
        target_train_id=req.target_train_id,
        traffic_density=req.traffic_density,
        duration_extension_pct=req.duration_extension_pct,
        machine_breakdown=req.machine_breakdown,
        plan_version_id=req.plan_version_id,
    )


@router.get("/scenarios")
def list_scenario_templates() -> List[Dict[str, Any]]:
    """Retrieve pre-built scenario templates for quick what-if evaluations."""
    return what_if_simulator.SCENARIO_TEMPLATES
