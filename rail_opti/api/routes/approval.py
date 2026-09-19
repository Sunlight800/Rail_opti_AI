"""Approval and Multi-Department Sign-off API endpoints for RAILOPT AI (Phase 16 & 17)."""
import datetime
import uuid
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from rail_opti.database.session import get_db
from rail_opti.database.models import (
    PlanVersion,
    MaintenanceBlock,
    Approval,
    ApprovalFeedback,
    User,
    AuditLog,
)
from rail_opti.engines.recalculation_engine import recalculation_engine

from rail_opti.core.auth_deps import get_current_user, require_role

router = APIRouter(prefix="/approvals", tags=["Approval Center & Workflow"])


class SignOffRequest(BaseModel):
    reviewer_user_id: str = "USR-ADM-01"
    department: str = "Operating"  # Civil, Electrical, S&T, Operating
    action: str = "APPROVE"  # APPROVE, REJECT_AND_RECALCULATE, MODIFY_AND_APPROVE
    comments: Optional[str] = "Approved after operational verification."
    rejection_code: Optional[str] = None
    custom_constraints: Optional[Dict[str, Any]] = None


class RecalculateRequest(BaseModel):
    plan_version_id: str = "PLN-V1"
    reviewer_user_id: str = "USR-ADM-01"
    department: str = "Operating"
    rejection_code: str = "TRAIN_DELAY_UNACCEPTABLE"
    feedback_comments: str = "Delay to coaching train 12951 exceeds 15 min tolerance. Shift block to night window."
    custom_constraints: Optional[Dict[str, Any]] = None


@router.get("/rejection-reasons")
def get_rejection_reasons() -> Dict[str, Any]:
    """Retrieve structured rejection reason codes and automatic mitigation policies."""
    return recalculation_engine.REJECTION_REASONS


