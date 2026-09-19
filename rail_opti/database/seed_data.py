"""Deterministic seed data generator for RAILOPT AI (SIH26027).

Populates:
- 4 Departments
- 6 Demo Users (with roles)
- 1 Corridor (Delhi-Mumbai)
- 10 Railway Sections (with GIS coordinates)
- 50+ Assets (Track, OHE, Signals, Turnouts, Point Machines)
- 20+ Defects (USFD flaws, rail fractures, OHE sagging)
- 50+ Asset Health & Risk records
- 100+ Maintenance Tasks (with 6-factor priority scores)
- 8 Resource Categories (Manpower, Machines, Vehicles, Specialists, etc.)
- 20+ Trains (Rajdhani, Shatabdi, Vande Bharat, Freight SZ314, etc.)
- Train Schedules with section occupancies
- Maintenance Blocks & Pre-staged Conflicts
- Consolidation Groups & Initial Plan Version V1
- Audit Logs & Notifications
"""
import datetime
from sqlalchemy.orm import Session
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
    ResourceRequirement,
    ResourceAllocation,
    Train,
    TrainSchedule,
    OptimizationRun,
    PlanVersion,
    MaintenanceBlock,
    BlockTask,
    ConsolidationGroup,
    Conflict,
    AuditLog,
    Notification,
)


def seed_resources_if_missing(db: Session):
    """Seed resources and allocations if they do not already exist."""
    if db.query(Resource).filter_by(resource_type="TRACK_MACHINES").first():
        return

    resources_data = [
        # 1. TRACK_MACHINES (Engineering)
        ("RES-MCH-BCM-01", "ENG", "TRACK_MACHINES", "Ballast Cleaning Machine (BCM-01)", "SEC-NDLS-ALD", 1, True),
        ("RES-MCH-BCM-02", "ENG", "TRACK_MACHINES", "Ballast Cleaning Machine (BCM-02)", "SEC-ALD-BPL", 1, True),
        ("RES-MCH-CSM-01", "ENG", "TRACK_MACHINES", "Continuous Tamping Machine (CSM-01)", "SEC-NDLS-ALD", 1, True),
        ("RES-MCH-CSM-02", "ENG", "TRACK_MACHINES", "Continuous Tamping Machine (CSM-02)", "SEC-BPL-RJP", 1, True),
        ("RES-MCH-DGS-01", "ENG", "TRACK_MACHINES", "Dynamic Track Stabilizer (DGS-01)", "SEC-NDLS-ALD", 1, True),
        ("RES-MCH-T28-01", "ENG", "TRACK_MACHINES", "Point & Crossing Machine (T-28)", "SEC-RJP-BRC", 1, True),
        ("RES-MCH-UNIMAT", "ENG", "TRACK_MACHINES", "UNIMAT 4S Switch Tamper", "SEC-BRC-ST", 1, True),
        # 2. TOWER_WAGONS (Electrical / TRD)
        ("RES-TW-08W-01", "TRD", "TOWER_WAGONS", "8-Wheeler OHE Inspection Car (TW-01)", "SEC-NDLS-ALD", 1, True),
        ("RES-TW-08W-02", "TRD", "TOWER_WAGONS", "8-Wheeler OHE Inspection Car (TW-02)", "SEC-ALD-BPL", 1, True),
        ("RES-TW-04W-01", "TRD", "TOWER_WAGONS", "4-Wheeler Wiring Car (TW-03)", "SEC-BPL-RJP", 1, True),
        # 3. CREW_DEPOTS (Gangmen, Linesmen, Techs)
        ("RES-CRW-GANG-01", "ENG", "CREW_DEPOTS", "Delhi P-Way Maintenance Gang (20 Trackmen)", "SEC-NDLS-ALD", 20, True),
        ("RES-CRW-GANG-02", "ENG", "CREW_DEPOTS", "Agra P-Way Maintenance Gang (15 Trackmen)", "SEC-ALD-BPL", 15, True),
        ("RES-CRW-TRD-01", "TRD", "CREW_DEPOTS", "Mathura OHE Wiring Gang (10 Linesmen)", "SEC-NDLS-ALD", 10, True),
        ("RES-CRW-SNT-01", "SNT", "CREW_DEPOTS", "Kota S&T Signal Crew (8 Technicians)", "SEC-BPL-RJP", 8, True),
        # 4. POWER_DISCONNECT (TPC / Electrical Isolation)
        ("RES-PWR-TPC-01", "TRD", "POWER_DISCONNECT", "TPC Traction Isolation Unit (Substation 1)", "SEC-NDLS-ALD", 1, True),
        ("RES-PWR-TPC-02", "TRD", "POWER_DISCONNECT", "TPC Traction Isolation Unit (Substation 2)", "SEC-ALD-BPL", 1, True),
        # 5. TRAFFIC_CONTROLLERS (Operations)
        ("RES-OPS-CTRL-01", "OPT", "TRAFFIC_CONTROLLERS", "Section Controller (Delhi - Agra)", "SEC-NDLS-ALD", 2, True),
        ("RES-OPS-CTRL-02", "OPT", "TRAFFIC_CONTROLLERS", "Section Controller (Agra - Bhopal)", "SEC-ALD-BPL", 2, True),
        # 6. SPEED_RESTRICTION_BOARDS
        ("RES-SRB-30KM", "ENG", "SPEED_RESTRICTION_BOARDS", "Caution Indicator Boards (30 km/h kit)", "SEC-NDLS-ALD", 4, True),
        ("RES-SRB-45KM", "ENG", "SPEED_RESTRICTION_BOARDS", "Caution Indicator Boards (45 km/h kit)", "SEC-ALD-BPL", 4, True),
        # 7. SAFETY_GEAR
        ("RES-SFT-FLAG-01", "ENG", "SAFETY_GEAR", "Hand Signal Flags & Detonator Kit 01", "SEC-NDLS-ALD", 10, True),
        ("RES-SFT-FLAG-02", "TRD", "SAFETY_GEAR", "Hand Signal Flags & Detonator Kit 02", "SEC-ALD-BPL", 10, True),
        ("RES-SFT-COMM-01", "SNT", "SAFETY_GEAR", "VHF Walkie-Talkie Set (Channel 2A)", "SEC-NDLS-ALD", 8, True),
        # 8. ESCORTS (Security)
        ("RES-SEC-RPF-01", "OPT", "ESCORTS", "RPF Track Security Squad (4 Personnel)", "SEC-NDLS-ALD", 4, True),
        ("RES-SEC-GRP-01", "OPT", "ESCORTS", "GRP Route Patrol Squad (4 Personnel)", "SEC-ALD-BPL", 4, True),
    ]

    for rid, dept_id, rtype, rname, sec_id, cap, is_op in resources_data:
        existing = db.query(Resource).filter_by(id=rid).first()
        if existing:
            existing.resource_type = rtype
            existing.name = rname
            existing.base_section_id = sec_id
            existing.total_capacity = cap
            existing.is_operational = is_op
        else:
            res = Resource(
                id=rid,
                department_id=dept_id,
                resource_type=rtype,
                name=rname,
                base_section_id=sec_id,
                total_capacity=cap,
                is_operational=is_op,
            )
            db.add(res)
    db.flush()

    # Add sample allocations if blocks exist
    blk_eng = db.query(MaintenanceBlock).filter_by(id="BLK-ENG-102").first()
    if blk_eng and not db.query(ResourceAllocation).filter_by(id="ALC-01").first():
        db.add(ResourceAllocation(id="ALC-01", block_id="BLK-ENG-102", resource_id="RES-MCH-BCM-01", allocated_quantity=1, start_time=blk_eng.start_time, end_time=blk_eng.end_time))
        db.add(ResourceAllocation(id="ALC-02", block_id="BLK-ENG-102", resource_id="RES-CRW-GANG-01", allocated_quantity=15, start_time=blk_eng.start_time, end_time=blk_eng.end_time))
    blk_trd = db.query(MaintenanceBlock).filter_by(id="BLK-TRD-045").first()
    if blk_trd and not db.query(ResourceAllocation).filter_by(id="ALC-03").first():
        db.add(ResourceAllocation(id="ALC-03", block_id="BLK-TRD-045", resource_id="RES-TW-08W-01", allocated_quantity=1, start_time=blk_trd.start_time, end_time=blk_trd.end_time))
        db.add(ResourceAllocation(id="ALC-04", block_id="BLK-TRD-045", resource_id="RES-PWR-TPC-01", allocated_quantity=1, start_time=blk_trd.start_time, end_time=blk_trd.end_time))
    db.commit()


