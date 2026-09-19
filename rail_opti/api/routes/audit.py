"""Audit Trail and Governance API for RAILOPT AI (Phase 20)."""
import datetime
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from rail_opti.database.session import get_db
from rail_opti.database.models import AuditLog, User
from rail_opti.core.auth_deps import require_role

router = APIRouter(prefix="/audit", tags=["Audit Trail & Security"])


@router.get("")
@router.get("/logs")
def list_audit_logs(
    action: Optional[str] = Query(None, description="Filter by action type"),
    user_id: Optional[str] = Query(None, description="Filter by user ID"),
    limit: int = Query(50, ge=1, le=200),
    current_user: User = Depends(require_role("ADMIN")),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Retrieve immutable audit trail records with user details, previous/new states, and timestamps."""
    query = db.query(AuditLog).order_by(AuditLog.timestamp.desc())

    if action:
        query = query.filter(AuditLog.action == action)
    if user_id:
        query = query.filter(AuditLog.user_id == user_id)

    logs = query.limit(limit).all()

    results = []
    for log in logs:
        user = db.query(User).filter(User.id == log.user_id).first() if log.user_id else None
        results.append({
            "id": log.id,
            "timestamp": log.timestamp.isoformat() if log.timestamp else None,
            "user_id": log.user_id,
            "user_name": user.full_name if user else "Automated System",
            "user_role": user.role if user else "SYSTEM",
            "action": log.action,
            "entity_name": log.entity_name,
            "entity_id": log.entity_id,
            "old_value": log.old_value_json,
            "new_value": log.new_value_json,
            "reason": log.reason,
        })

    return {
        "total_count": len(results),
        "logs": results,
    }


@router.get("/actions")
def list_audit_actions(
    current_user: User = Depends(require_role("ADMIN")),
    db: Session = Depends(get_db),
) -> List[str]:
    """Retrieve distinct audit action types."""
    actions = db.query(AuditLog.action).distinct().all()
    return [a[0] for a in actions if a[0]]