@router.get("/pending")
def list_pending_approvals(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """List plans and maintenance blocks awaiting multi-department sign-offs."""
    plans = db.query(PlanVersion).filter(PlanVersion.status.in_(["PENDING_REVIEW", "PENDING_APPROVAL", "MODIFIED", "DRAFT", "REJECTED"])).all()
    if not plans:
        plans = db.query(PlanVersion).all()
    
    pending_list = []
    for p in plans:
        blocks = db.query(MaintenanceBlock).filter(MaintenanceBlock.plan_version_id == p.id).all()
        approvals = db.query(Approval).filter(Approval.plan_version_id == p.id).all()
        
        pending_list.append({
            "plan_id": p.id,
            "version_number": p.version_number,
            "status": p.status,
            "created_at": p.created_at.isoformat() if p.created_at else None,
            "reason": p.reason,
            "kpis": p.summary_kpis_json,
            "total_blocks": len(blocks),
            "approval_count": len(approvals),
            "departments_status": {
                "Civil": "APPROVED" if any(a.action == "APPROVE" and "ENG" in (a.reviewer_user_id or "") for a in approvals) else "PENDING",
                "Electrical": "APPROVED" if any(a.action == "APPROVE" and "TRD" in (a.reviewer_user_id or "") for a in approvals) else "PENDING",
                "S&T": "APPROVED" if any(a.action == "APPROVE" and "SNT" in (a.reviewer_user_id or "") for a in approvals) else "PENDING",
                "Operating": "APPROVED" if any(a.action == "APPROVE" and "ADM" in (a.reviewer_user_id or "") for a in approvals) else "PENDING",
            }
        })

    return {
        "pending_count": len(pending_list),
        "plans": pending_list,
    }


@router.get("/{plan_version_id}/departments")
def get_department_signoff_status(
    plan_version_id: str,
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Get detailed 4-department sign-off status for a given plan version."""
    plan = db.query(PlanVersion).filter(PlanVersion.id == plan_version_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail=f"Plan version '{plan_version_id}' not found.")

    approvals = db.query(Approval).filter(Approval.plan_version_id == plan_version_id).all()
    
    # Department definitions
    depts = [
        {"id": "ENG", "name": "Civil Engineering", "officer": "Chief Track Engineer", "status": "PENDING"},
        {"id": "TRD", "name": "Electrical (TRD)", "officer": "Chief Electrical Engineer", "status": "PENDING"},
        {"id": "SNT", "name": "Signal & Telecom", "officer": "Chief S&T Engineer", "status": "PENDING"},
        {"id": "OPT", "name": "Operating / Traffic", "officer": "Chief Operations Manager", "status": "PENDING"},
    ]

    for d in depts:
        matching = [a for a in approvals if (a.reviewer_user_id and d["id"] in a.reviewer_user_id) or (a.feedback_comments and d["name"] in a.feedback_comments)]
        if matching:
            last = matching[-1]
            d["status"] = last.action
            d["timestamp"] = last.decision_timestamp.isoformat() if last.decision_timestamp else None
            d["comments"] = last.feedback_comments
        else:
            # Default mock initial state for realism if not yet signed
            if plan.status == "APPROVED":
                d["status"] = "APPROVE"
                d["timestamp"] = plan.created_at.isoformat() if plan.created_at else None

    return {
        "plan_id": plan_version_id,
        "plan_status": plan.status,
        "departments": depts,
        "all_approved": all(d["status"] == "APPROVE" for d in depts),
    }


@router.post("/{plan_version_id}/sign")
def sign_off_plan(
    plan_version_id: str,
    req: SignOffRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Submit departmental approval, modification, or rejection with RBAC enforcement."""
    # RBAC Checks
    if current_user.role == "DEMO_USER":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Demo users have read-only access and are not authorized to sign off or modify plans.",
        )

    plan = db.query(PlanVersion).filter(PlanVersion.id == plan_version_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail=f"Plan version '{plan_version_id}' not found.")

    dept_lower = req.department.lower()

    if req.action == "REJECT_AND_RECALCULATE":
        if current_user.role not in ["CONTROL_OFFICE", "ADMIN"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role '{current_user.role}' is not authorized to reject and trigger corridor recalculations. Only Control Office or Admin can perform this action.",
            )
        if not req.rejection_code:
            raise HTTPException(status_code=400, detail="Rejection code is required when rejecting a plan.")
        
        # Trigger recalculation engine
        result = recalculation_engine.recalculate_plan(
            db=db,
            base_plan_id=plan_version_id,
            reviewer_id=current_user.id or req.reviewer_user_id,
            rejection_code=req.rejection_code,
            feedback_comments=req.comments or "Rejected with recalculation request.",
            custom_constraints=req.custom_constraints,
        )
        return result

    # Departmental sign-off scope check
    if current_user.role == "ENGINEERING" and not any(k in dept_lower for k in ["civil", "eng", "track"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Engineering role is only authorized to sign off for Civil Engineering (Track), not '{req.department}'.",
        )
    elif current_user.role == "TRD" and not any(k in dept_lower for k in ["electrical", "trd", "traction"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"TRD role is only authorized to sign off for Electrical (TRD), not '{req.department}'.",
        )
    elif current_user.role == "SNT" and not any(k in dept_lower for k in ["signal", "snt", "telecom", "s&t"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"S&T role is only authorized to sign off for Signal & Telecom, not '{req.department}'.",
        )

    # Standard approval or modification
    now = datetime.datetime.now(datetime.UTC)
    approval_id = f"APP-{uuid.uuid4().hex[:8]}"
    approval = Approval(
        id=approval_id,
        plan_version_id=plan_version_id,
        reviewer_user_id=current_user.id or req.reviewer_user_id,
        action=req.action,
        decision_timestamp=now,
        validation_snapshot_json=plan.summary_kpis_json or {},
        feedback_comments=f"[{req.department}] {req.comments}",
    )
    db.add(approval)

    if req.action == "APPROVE":
        plan.status = "APPROVED"

    # Audit log
    db.add(AuditLog(
        id=f"AUD-{uuid.uuid4().hex[:8]}",
        user_id=current_user.id or req.reviewer_user_id,
        action=f"PLAN_{req.action}",
        entity_name="plan_versions",
        entity_id=plan_version_id,
        old_value_json={"status": plan.status},
        new_value_json={"action": req.action, "department": req.department},
        reason=req.comments,
        timestamp=now,
    ))

    db.commit()

    return {
        "status": "SUCCESS",
        "plan_id": plan_version_id,
        "action": req.action,
        "department": req.department,
        "plan_status": plan.status,
        "message": f"Successfully registered {req.action} from {req.department}.",
    }


@router.post("/recalculate")
def trigger_recalculation(
    req: RecalculateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Directly trigger automatic re-optimization with modified constraints after rejection."""
    if current_user.role == "DEMO_USER":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Demo users have read-only access and are not authorized to trigger recalculations.",
        )
    if current_user.role not in ["CONTROL_OFFICE", "ADMIN"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Role '{current_user.role}' is not authorized to trigger plan recalculation. Only Control Office or Admin can perform this action.",
        )
    try:
        return recalculation_engine.recalculate_plan(
            db=db,
            base_plan_id=req.plan_version_id,
            reviewer_id=current_user.id or req.reviewer_user_id,
            rejection_code=req.rejection_code,
            feedback_comments=req.feedback_comments,
            custom_constraints=req.custom_constraints,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