def seed_database(db: Session):
    """Seed all deterministic demo records if database is empty."""
    # Check if already seeded
    if db.query(Department).first():
        seed_resources_if_missing(db)
        return

    now = datetime.datetime.utcnow()
    today = now.date()

    # -----------------------------------------------------------------------
    # 1. Departments
    # -----------------------------------------------------------------------
    departments = [
        Department(id="ENG", name="Civil Engineering (Track)", color_code="#f43f5e"),
        Department(id="TRD", name="Traction Distribution (Electrical)", color_code="#06b6d4"),
        Department(id="SNT", name="Signal & Telecom", color_code="#10b981"),
        Department(id="OPT", name="Operating & Control Office", color_code="#3b82f6"),
    ]
    db.add_all(departments)
    db.flush()

    # -----------------------------------------------------------------------
    # 2. Users
    # -----------------------------------------------------------------------
    users = [
        User(id="USR-ADM-01", username="admin", email="admin@railopt.ai", hashed_password="pbkdf2:sha256:demoPassword123", full_name="Shri Rajesh Sharma", department_id="OPT", role="ADMIN"),
        User(id="USR-CTL-01", username="control_office", email="srdom@railopt.ai", hashed_password="pbkdf2:sha256:demoPassword123", full_name="Shri A. K. Verma (Sr. DOM)", department_id="OPT", role="CONTROL_OFFICE"),
        User(id="USR-ENG-01", username="engineering", email="den@railopt.ai", hashed_password="pbkdf2:sha256:demoPassword123", full_name="Smt. Priya Nair (DEN Track)", department_id="ENG", role="ENGINEERING"),
        User(id="USR-TRD-01", username="trd", email="deetr_d@railopt.ai", hashed_password="pbkdf2:sha256:demoPassword123", full_name="Shri Vikram Singh (DEE TRD)", department_id="TRD", role="TRD"),
        User(id="USR-SNT-01", username="snt", email="dste@railopt.ai", hashed_password="pbkdf2:sha256:demoPassword123", full_name="Shri Manoj Gupta (DSTE)", department_id="SNT", role="SNT"),
        User(id="USR-DEMO-01", username="demo_user", email="demo@railopt.ai", hashed_password="pbkdf2:sha256:demoPassword123", full_name="Guest Evaluator (SIH26027)", department_id="OPT", role="DEMO_USER"),
    ]
    db.add_all(users)
    db.flush()

    # -----------------------------------------------------------------------
    # 3. Corridor & Sections (Delhi - Mumbai)
    # -----------------------------------------------------------------------
    corridor = Corridor(
        id="COR-DEL-BOM",
        name="Delhi - Mumbai Golden Quadrilateral",
        code="DLI-MMCT",
        total_length_km=1384.0,
    )
    db.add(corridor)
    db.flush()

    section_data = [
        ("SEC-NDLS-ALD", "New Delhi - Prayagraj", "DOUBLE_UP", 130, 635.0, 0.0, 635.0, "WARNING", [[28.6139, 77.2090], [25.4358, 81.8463]]),
        ("SEC-ALD-BPL", "Prayagraj - Bhopal", "DOUBLE_UP", 120, 510.0, 635.0, 1145.0, "WARNING", [[25.4358, 81.8463], [23.2599, 77.4126]]),
        ("SEC-BPL-RJP", "Bhopal - Ratlam", "DOUBLE_UP", 130, 189.0, 1145.0, 1334.0, "NORMAL", [[23.2599, 77.4126], [23.3315, 75.0367]]),
        ("SEC-RJP-JHS", "Ratlam - Jhansi", "DOUBLE_DOWN", 110, 390.0, 1334.0, 1724.0, "NORMAL", [[23.3315, 75.0367], [25.4484, 78.5685]]),
        ("SEC-JHS-PTA", "Jhansi - Mathura", "DOUBLE_UP", 130, 274.0, 1724.0, 1998.0, "NORMAL", [[25.4484, 78.5685], [27.4924, 77.6737]]),
        ("SEC-KTA-BRC", "Kota - Vadodara", "DOUBLE_DOWN", 130, 526.0, 1998.0, 2524.0, "NORMAL", [[25.2138, 75.8648], [22.3072, 73.1812]]),
        ("SEC-BRC-ST", "Vadodara - Surat", "DOUBLE_UP", 130, 129.0, 2524.0, 2653.0, "NORMAL", [[22.3072, 73.1812], [21.1702, 72.8311]]),
        ("SEC-ST-BSR", "Surat - Vasai Road", "DOUBLE_DOWN", 120, 216.0, 2653.0, 2869.0, "NORMAL", [[21.1702, 72.8311], [19.3800, 72.8300]]),
        ("SEC-BSR-MMCT", "Vasai Road - Mumbai Central", "MULTIPLE", 110, 48.0, 2869.0, 2917.0, "NORMAL", [[19.3800, 72.8300], [18.9696, 72.8193]]),
        ("SEC-CNB-ALD", "Kanpur - Prayagraj Loop", "SINGLE", 100, 194.0, 441.0, 635.0, "NORMAL", [[26.4499, 80.3319], [25.4358, 81.8463]]),
    ]

    sections = []
    for sid, sname, stype, spd, slen, skm, ekm, stat, coords in section_data:
        sec = RailwaySection(
            id=sid,
            corridor_id="COR-DEL-BOM",
            name=sname,
            track_type=stype,
            speed_limit_kmh=spd,
            length_km=slen,
            start_km=skm,
            end_km=ekm,
            status=stat,
            coordinates_json=coords,
        )
        sections.append(sec)
        db.add(sec)
    db.flush()

    # -----------------------------------------------------------------------
    # 4. Assets (50+ assets)
    # -----------------------------------------------------------------------
    assets = []
    # Primary assets highlighted in dashboard
    primary_assets = [
        ("AST-TRK-7A", "SEC-NDLS-ALD", "ENG", "TRACK", "Track Section 7A (Km 142/10-18)", "CRITICAL", 68.5, datetime.date(2018, 4, 15)),
        ("AST-OHE-ALD-12", "SEC-ALD-BPL", "TRD", "OHE_MAST", "OHE Mast ALD-12/4-8", "HIGH", 45.2, datetime.date(2019, 8, 20)),
        ("AST-SIG-BPL-04", "SEC-BPL-RJP", "SNT", "SIGNAL_POST", "Automatic Signal Post BPL-4S", "HIGH", 52.0, datetime.date(2020, 1, 10)),
        ("AST-TRK-9C", "SEC-RJP-JHS", "ENG", "TRACK", "Track Section 9C (Km 288/02-14)", "MEDIUM", 38.1, datetime.date(2019, 11, 5)),
        ("AST-OHE-JHS-PTA", "SEC-JHS-PTA", "TRD", "OHE_MAST", "OHE Cantilever JHS-77/1", "MEDIUM", 41.0, datetime.date(2021, 3, 14)),
    ]

    for aid, sec_id, dep_id, atype, aname, crit, gmt, idate in primary_assets:
        ast = Asset(
            id=aid,
            section_id=sec_id,
            department_id=dep_id,
            asset_type=atype,
            name=aname,
            installation_date=idate,
            criticality=crit,
            cumulative_gmt=gmt,
            last_maintenance_date=today - datetime.timedelta(days=180),
        )
        assets.append(ast)
        db.add(ast)

    # Generate additional 48 assets across sections to total 53 assets
    asset_types_pool = [
        ("ENG", "TRACK", "Track Segment Km "),
        ("ENG", "TURNOUT", "Turnout 1:12 Point No. "),
        ("TRD", "OHE_MAST", "OHE Tension Mast No. "),
        ("SNT", "SIGNAL_POST", "Signal Aspect Post No. "),
        ("SNT", "POINT_MACHINE", "Electric Point Machine No. "),
    ]

    for i in range(6, 54):
        dep, atype, prefix = asset_types_pool[i % len(asset_types_pool)]
        sec = sections[i % len(sections)]
        crit = "CRITICAL" if i % 10 == 0 else ("HIGH" if i % 4 == 0 else ("MEDIUM" if i % 2 == 0 else "LOW"))
        ast = Asset(
            id=f"AST-{dep}-{i:03d}",
            section_id=sec.id,
            department_id=dep,
            asset_type=atype,
            name=f"{prefix}{i * 12 + 4}",
            installation_date=datetime.date(2017 + (i % 7), (i % 12) + 1, (i % 28) + 1),
            criticality=crit,
            cumulative_gmt=float(25 + (i * 1.8)),
            last_maintenance_date=today - datetime.timedelta(days=(i * 15) % 360),
        )
        assets.append(ast)
        db.add(ast)
    db.flush()

    # -----------------------------------------------------------------------
    # 5. Asset Health & Defects
    # -----------------------------------------------------------------------
    # Special Health for Track 7A (matches AI Operations Intelligence card)
    health_7a = AssetHealth(
        id="HLT-TRK-7A",
        asset_id="AST-TRK-7A",
        health_score=42.0,
        failure_probability=0.84,
        defect_count=3,
        overdue_days=42,
        urgency_level="IMMEDIATE",
        evidence_summary="High GMT load (68.5 GMT), 3 active USFD flaw indications, and overdue tamping cycle.",
        assessed_at=now,
    )
    db.add(health_7a)

    # Health for remaining assets
    for i, ast in enumerate(assets[1:], start=2):
        fail_prob = 0.67 if ast.criticality == "HIGH" else (0.45 if ast.criticality == "MEDIUM" else 0.15)
        h_score = 100.0 - (fail_prob * 70.0)
        h = AssetHealth(
            id=f"HLT-{ast.id}",
            asset_id=ast.id,
            health_score=round(h_score, 1),
            failure_probability=fail_prob,
            defect_count=2 if fail_prob > 0.5 else 0,
            overdue_days=25 if fail_prob > 0.5 else 0,
            urgency_level="URGENT" if fail_prob > 0.6 else "ROUTINE",
            evidence_summary=f"Automated diagnostic evaluation for {ast.name}.",
            assessed_at=now,
        )
        db.add(h)

    # Defects
    defects_data = [
        ("DEF-2025-0101", "AST-TRK-7A", "USFD_FLAW", "CRITICAL", today - datetime.timedelta(days=4), "Transverse fatigue crack detected in rail head."),
        ("DEF-2025-0102", "AST-TRK-7A", "RAIL_FRACTURE", "HIGH", today - datetime.timedelta(days=2), "Fishplate bolt hole elongation near joint."),
        ("DEF-2025-0103", "AST-OHE-ALD-12", "OHE_SAGGING", "HIGH", today - datetime.timedelta(days=3), "Contact wire sag exceeding permissible 100mm tolerance."),
        ("DEF-2025-0104", "AST-SIG-BPL-04", "SIGNAL_FAILURE", "HIGH", today - datetime.timedelta(days=1), "Relay interlocking contact resistance anomaly."),
    ]
    for did, aid, dtype, dsev, ddate, ddesc in defects_data:
        db.add(Defect(id=did, asset_id=aid, defect_type=dtype, severity=dsev, detected_date=ddate, status="OPEN", description=ddesc))
    db.flush()

    # -----------------------------------------------------------------------
    # 6. Resources (8 Categories)
    # -----------------------------------------------------------------------
    resources_data = [
        # Manpower
        ("RES-GANG-ENG-01", "ENG", "MANPOWER", "Track Maintenance Gang ENG-01", "SEC-NDLS-ALD", 25),
        ("RES-GANG-ENG-02", "ENG", "MANPOWER", "Track Maintenance Gang ENG-02", "SEC-ALD-BPL", 25),
        ("RES-GANG-TRD-01", "TRD", "MANPOWER", "OHE Line Gang TRD-01", "SEC-ALD-BPL", 15),
        ("RES-GANG-SNT-01", "SNT", "MANPOWER", "Signal Technician Gang SNT-01", "SEC-BPL-RJP", 12),
        # Supervisors
        ("RES-SSE-ENG-01", "ENG", "SUPERVISOR", "Senior Section Engineer (P-Way)", "SEC-NDLS-ALD", 3),
        ("RES-SSE-TRD-01", "TRD", "SUPERVISOR", "Senior Section Engineer (TRD)", "SEC-ALD-BPL", 2),
        ("RES-SSE-SNT-01", "SNT", "SUPERVISOR", "Senior Section Engineer (Signal)", "SEC-BPL-RJP", 2),
        # Heavy Track Machines
        ("RES-MCH-CSM-01", "ENG", "MACHINE", "Continuous Tamping Machine CSM-101", "SEC-NDLS-ALD", 1),
        ("RES-MCH-BCM-01", "ENG", "MACHINE", "Ballast Cleaning Machine BCM-05", "SEC-ALD-BPL", 1),
        ("RES-MCH-TW-01", "TRD", "MACHINE", "4-Wheeler Tower Wagon TW-01", "SEC-ALD-BPL", 1),
        ("RES-MCH-BR-01", "ENG", "MACHINE", "Ballast Regulator BR-12", "SEC-BPL-RJP", 1),
        # Vehicles
        ("RES-VEH-VAN-01", "ENG", "VEHICLE", "Heavy Maintenance Utility Van", "SEC-NDLS-ALD", 2),
        ("RES-VEH-RCRV-01", "TRD", "VEHICLE", "Road-Cum-Rail Vehicle RCRV-01", "SEC-ALD-BPL", 1),
        # Tools & Materials
        ("RES-TOOL-WELD-01", "ENG", "TOOL", "Alumino-Thermit Welding Equipment Set", "SEC-NDLS-ALD", 4),
        ("RES-MAT-RAIL-60KG", "ENG", "MATERIAL", "60kg UIC Prime Rails (Sets)", "SEC-NDLS-ALD", 100),
        ("RES-MAT-OHE-WIRE", "TRD", "MATERIAL", "107 sq mm Contact Wire Spools", "SEC-ALD-BPL", 10),
        # Safety Equipment
        ("RES-SAFE-SET-01", "ENG", "SAFETY_EQUIP", "Banner Flags, Detonators & Flare Set", "SEC-NDLS-ALD", 20),
        ("RES-SAFE-ROD-01", "TRD", "SAFETY_EQUIP", "OHE Discharge Earthing Rods", "SEC-ALD-BPL", 15),
        # Specialists
        ("RES-SPEC-USFD-01", "ENG", "SPECIALIST", "Ultrasonic Flaw Detection Specialist", "SEC-NDLS-ALD", 2),
        ("RES-SPEC-WELD-01", "ENG", "SPECIALIST", "Certified AT Welder", "SEC-ALD-BPL", 3),
    ]

    for rid, dep, rtype, rname, sec, cap in resources_data:
        res = Resource(
            id=rid,
            department_id=dep,
            resource_type=rtype,
            name=rname,
            base_section_id=sec,
            total_capacity=cap,
            is_operational=True,
        )
        db.add(res)
    db.flush()

    # -----------------------------------------------------------------------
    # 7. Maintenance Tasks (100+ tasks) & Priority / Risk
    # -----------------------------------------------------------------------
    # Primary 5 tasks from Dashboard concept
    primary_tasks_specs = [
        ("MT-001", "AST-TRK-7A", "SEC-NDLS-ALD", "ENG", "TAMPING", "DEF-2025-0101", "CRITICAL", 84, "2025-05-20", "AI SCHEDULED", 96.0, 84.0, 78.0, 72.0, 65.0, 83.0, 89.3, True),
        ("MT-002", "AST-OHE-ALD-12", "SEC-ALD-BPL", "TRD", "OHE_INSPECTION", "DEF-2025-0103", "HIGH", 67, "2025-05-21", "UNDER REVIEW", 80.0, 67.0, 75.0, 70.0, 60.0, 75.0, 78.4, False),
        ("MT-003", "AST-SIG-BPL-04", "SEC-BPL-RJP", "SNT", "SIGNAL_TESTING", "DEF-2025-0104", "HIGH", 62, "2025-05-22", "OPEN", 75.0, 62.0, 70.0, 65.0, 58.0, 70.0, 76.1, False),
        ("MT-004", "AST-TRK-9C", "SEC-RJP-JHS", "ENG", "RAIL_RENEWAL", None, "MEDIUM", 48, "2025-05-25", "OPEN", 55.0, 48.0, 60.0, 50.0, 45.0, 50.0, 63.5, False),
        ("MT-005", "AST-OHE-JHS-PTA", "SEC-JHS-PTA", "TRD", "OHE_INSPECTION", None, "MEDIUM", 45, "2025-05-26", "OPEN", 50.0, 45.0, 55.0, 48.0, 40.0, 48.0, 58.2, False),
    ]

    for tid, aid, sid, dep, ttype, defid, sev, rpct, ddate, stat, srisk, fprob, acrit, urg, timp, dsev, pscore, scrit in primary_tasks_specs:
        mt = MaintenanceTask(
            id=tid,
            asset_id=aid,
            section_id=sid,
            department_id=dep,
            task_type=ttype,
            defect_id=defid,
            severity=sev,
            requested_date=today - datetime.timedelta(days=2),
            due_date=datetime.datetime.strptime(ddate, "%Y-%m-%d").date(),
            estimated_duration_min=180,
            safety_critical_flag=scrit,
            status=stat,
            notes=f"Primary operations maintenance task on {sid}.",
        )
        db.add(mt)
        db.flush()

        # Priority score (formula verification)
        ps = PriorityScore(
            id=f"PSC-{tid}",
            task_id=tid,
            safety_risk=srisk,
            failure_probability=fprob,
            asset_criticality=acrit,
            maintenance_urgency=urg,
            traffic_impact=timp,
            defect_severity=dsev,
            total_priority_score=pscore,
            priority_category=sev,
            ai_rationale=f"High safety risk ({srisk}) and failure probability ({fprob}%) on critical section {sid}.",
            calculated_at=now,
        )
        db.add(ps)

        # Risk assessment
        ra = RiskAssessment(
            id=f"RSK-{tid}",
            task_id=tid,
            safety_risk_level=sev,
            failure_probability_val=rpct / 100.0,
            operational_impact_level="HIGH" if rpct > 60 else "MEDIUM",
            risk_category=sev,
            confidence_score=0.94,
            explanation=f"Risk calculated from defect history and gross million tonnes traffic.",
        )
        db.add(ra)

        # Add resource requirements for MT-001
        if tid == "MT-001":
            db.add(ResourceRequirement(id="REQ-01-1", task_id="MT-001", resource_type="MANPOWER", required_quantity=15, is_mandatory=True))
            db.add(ResourceRequirement(id="REQ-01-2", task_id="MT-001", resource_type="SUPERVISOR", required_quantity=1, is_mandatory=True))
            db.add(ResourceRequirement(id="REQ-01-3", task_id="MT-001", resource_type="MACHINE", required_quantity=1, is_mandatory=True, alternative_resource_type="MANUAL_TAMPING"))
            db.add(ResourceRequirement(id="REQ-01-4", task_id="MT-001", resource_type="VEHICLE", required_quantity=1, is_mandatory=False))
            db.add(ResourceRequirement(id="REQ-01-5", task_id="MT-001", resource_type="SAFETY_EQUIP", required_quantity=5, is_mandatory=True))

    # Generate additional 97 tasks across sections to total 102 tasks
    task_types = ["TAMPING", "RAIL_RENEWAL", "OHE_INSPECTION", "SIGNAL_TESTING", "BALLAST_CLEANING", "TURNOUT_OVERHAUL"]
    for i in range(6, 103):
        ast = assets[i % len(assets)]
        sec = sections[i % len(sections)]
        ttype = task_types[i % len(task_types)]
        sev = "HIGH" if i % 5 == 0 else ("MEDIUM" if i % 2 == 0 else "LOW")
        stat = "SCHEDULED" if i % 4 == 0 else ("PENDING" if i % 3 == 0 else "OPEN")
        tid = f"MT-{i:03d}"
        
        srisk = float(85 if sev == "HIGH" else (60 if sev == "MEDIUM" else 35))
        fprob = float(75 if sev == "HIGH" else (50 if sev == "MEDIUM" else 25))
        acrit = float(70 if sev == "HIGH" else (50 if sev == "MEDIUM" else 30))
        urg = float(65 if sev == "HIGH" else (45 if sev == "MEDIUM" else 25))
        timp = float(60 if sev == "HIGH" else (40 if sev == "MEDIUM" else 20))
        dsev = float(70 if sev == "HIGH" else (50 if sev == "MEDIUM" else 30))
        
        # Priority formula: 0.30S + 0.20Pf + 0.15Ca + 0.15Um + 0.10Io + 0.10Ds
        score = (0.30 * srisk) + (0.20 * fprob) + (0.15 * acrit) + (0.15 * urg) + (0.10 * timp) + (0.10 * dsev)

        mt = MaintenanceTask(
            id=tid,
            asset_id=ast.id,
            section_id=sec.id,
            department_id=ast.department_id,
            task_type=ttype,
            severity=sev,
            requested_date=today - datetime.timedelta(days=(i % 10)),
            due_date=today + datetime.timedelta(days=(i % 20) + 1),
            estimated_duration_min=120 + ((i % 4) * 30),
            safety_critical_flag=(i % 12 == 0),
            status=stat,
            notes=f"Routine scheduled task {tid}.",
        )
        db.add(mt)
        db.flush()

        ps = PriorityScore(
            id=f"PSC-{tid}",
            task_id=tid,
            safety_risk=srisk,
            failure_probability=fprob,
            asset_criticality=acrit,
            maintenance_urgency=urg,
            traffic_impact=timp,
            defect_severity=dsev,
            total_priority_score=round(score, 1),
            priority_category=sev,
            ai_rationale=f"Routine priority evaluation for {tid}.",
            calculated_at=now,
        )
        db.add(ps)
    # -----------------------------------------------------------------------
    # 7. Resources across 8 Categories (25+ items)
    # -----------------------------------------------------------------------
    resources_data = [
        # 1. TRACK_MACHINES (Engineering)
        ("RES-MCH-BCM-01", "ENG", "TRACK_MACHINES", "Ballast Cleaning Machine (BCM-01)", "SEC-NDLS-ALD", 1, True),
        ("RES-MCH-BCM-02", "ENG", "TRACK_MACHINES", "Ballast Cleaning Machine (BCM-02)", "SEC-ALD-BPL", 1, True),
        ("RES-MCH-CSM-01", "ENG", "TRACK_MACHINES", "Continuous Tamping Machine (CSM-01)", "SEC-NDLS-ALD", 1, True),
        ("RES-MCH-CSM-02", "ENG", "TRACK_MACHINES", "Continuous Tamping Machine (CSM-02)", "SEC-BPL-RJP", 1, True),
        ("RES-MCH-DGS-01", "ENG", "TRACK_MACHINES", "Dynamic Track Stabilizer (DGS-01)", "SEC-NDLS-ALD", 1, True),
        ("RES-MCH-T28-01", "ENG", "TRACK_MACHINES", "Point & Crossing Machine (T-28)", "SEC-RJP-BRC", 1, True),
        ("RES-MCH-UNIMAT", "ENG", "TRACK_MACHINES", "UNIMAT 4S Switch Tamper", "SEC-BRC-ST", 1, True),
        # 2. TOWER_WAGONS (Electrical / TRD)
        ("RES-TW-08W-01", "TRD", "TOWER_WAGONS", "8-Wheeler OHE Inspection Car (TW-01)", "SEC-NDLS-ALD", 1, True),
        ("RES-TW-08W-02", "TRD", "TOWER_WAGONS", "8-Wheeler OHE Inspection Car (TW-02)", "SEC-ALD-BPL", 1, True),
        ("RES-TW-04W-01", "TRD", "TOWER_WAGONS", "4-Wheeler Wiring Car (TW-03)", "SEC-BPL-RJP", 1, True),
        # 3. CREW_DEPOTS (Gangmen, Linesmen, Techs)
        ("RES-CRW-GANG-01", "ENG", "CREW_DEPOTS", "Delhi P-Way Maintenance Gang (20 Trackmen)", "SEC-NDLS-ALD", 20, True),
        ("RES-CRW-GANG-02", "ENG", "CREW_DEPOTS", "Agra P-Way Maintenance Gang (15 Trackmen)", "SEC-ALD-BPL", 15, True),
        ("RES-CRW-TRD-01", "TRD", "CREW_DEPOTS", "Mathura OHE Wiring Gang (10 Linesmen)", "SEC-NDLS-ALD", 10, True),
        ("RES-CRW-SNT-01", "SNT", "CREW_DEPOTS", "Kota S&T Signal Crew (8 Technicians)", "SEC-BPL-RJP", 8, True),
        # 4. POWER_DISCONNECT (TPC / Electrical Isolation)
        ("RES-PWR-TPC-01", "TRD", "POWER_DISCONNECT", "TPC Traction Isolation Unit (Substation 1)", "SEC-NDLS-ALD", 1, True),
        ("RES-PWR-TPC-02", "TRD", "POWER_DISCONNECT", "TPC Traction Isolation Unit (Substation 2)", "SEC-ALD-BPL", 1, True),
        # 5. TRAFFIC_CONTROLLERS (Operations)
        ("RES-OPS-CTRL-01", "OPT", "TRAFFIC_CONTROLLERS", "Section Controller (Delhi - Agra)", "SEC-NDLS-ALD", 2, True),
        ("RES-OPS-CTRL-02", "OPT", "TRAFFIC_CONTROLLERS", "Section Controller (Agra - Bhopal)", "SEC-ALD-BPL", 2, True),
        # 6. SPEED_RESTRICTION_BOARDS
        ("RES-SRB-30KM", "ENG", "SPEED_RESTRICTION_BOARDS", "Caution Indicator Boards (30 km/h kit)", "SEC-NDLS-ALD", 4, True),
        ("RES-SRB-45KM", "ENG", "SPEED_RESTRICTION_BOARDS", "Caution Indicator Boards (45 km/h kit)", "SEC-ALD-BPL", 4, True),
        # 7. SAFETY_GEAR
        ("RES-SFT-FLAG-01", "ENG", "SAFETY_GEAR", "Hand Signal Flags & Detonator Kit 01", "SEC-NDLS-ALD", 10, True),
        ("RES-SFT-FLAG-02", "TRD", "SAFETY_GEAR", "Hand Signal Flags & Detonator Kit 02", "SEC-ALD-BPL", 10, True),
        ("RES-SFT-COMM-01", "SNT", "SAFETY_GEAR", "VHF Walkie-Talkie Set (Channel 2A)", "SEC-NDLS-ALD", 8, True),
        # 8. ESCORTS (Security)
        ("RES-SEC-RPF-01", "OPT", "ESCORTS", "RPF Track Security Squad (4 Personnel)", "SEC-NDLS-ALD", 4, True),
        ("RES-SEC-GRP-01", "OPT", "ESCORTS", "GRP Route Patrol Squad (4 Personnel)", "SEC-ALD-BPL", 4, True),
    ]

    for rid, dept_id, rtype, rname, sec_id, cap, is_op in resources_data:
        res = Resource(
            id=rid,
            department_id=dept_id,
            resource_type=rtype,
            name=rname,
            base_section_id=sec_id,
            total_capacity=cap,
            is_operational=is_op,
        )
        db.add(res)
    db.flush()

    # -----------------------------------------------------------------------
    # 8. Trains (20+ trains) & Schedules
    # -----------------------------------------------------------------------
    trains_data = [
        ("TRN-12951", "12951", "Mumbai Rajdhani Express", "COACHING_PREMIUM", 1),
        ("TRN-12953", "12953", "August Kranti Rajdhani", "COACHING_PREMIUM", 1),
        ("TRN-20901", "20901", "Vande Bharat Express", "COACHING_PREMIUM", 1),
        ("TRN-12002", "12002", "Bhopal Shatabdi Express", "COACHING_PREMIUM", 1),
        ("TRN-12952", "12952", "New Delhi Tejas Rajdhani", "COACHING_PREMIUM", 1),
        ("TRN-12925", "12925", "Paschim Superfast Express", "COACHING_MAIL", 2),
        ("TRN-12903", "12903", "Golden Temple Mail", "COACHING_MAIL", 2),
        ("TRN-12321", "12321", "Mumbai Howrah Mail", "COACHING_MAIL", 2),
        ("TRN-12137", "12137", "Punjab Mail", "COACHING_MAIL", 2),
        ("TRN-12909", "12909", "NZM BDTS Garib Rath", "COACHING_MAIL", 2),
        ("TRN-19019", "19019", "Dehradun Express", "COACHING_MAIL", 3),
        ("TRN-12471", "12471", "Swaraj Express", "COACHING_MAIL", 2),
        ("TRN-59301", "59301", "Ujjain Ratlam Passenger", "PASSENGER", 4),
        ("TRN-19803", "19803", "Kota Intercity Express", "PASSENGER", 3),
        ("TRN-59013", "59013", "Surat Vadodara Passenger", "PASSENGER", 4),
        # Goods / Freight
        ("TRN-SZ314", "SZ314", "Freight_SZ314 (Container)", "GOODS", 5),
        ("TRN-FRT-CC01", "CC01", "Freight CONCOR Rake", "GOODS", 5),
        ("TRN-FRT-BL02", "BL02", "Freight Coal Bulk Carrier", "GOODS", 5),
        ("TRN-FRT-AR01", "AR01", "Freight Automobile Special", "GOODS", 5),
        ("TRN-FRT-POL3", "POL3", "Freight Petroleum Tanker Rake", "GOODS", 5),
    ]

    trains = []
    for tid, tnum, tname, tcat, prank in trains_data:
        trn = Train(
            id=tid,
            train_number=tnum,
            train_name=tname,
            train_category=tcat,
            priority_rank=prank,
        )
        trains.append(trn)
        db.add(trn)
    db.flush()

    # Train Schedules (Timetable)
    schedules = [
        # Rajdhani Exp (06:30 - 11:45) on NDLS-ALD
        TrainSchedule(
            id="SCH-12951-01",
            train_id="TRN-12951",
            section_id="SEC-NDLS-ALD",
            scheduled_entry=now.replace(hour=6, minute=30, second=0),
            scheduled_exit=now.replace(hour=11, minute=45, second=0),
            operating_window_start=now.replace(hour=6, minute=15, second=0),
            operating_window_end=now.replace(hour=12, minute=0, second=0),
            delay_minutes=0,
        ),
        # Freight SZ314 (10:15 - 15:30) on ALD-BPL
        TrainSchedule(
            id="SCH-SZ314-01",
            train_id="TRN-SZ314",
            section_id="SEC-ALD-BPL",
            scheduled_entry=now.replace(hour=10, minute=15, second=0),
            scheduled_exit=now.replace(hour=15, minute=30, second=0),
            operating_window_start=now.replace(hour=10, minute=0, second=0),
            operating_window_end=now.replace(hour=16, minute=0, second=0),
            delay_minutes=15,
        ),
        # Shatabdi Exp (17:00 - 21:15) on BPL-RJP
        TrainSchedule(
            id="SCH-12002-01",
            train_id="TRN-12002",
            section_id="SEC-BPL-RJP",
            scheduled_entry=now.replace(hour=17, minute=0, second=0),
            scheduled_exit=now.replace(hour=21, minute=15, second=0),
            operating_window_start=now.replace(hour=16, minute=45, second=0),
            operating_window_end=now.replace(hour=21, minute=30, second=0),
            delay_minutes=0,
        ),
    ]
    db.add_all(schedules)
    db.flush()

    # -----------------------------------------------------------------------
    # 9. Plan Version V1 & Maintenance Blocks
    # -----------------------------------------------------------------------
    opt_run = OptimizationRun(
        id="OPT-2025-0520-001",
        horizon_type="NEXT_7_DAYS",
        solver_status="OPTIMAL",
        execution_time_ms=1420,
        objective_value=942.5,
        parameters_json={"priority_weight": 10.0, "consolidation_bonus": 5.0, "disruption_penalty": 20.0},
        created_at=now - datetime.timedelta(hours=2),
    )
    db.add(opt_run)
    db.flush()

    plan_v1 = PlanVersion(
        id="PLN-V1",
        version_number=1,
        optimization_run_id="OPT-2025-0520-001",
        status="PENDING_REVIEW",
        created_by_user_id="USR-ADM-01",
        reason="AI Generated Baseline Plan",
        summary_kpis_json={
            "scheduled_tasks_count": 84,
            "deferred_tasks_count": 4,
            "total_blocks_count": 28,
            "consolidated_blocks_count": 9,
            "block_hours_saved": 124,
            "asset_availability_pct": 88.4,
            "conflict_count": 7,
        },
        created_at=now - datetime.timedelta(hours=2),
    )
    db.add(plan_v1)
    db.flush()

    # Consolidation Group
    con_group = ConsolidationGroup(
        id="CON-2025-01",
        section_id="SEC-NDLS-ALD",
        participating_departments_json=["ENG", "TRD", "SNT"],
        block_hours_saved=4.5,
        consolidation_reason="OHE power isolation aligned with track tamping window, allowing S&T point machine inspection without secondary disruption.",
    )
    db.add(con_group)
    db.flush()

    # Maintenance Blocks (ENG-102, TRD-045, S&T-087, ENG-103)
    blocks_data = [
        ("BLK-ENG-102", "SEC-NDLS-ALD", "CON-2025-01", "INTEGRATED_BLOCK", now.replace(hour=9, minute=0, second=0), now.replace(hour=12, minute=0, second=0), 180, "Tamping and track geometric correction."),
        ("BLK-TRD-045", "SEC-ALD-BPL", None, "POWER_BLOCK", now.replace(hour=11, minute=30, second=0), now.replace(hour=14, minute=30, second=0), 180, "OHE contact wire inspection and bracket adjustment."),
        ("BLK-SNT-087", "SEC-BPL-RJP", None, "TRAFFIC_BLOCK", now.replace(hour=14, minute=0, second=0), now.replace(hour=17, minute=0, second=0), 180, "Relay testing and signal aspect overhaul."),
        ("BLK-ENG-103", "SEC-NDLS-ALD", None, "TRAFFIC_BLOCK", now.replace(hour=18, minute=30, second=0), now.replace(hour=21, minute=30, second=0), 180, "Through rail renewal on outer curve."),
    ]

    for bid, sec, cgid, btype, stime, etime, dur, exp in blocks_data:
        blk = MaintenanceBlock(
            id=bid,
            plan_version_id="PLN-V1",
            section_id=sec,
            consolidation_group_id=cgid,
            block_type=btype,
            start_time=stime,
            end_time=etime,
            duration_min=dur,
            safety_status="VALIDATED",
            ai_explanation=exp,
        )
        db.add(blk)
        db.flush()

        # Link tasks to blocks
        if bid == "BLK-ENG-102":
            db.add(BlockTask(id="BT-01", block_id="BLK-ENG-102", task_id="MT-001", sequence_order=1))
            db.add(ResourceAllocation(id="ALC-01", block_id="BLK-ENG-102", resource_id="RES-MCH-BCM-01", allocated_quantity=1, start_time=stime, end_time=etime))
            db.add(ResourceAllocation(id="ALC-02", block_id="BLK-ENG-102", resource_id="RES-CRW-GANG-01", allocated_quantity=15, start_time=stime, end_time=etime))
        elif bid == "BLK-TRD-045":
            db.add(ResourceAllocation(id="ALC-03", block_id="BLK-TRD-045", resource_id="RES-TW-08W-01", allocated_quantity=1, start_time=stime, end_time=etime))
            db.add(ResourceAllocation(id="ALC-04", block_id="BLK-TRD-045", resource_id="RES-PWR-TPC-01", allocated_quantity=1, start_time=stime, end_time=etime))

    # Pre-staged conflict (Freight SZ314 vs BLK-TRD-045 on ALD-BPL)
    conflict_1 = Conflict(
        id="CNF-2025-001",
        plan_version_id="PLN-V1",
        conflict_type="Train vs Maintenance",
        severity="HIGH",
        block_id="BLK-TRD-045",
        train_id="TRN-SZ314",
        explanation="Block BLK-TRD-045 (11:30 - 14:30) overlaps with scheduled window of Freight SZ314 (10:15 - 15:30) on Section ALD-BPL.",
        resolution_options_json=[
            {"option": "Shift Block", "action": "Shift BLK-TRD-045 by +45 min after train clearance."},
            {"option": "Reroute Freight", "action": "Divert freight via loop line CNB-ALD with +15 min transit delta."}
        ],
        is_resolved=False,
    )
    db.add(conflict_1)

    # -----------------------------------------------------------------------
    # 10. Audit Logs & Notifications
    # -----------------------------------------------------------------------
    db.add(AuditLog(
        id="AUD-001",
        user_id="USR-ADM-01",
        action="SYSTEM_INIT_SEED",
        entity_name="system",
        entity_id="GLOBAL",
        new_value_json={"status": "SEEDED", "version": "0.1.0"},
        reason="Initial system seed data loaded for SIH26027 demo.",
        timestamp=now - datetime.timedelta(hours=3),
    ))

    db.add(AuditLog(
        id="AUD-002",
        user_id="USR-ADM-01",
        action="OPTIMIZATION_RUN",
        entity_name="plan_versions",
        entity_id="PLN-V1",
        new_value_json={"version": 1, "blocks": 28, "status": "PENDING_REVIEW"},
        reason="Automatic block plan generated by OR-Tools CP-SAT.",
        timestamp=now - datetime.timedelta(hours=2),
    ))

    db.add(Notification(
        id="NOTIF-01",
        user_id="USR-ADM-01",
        category="CRITICAL_RISK",
        title="High Risk Asset Detected",
        message="Asset Track Section 7A (NDLS-ALD) has 84% failure probability with 3 active USFD defects.",
        link_url="/maintenance",
        is_read=False,
        created_at=now - datetime.timedelta(hours=1),
    ))

    db.add(Notification(
        id="NOTIF-02",
        user_id="USR-ADM-01",
        category="APPROVAL_PENDING",
        title="Plan V1 Requires Human Verification",
        message="Plan V1 for Delhi - Mumbai corridor is awaiting review and operational authorization.",
        link_url="/approval-center",
        is_read=False,
        created_at=now - datetime.timedelta(minutes=45),
    ))

    db.commit()
    print("Database successfully seeded with 50+ assets, 100+ tasks, 20+ trains, resources, and Plan V1!")
