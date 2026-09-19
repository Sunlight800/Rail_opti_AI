"""Verification tests for Phase 3: Database Models & Seed Data."""
import pytest
from rail_opti.database.session import SessionLocal
from rail_opti.database.init_db import init_db
from rail_opti.database.models import (
    Department,
    User,
    Corridor,
    RailwaySection,
    Asset,
    Defect,
    AssetHealth,
    MaintenanceTask,
    PriorityScore,
    RiskAssessment,
    Resource,
    Train,
    TrainSchedule,
    MaintenanceBlock,
    Conflict,
    ConsolidationGroup,
    PlanVersion,
    AuditLog,
    Notification,
)


@pytest.fixture(scope="module", autouse=True)
def setup_db():
    """Ensure database schema is created and seeded."""
    init_db()


def test_departments_and_users():
    """Verify departments and demo users."""
    db = SessionLocal()
    try:
        departments = db.query(Department).all()
        assert len(departments) == 4
        dept_ids = {d.id for d in departments}
        assert {"ENG", "TRD", "SNT", "OPT"} == dept_ids

        users = db.query(User).all()
        assert len(users) >= 6
        usernames = {u.username for u in users}
        assert "admin" in usernames
        assert "control_office" in usernames
        assert "engineering" in usernames
        assert "trd" in usernames
        assert "snt" in usernames
        assert "demo_user" in usernames
    finally:
        db.close()


def test_corridor_and_sections():
    """Verify corridor and 10 railway sections."""
    db = SessionLocal()
    try:
        corridor = db.query(Corridor).filter_by(id="COR-DEL-BOM").first()
        assert corridor is not None
        assert corridor.total_length_km == 1384.0

        sections = db.query(RailwaySection).all()
        assert len(sections) >= 10
        section_ids = {s.id for s in sections}
        assert "SEC-NDLS-ALD" in section_ids
        assert "SEC-ALD-BPL" in section_ids
        assert "SEC-BPL-RJP" in section_ids
        assert "SEC-RJP-JHS" in section_ids
        assert "SEC-JHS-PTA" in section_ids
    finally:
        db.close()


def test_assets_defects_and_health():
    """Verify 50+ assets, defects, and asset health records."""
    db = SessionLocal()
    try:
        assets = db.query(Asset).all()
        assert len(assets) >= 50

        # Verify Track 7A health
        health_7a = db.query(AssetHealth).filter_by(id="HLT-TRK-7A").first()
        assert health_7a is not None
        assert health_7a.failure_probability == 0.84
        assert health_7a.health_score == 42.0
        assert health_7a.urgency_level == "IMMEDIATE"

        defects = db.query(Defect).all()
        assert len(defects) >= 4
    finally:
        db.close()


def test_maintenance_tasks_and_priority():
    """Verify 100+ tasks and 6-factor priority scores."""
    db = SessionLocal()
    try:
        tasks = db.query(MaintenanceTask).all()
        assert len(tasks) >= 100

        # Verify MT-001 (Track 7A)
        mt1 = db.query(MaintenanceTask).filter_by(id="MT-001").first()
        assert mt1 is not None
        assert mt1.severity == "CRITICAL"
        assert mt1.safety_critical_flag is True

        ps1 = db.query(PriorityScore).filter_by(task_id="MT-001").first()
        assert ps1 is not None
        assert ps1.total_priority_score == 89.3
        assert ps1.priority_category == "CRITICAL"
        assert ps1.safety_risk == 96.0
        assert ps1.failure_probability == 84.0
    finally:
        db.close()


def test_resources_and_trains():
    """Verify 8 resource categories and 20+ trains."""
    db = SessionLocal()
    try:
        resources = db.query(Resource).all()
        assert len(resources) >= 20
        resource_types = {r.resource_type for r in resources}
        assert "MANPOWER" in resource_types
        assert "MACHINE" in resource_types
        assert "VEHICLE" in resource_types
        assert "SUPERVISOR" in resource_types
        assert "MATERIAL" in resource_types
        assert "SAFETY_EQUIP" in resource_types
        assert "SPECIALIST" in resource_types

        trains = db.query(Train).all()
        assert len(trains) >= 20
        train_nums = {t.train_number for t in trains}
        assert "12951" in train_nums  # Rajdhani
        assert "12002" in train_nums  # Shatabdi
        assert "20901" in train_nums  # Vande Bharat
        assert "SZ314" in train_nums  # Freight
    finally:
        db.close()


def test_plan_version_and_blocks():
    """Verify Plan V1, maintenance blocks, and conflicts."""
    db = SessionLocal()
    try:
        plan_v1 = db.query(PlanVersion).filter_by(id="PLN-V1").first()
        assert plan_v1 is not None
        assert plan_v1.version_number == 1
        assert plan_v1.summary_kpis_json["total_blocks_count"] == 28

        blocks = db.query(MaintenanceBlock).filter_by(plan_version_id="PLN-V1").all()
        assert len(blocks) >= 4
        block_ids = {b.id for b in blocks}
        assert "BLK-ENG-102" in block_ids
        assert "BLK-TRD-045" in block_ids

        # Conflict verification
        conflict = db.query(Conflict).filter_by(plan_version_id="PLN-V1").first()
        assert conflict is not None
        assert "Freight SZ314" in conflict.explanation

        # Consolidation verification
        con = db.query(ConsolidationGroup).filter_by(id="CON-2025-01").first()
        assert con is not None
        assert con.block_hours_saved == 4.5
    finally:
        db.close()
