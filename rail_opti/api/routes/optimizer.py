"""Optimization Engine API endpoints for RAILOPT AI."""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
from rail_opti.database.session import get_db
from rail_opti.database.models import OptimizationRun
from rail_opti.optimizer.cpsat_solver import cpsat_solver

router = APIRouter(prefix="/optimizer", tags=["CP-SAT Optimizer"])


class OptimizationSolveRequest(BaseModel):
    horizon_days: int = 7
    priority_weight: float = 10.0
    consolidation_bonus: float = 5.0
    disruption_penalty: float = 20.0
    allow_rerouting: bool = True
    time_limit_seconds: float = 5.0


@router.post("/solve")
def run_optimization(
    req: OptimizationSolveRequest,
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Execute Google OR-Tools CP-SAT solver with customizable multi-objective weights."""
    return cpsat_solver.solve_plan(
        db=db,
        horizon_days=req.horizon_days,
        priority_weight=req.priority_weight,
        consolidation_bonus=req.consolidation_bonus,
        disruption_penalty=req.disruption_penalty,
        allow_rerouting=req.allow_rerouting,
        time_limit_seconds=req.time_limit_seconds,
    )


@router.get("/runs")
def list_optimization_runs(db: Session = Depends(get_db)) -> List[Dict[str, Any]]:
    """List historical optimization solver runs with KPI metrics."""
    runs = db.query(OptimizationRun).order_by(OptimizationRun.created_at.desc()).all()
    result = []
    for r in runs:
        result.append({
            "id": r.id,
            "horizon_type": r.horizon_type,
            "solver_status": r.solver_status,
            "execution_time_ms": r.execution_time_ms,
            "objective_value": r.objective_value,
            "parameters": r.parameters_json,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        })
    return result


@router.get("/runs/{run_id}")
def get_optimization_run(run_id: str, db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Retrieve detailed execution telemetry for a specific optimization run."""
    r = db.query(OptimizationRun).filter_by(id=run_id).first()
    if not r:
        raise HTTPException(status_code=404, detail=f"Optimization run '{run_id}' not found.")

    return {
        "id": r.id,
        "horizon_type": r.horizon_type,
        "solver_status": r.solver_status,
        "execution_time_ms": r.execution_time_ms,
        "objective_value": r.objective_value,
        "parameters": r.parameters_json,
        "created_at": r.created_at.isoformat() if r.created_at else None,
    }
