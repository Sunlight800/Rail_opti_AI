"""SQLAlchemy 2.0 declarative database models for RAILOPT AI (SIH26027)."""
import datetime
from sqlalchemy import (
    Column,
    String,
    Integer,
    Float,
    Boolean,
    DateTime,
    Date,
    Text,
    JSON,
    ForeignKey,
)
from sqlalchemy.orm import relationship
from rail_opti.database.session import Base


# ---------------------------------------------------------------------------
# 1. Organization & Users
# ---------------------------------------------------------------------------

class Department(Base):
    __tablename__ = "departments"

    id = Column(String(32), primary_key=True)  # e.g., 'ENG', 'TRD', 'SNT', 'OPT'
    name = Column(String(128), nullable=False)
    color_code = Column(String(16), nullable=False, default="#3b82f6")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    users = relationship("User", back_populates="department")
    tasks = relationship("MaintenanceTask", back_populates="department")
    assets = relationship("Asset", back_populates="department")
    resources = relationship("Resource", back_populates="department")


class User(Base):
    __tablename__ = "users"

    id = Column(String(64), primary_key=True)
    username = Column(String(64), unique=True, nullable=False, index=True)
    email = Column(String(128), unique=True, nullable=False)
    hashed_password = Column(String(256), nullable=False)
    full_name = Column(String(128), nullable=False)
    department_id = Column(String(32), ForeignKey("departments.id"), nullable=True)
    role = Column(String(32), nullable=False)  # CONTROL_OFFICE, ENGINEERING, TRD, SNT, ADMIN, DEMO_USER
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    department = relationship("Department", back_populates="users")
    audit_logs = relationship("AuditLog", back_populates="user")
    notifications = relationship("Notification", back_populates="user")


# ---------------------------------------------------------------------------
# 2. Infrastructure & Network Topology
# ---------------------------------------------------------------------------

class Corridor(Base):
    __tablename__ = "corridors"

    id = Column(String(32), primary_key=True)  # e.g., 'COR-DEL-BOM'
    name = Column(String(128), nullable=False)
    code = Column(String(16), unique=True, nullable=False)
    total_length_km = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    sections = relationship("RailwaySection", back_populates="corridor")


class RailwaySection(Base):
    __tablename__ = "railway_sections"

    id = Column(String(64), primary_key=True)  # e.g., 'SEC-NDLS-ALD'
    corridor_id = Column(String(32), ForeignKey("corridors.id"), nullable=False)
    name = Column(String(128), nullable=False)
    track_type = Column(String(32), nullable=False, default="DOUBLE_UP")  # SINGLE, DOUBLE_UP, DOUBLE_DOWN, MULTIPLE
    speed_limit_kmh = Column(Integer, nullable=False, default=130)
    length_km = Column(Float, nullable=False)
    start_km = Column(Float, nullable=False)
    end_km = Column(Float, nullable=False)
    status = Column(String(32), default="NORMAL")  # NORMAL, RESTRICTED, BLOCKED, MAINTENANCE
    coordinates_json = Column(JSON, nullable=True)  # Array of [lat, lng] for MapLibre/Leaflet

    corridor = relationship("Corridor", back_populates="sections")
    assets = relationship("Asset", back_populates="section")
    tasks = relationship("MaintenanceTask", back_populates="section")
    train_schedules = relationship("TrainSchedule", back_populates="section")
    blocks = relationship("MaintenanceBlock", back_populates="section")


class Asset(Base):
    __tablename__ = "assets"

    id = Column(String(64), primary_key=True)  # e.g., 'AST-TRK-7A'
    section_id = Column(String(64), ForeignKey("railway_sections.id"), nullable=False)
    department_id = Column(String(32), ForeignKey("departments.id"), nullable=False)
    asset_type = Column(String(64), nullable=False)  # TRACK, TURNOUT, OHE_MAST, SIGNAL_POST, POINT_MACHINE
    name = Column(String(128), nullable=False)
    installation_date = Column(Date, nullable=False)
    criticality = Column(String(16), nullable=False, default="MEDIUM")  # LOW, MEDIUM, HIGH, CRITICAL
    cumulative_gmt = Column(Float, default=0.0)  # Gross Million Tonnes traffic
    last_maintenance_date = Column(Date, nullable=True)

    section = relationship("RailwaySection", back_populates="assets")
    department = relationship("Department", back_populates="assets")
    defects = relationship("Defect", back_populates="asset")
    health_records = relationship("AssetHealth", back_populates="asset")
    tasks = relationship("MaintenanceTask", back_populates="asset")


class AssetHealth(Base):
    __tablename__ = "asset_health"

    id = Column(String(64), primary_key=True)
    asset_id = Column(String(64), ForeignKey("assets.id"), nullable=False)
    health_score = Column(Float, nullable=False)  # 0.0 - 100.0%
    failure_probability = Column(Float, nullable=False)  # 0.0 - 1.0
    defect_count = Column(Integer, default=0)
    overdue_days = Column(Integer, default=0)
    urgency_level = Column(String(16), nullable=False)  # ROUTINE, URGENT, IMMEDIATE
    evidence_summary = Column(Text, nullable=True)
    assessed_at = Column(DateTime, default=datetime.datetime.utcnow)

    asset = relationship("Asset", back_populates="health_records")


class Defect(Base):
    __tablename__ = "defects"

    id = Column(String(64), primary_key=True)  # e.g., 'DEF-2025-0102'
    asset_id = Column(String(64), ForeignKey("assets.id"), nullable=False)
    defect_type = Column(String(64), nullable=False)  # USFD_FLAW, RAIL_FRACTURE, OHE_SAGGING, SIGNAL_FAILURE
    severity = Column(String(16), nullable=False)  # LOW, MEDIUM, HIGH, CRITICAL
    detected_date = Column(Date, nullable=False)
    status = Column(String(32), default="OPEN")  # OPEN, IN_PROGRESS, RESOLVED, DEFERRED
    description = Column(Text, nullable=True)

    asset = relationship("Asset", back_populates="defects")
    tasks = relationship("MaintenanceTask", back_populates="defect")


# ---------------------------------------------------------------------------
# 3. Maintenance Tasks, Priority & Risk
# ---------------------------------------------------------------------------

class MaintenanceTask(Base):
    __tablename__ = "maintenance_tasks"

    id = Column(String(64), primary_key=True)  # e.g., 'MT-001'
    asset_id = Column(String(64), ForeignKey("assets.id"), nullable=False)
    section_id = Column(String(64), ForeignKey("railway_sections.id"), nullable=False)
    department_id = Column(String(32), ForeignKey("departments.id"), nullable=False)
    task_type = Column(String(64), nullable=False)  # TAMPING, RAIL_RENEWAL, OHE_INSPECTION, SIGNAL_TESTING
    defect_id = Column(String(64), ForeignKey("defects.id"), nullable=True)
    severity = Column(String(16), nullable=False, default="MEDIUM")
    requested_date = Column(Date, nullable=False)
    due_date = Column(Date, nullable=False)
    estimated_duration_min = Column(Integer, nullable=False, default=180)
    preferred_window_start = Column(DateTime, nullable=True)
    preferred_window_end = Column(DateTime, nullable=True)
    mandatory_window_start = Column(DateTime, nullable=True)
    mandatory_window_end = Column(DateTime, nullable=True)
    safety_critical_flag = Column(Boolean, default=False)
    status = Column(String(32), default="PENDING")  # PENDING, AT_RISK, SCHEDULED, IN_PROGRESS, COMPLETED, DEFERRED, REJECTED, BLOCKED
    dependencies_json = Column(JSON, nullable=True)  # array of prerequisite task IDs
    notes = Column(Text, nullable=True)

    asset = relationship("Asset", back_populates="tasks")
    section = relationship("RailwaySection", back_populates="tasks")
    department = relationship("Department", back_populates="tasks")
    defect = relationship("Defect", back_populates="tasks")
    priority_scores = relationship("PriorityScore", back_populates="task", cascade="all, delete-orphan")
    risk_assessments = relationship("RiskAssessment", back_populates="task", cascade="all, delete-orphan")
    resource_requirements = relationship("ResourceRequirement", back_populates="task", cascade="all, delete-orphan")
    block_associations = relationship("BlockTask", back_populates="task")


class PriorityScore(Base):
    __tablename__ = "priority_scores"

    id = Column(String(64), primary_key=True)
    task_id = Column(String(64), ForeignKey("maintenance_tasks.id"), nullable=False)
    safety_risk = Column(Float, nullable=False)  # 0-100 (Weight: 0.30)
    failure_probability = Column(Float, nullable=False)  # 0-100 (Weight: 0.20)
    asset_criticality = Column(Float, nullable=False)  # 0-100 (Weight: 0.15)
    maintenance_urgency = Column(Float, nullable=False)  # 0-100 (Weight: 0.15)
    traffic_impact = Column(Float, nullable=False)  # 0-100 (Weight: 0.10)
    defect_severity = Column(Float, nullable=False)  # 0-100 (Weight: 0.10)
    total_priority_score = Column(Float, nullable=False)  # 0-100 normalized
    priority_category = Column(String(16), nullable=False)  # CRITICAL, HIGH, MEDIUM, LOW
    ai_rationale = Column(Text, nullable=False)
    calculated_at = Column(DateTime, default=datetime.datetime.utcnow)

    task = relationship("MaintenanceTask", back_populates="priority_scores")


class RiskAssessment(Base):
    __tablename__ = "risk_assessments"

    id = Column(String(64), primary_key=True)
    task_id = Column(String(64), ForeignKey("maintenance_tasks.id"), nullable=False)
    safety_risk_level = Column(String(16), nullable=False)  # LOW, MEDIUM, HIGH, CRITICAL
    failure_probability_val = Column(Float, nullable=False)  # 0.0 - 1.0
    operational_impact_level = Column(String(16), nullable=False)  # LOW, MEDIUM, HIGH, CRITICAL
    risk_category = Column(String(16), nullable=False)  # LOW, MEDIUM, HIGH, CRITICAL
    confidence_score = Column(Float, nullable=False, default=0.92)
    evidence_json = Column(JSON, nullable=True)
    explanation = Column(Text, nullable=False)

    task = relationship("MaintenanceTask", back_populates="risk_assessments")


# ---------------------------------------------------------------------------
# 4. Resources & Allocations
# ---------------------------------------------------------------------------

class Resource(Base):
    __tablename__ = "resources"

    id = Column(String(64), primary_key=True)  # e.g., 'RES-MCH-CSM-01'
    department_id = Column(String(32), ForeignKey("departments.id"), nullable=False)
    resource_type = Column(String(32), nullable=False)  # MANPOWER, SUPERVISOR, MACHINE, VEHICLE, TOOL, MATERIAL, SAFETY_EQUIP, SPECIALIST
    name = Column(String(128), nullable=False)
    base_section_id = Column(String(64), ForeignKey("railway_sections.id"), nullable=True)
    total_capacity = Column(Integer, nullable=False, default=1)
    is_operational = Column(Boolean, default=True)

    department = relationship("Department", back_populates="resources")
    allocations = relationship("ResourceAllocation", back_populates="resource")


class ResourceRequirement(Base):
    __tablename__ = "resource_requirements"

    id = Column(String(64), primary_key=True)
    task_id = Column(String(64), ForeignKey("maintenance_tasks.id"), nullable=False)
    resource_type = Column(String(32), nullable=False)
    required_quantity = Column(Integer, nullable=False, default=1)
    is_mandatory = Column(Boolean, default=True)
    alternative_resource_type = Column(String(32), nullable=True)

    task = relationship("MaintenanceTask", back_populates="resource_requirements")


class ResourceAllocation(Base):
    __tablename__ = "resource_allocations"

    id = Column(String(64), primary_key=True)
    block_id = Column(String(64), ForeignKey("maintenance_blocks.id"), nullable=False)
    resource_id = Column(String(64), ForeignKey("resources.id"), nullable=False)
    allocated_quantity = Column(Integer, nullable=False, default=1)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)

    block = relationship("MaintenanceBlock", back_populates="resource_allocations")
    resource = relationship("Resource", back_populates="allocations")


# ---------------------------------------------------------------------------
# 5. Trains & Timetables
# ---------------------------------------------------------------------------

class Train(Base):
    __tablename__ = "trains"

    id = Column(String(64), primary_key=True)  # e.g., 'TRN-12951'
    train_number = Column(String(32), unique=True, nullable=False, index=True)
    train_name = Column(String(128), nullable=False)
    train_category = Column(String(32), nullable=False)  # COACHING_PREMIUM, COACHING_MAIL, PASSENGER, GOODS, SERVICE
    priority_rank = Column(Integer, nullable=False, default=3)  # 1 = highest (Rajdhani), 5 = goods

    schedules = relationship("TrainSchedule", back_populates="train")
    conflicts = relationship("Conflict", back_populates="train")


class TrainSchedule(Base):
    __tablename__ = "train_schedules"

    id = Column(String(64), primary_key=True)
    train_id = Column(String(64), ForeignKey("trains.id"), nullable=False)
    section_id = Column(String(64), ForeignKey("railway_sections.id"), nullable=False)
    scheduled_entry = Column(DateTime, nullable=False)
    scheduled_exit = Column(DateTime, nullable=False)
    operating_window_start = Column(DateTime, nullable=False)
    operating_window_end = Column(DateTime, nullable=False)
    delay_minutes = Column(Integer, default=0)

    train = relationship("Train", back_populates="schedules")
    section = relationship("RailwaySection", back_populates="train_schedules")


# ---------------------------------------------------------------------------
# 6. Block Planning, Versions, Approvals & Consolidation
# ---------------------------------------------------------------------------

class OptimizationRun(Base):
    __tablename__ = "optimization_runs"

    id = Column(String(64), primary_key=True)  # e.g., 'OPT-2025-0520-001'
    horizon_type = Column(String(32), nullable=False)  # TODAY, NEXT_7_DAYS, WEEKLY, MONTHLY
    solver_status = Column(String(32), nullable=False)  # OPTIMAL, FEASIBLE, INFEASIBLE, TIMEOUT
    execution_time_ms = Column(Integer, nullable=False)
    objective_value = Column(Float, nullable=True)
    parameters_json = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    plan_versions = relationship("PlanVersion", back_populates="optimization_run")


class PlanVersion(Base):
    __tablename__ = "plan_versions"

    id = Column(String(64), primary_key=True)  # e.g., 'PLN-V1', 'PLN-V2'
    version_number = Column(Integer, nullable=False)
    parent_version_id = Column(String(64), ForeignKey("plan_versions.id"), nullable=True)
    optimization_run_id = Column(String(64), ForeignKey("optimization_runs.id"), nullable=True)
    status = Column(String(32), default="DRAFT")  # DRAFT, PENDING_REVIEW, MODIFIED, REJECTED, APPROVED, LOCKED
    created_by_user_id = Column(String(64), ForeignKey("users.id"), nullable=True)
    reason = Column(String(256), nullable=True)
    summary_kpis_json = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    optimization_run = relationship("OptimizationRun", back_populates="plan_versions")
    blocks = relationship("MaintenanceBlock", back_populates="plan_version")
    conflicts = relationship("Conflict", back_populates="plan_version")
    approvals = relationship("Approval", back_populates="plan_version")


class ConsolidationGroup(Base):
    __tablename__ = "consolidation_groups"

    id = Column(String(64), primary_key=True)  # e.g., 'CON-2025-01'
    section_id = Column(String(64), ForeignKey("railway_sections.id"), nullable=False)
    participating_departments_json = Column(JSON, nullable=False)  # e.g. ["ENG", "TRD", "SNT"]
    block_hours_saved = Column(Float, nullable=False, default=0.0)
    consolidation_reason = Column(Text, nullable=False)

    blocks = relationship("MaintenanceBlock", back_populates="consolidation_group")


class MaintenanceBlock(Base):
    __tablename__ = "maintenance_blocks"

    id = Column(String(64), primary_key=True)  # e.g., 'BLK-ENG-102'
    plan_version_id = Column(String(64), ForeignKey("plan_versions.id"), nullable=False)
    section_id = Column(String(64), ForeignKey("railway_sections.id"), nullable=False)
    consolidation_group_id = Column(String(64), ForeignKey("consolidation_groups.id"), nullable=True)
    block_type = Column(String(32), nullable=False)  # TRAFFIC_BLOCK, POWER_BLOCK, INTEGRATED_BLOCK
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    duration_min = Column(Integer, nullable=False)
    safety_status = Column(String(32), default="VALIDATED")  # VALIDATED, CONFLICT_DETECTED, SAFETY_BREACH
    ai_explanation = Column(Text, nullable=False)

    plan_version = relationship("PlanVersion", back_populates="blocks")
    section = relationship("RailwaySection", back_populates="blocks")
    consolidation_group = relationship("ConsolidationGroup", back_populates="blocks")
    tasks = relationship("BlockTask", back_populates="block")
    resource_allocations = relationship("ResourceAllocation", back_populates="block")
    conflicts = relationship("Conflict", back_populates="block")


class BlockTask(Base):
    __tablename__ = "block_tasks"

    id = Column(String(64), primary_key=True)
    block_id = Column(String(64), ForeignKey("maintenance_blocks.id"), nullable=False)
    task_id = Column(String(64), ForeignKey("maintenance_tasks.id"), nullable=False)
    sequence_order = Column(Integer, default=1)

    block = relationship("MaintenanceBlock", back_populates="tasks")
    task = relationship("MaintenanceTask", back_populates="block_associations")


class Conflict(Base):
    __tablename__ = "conflicts"

    id = Column(String(64), primary_key=True)  # e.g., 'CNF-2025-001'
    plan_version_id = Column(String(64), ForeignKey("plan_versions.id"), nullable=False)
    conflict_type = Column(String(64), nullable=False)  # 1 of 14 categories
    severity = Column(String(16), nullable=False)  # INFO, WARNING, HIGH, CRITICAL
    block_id = Column(String(64), ForeignKey("maintenance_blocks.id"), nullable=True)
    train_id = Column(String(64), ForeignKey("trains.id"), nullable=True)
    resource_id = Column(String(64), ForeignKey("resources.id"), nullable=True)
    explanation = Column(Text, nullable=False)
    resolution_options_json = Column(JSON, nullable=True)
    is_resolved = Column(Boolean, default=False)

    plan_version = relationship("PlanVersion", back_populates="conflicts")
    block = relationship("MaintenanceBlock", back_populates="conflicts")
    train = relationship("Train", back_populates="conflicts")


class Approval(Base):
    __tablename__ = "approvals"

    id = Column(String(64), primary_key=True)
    plan_version_id = Column(String(64), ForeignKey("plan_versions.id"), nullable=False)
    reviewer_user_id = Column(String(64), ForeignKey("users.id"), nullable=False)
    action = Column(String(32), nullable=False)  # APPROVE, MODIFY_AND_APPROVE, REJECT_AND_RECALCULATE
    decision_timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    validation_snapshot_json = Column(JSON, nullable=False)
    structured_rejection_code = Column(String(64), nullable=True)
    feedback_comments = Column(Text, nullable=True)

    plan_version = relationship("PlanVersion", back_populates="approvals")
    feedback = relationship("ApprovalFeedback", back_populates="approval", uselist=False)


class ApprovalFeedback(Base):
    __tablename__ = "approval_feedback"

    id = Column(String(64), primary_key=True)
    approval_id = Column(String(64), ForeignKey("approvals.id"), nullable=False)
    rejection_code = Column(String(64), nullable=False)
    free_text_feedback = Column(Text, nullable=False)
    parsed_constraints_json = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    approval = relationship("Approval", back_populates="feedback")


# ---------------------------------------------------------------------------
# 7. Audit & Notifications
# ---------------------------------------------------------------------------

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(64), primary_key=True)
    user_id = Column(String(64), ForeignKey("users.id"), nullable=True)
    action = Column(String(64), nullable=False)  # e.g., 'REJECT_PLAN', 'APPROVE_PLAN'
    entity_name = Column(String(64), nullable=False)
    entity_id = Column(String(64), nullable=False)
    old_value_json = Column(JSON, nullable=True)
    new_value_json = Column(JSON, nullable=True)
    reason = Column(String(256), nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)

    user = relationship("User", back_populates="audit_logs")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String(64), primary_key=True)
    user_id = Column(String(64), ForeignKey("users.id"), nullable=True)
    category = Column(String(32), nullable=False)  # CRITICAL_RISK, CONFLICT, APPROVAL_PENDING, SYSTEM
    title = Column(String(128), nullable=False)
    message = Column(Text, nullable=False)
    link_url = Column(String(256), nullable=True)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="notifications")
