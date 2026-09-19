"""Dashboard endpoints providing metrics, active corridor status, and timeline data."""
from fastapi import APIRouter
from rail_opti.models.dashboard import (
    DashboardKPIsResponse,
    DashboardTimelineResponse,
    KPICard,
    ActiveCorridorSummary,
    CriticalTaskSummary,
    ResourceAvailabilitySummary,
    ResourceCategoryUtilization,
    UpcomingShortage,
    PendingVerificationItem,
    AssetHealthDistribution,
    NetworkTopologySummary,
    TimelineTrain,
    TimelineBlock,
    TimelineSection,
)

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/kpis", response_model=DashboardKPIsResponse)
def get_dashboard_kpis():
    """Return all summary KPIs, critical tasks, resource metrics, and verification queues matching the control center layout."""
    return DashboardKPIsResponse(
        network_health_score=92,
        active_corridor=ActiveCorridorSummary(
            name="Delhi - Mumbai",
            traffic_status="Normal",
            active_blocks_count=3,
        ),
        kpis={
            "critical_tasks": KPICard(value="12", delta="+3 vs yesterday", is_positive=False, icon_type="alert-circle"),
            "active_blocks": KPICard(value="28", delta="+5 vs yesterday", is_positive=True, icon_type="calendar"),
            "asset_availability": KPICard(value="88%", delta="+4% vs last week", is_positive=True, icon_type="activity"),
            "conflicts": KPICard(value="7", delta="-2 vs yesterday", is_positive=True, icon_type="alert-triangle"),
            "pending_approvals": KPICard(value="5", delta="+2 vs yesterday", is_positive=False, icon_type="clock"),
            "block_hours_saved": KPICard(value="124", delta="+18% vs last week", is_positive=True, icon_type="zap"),
        },
        critical_tasks=[
            CriticalTaskSummary(id="MT-001", asset="Track 7A", section="NDLS-ALD", dept="ENG", priority="CRITICAL", risk_pct=84, due_date="2025-05-20", status="AI SCHEDULED"),
            CriticalTaskSummary(id="MT-002", asset="OHE", section="ALD-BPL", dept="TRD", priority="HIGH", risk_pct=67, due_date="2025-05-21", status="UNDER REVIEW"),
            CriticalTaskSummary(id="MT-003", asset="Signal", section="BPL-RJP", dept="S&T", priority="HIGH", risk_pct=62, due_date="2025-05-22", status="OPEN"),
            CriticalTaskSummary(id="MT-004", asset="Track 9C", section="RJP-JHS", dept="ENG", priority="MEDIUM", risk_pct=48, due_date="2025-05-25", status="OPEN"),
            CriticalTaskSummary(id="MT-005", asset="OHE", section="JHS-PTA", dept="TRD", priority="MEDIUM", risk_pct=45, due_date="2025-05-26", status="OPEN"),
        ],
        resource_availability=ResourceAvailabilitySummary(
            overall_utilization_pct=76,
            categories=[
                ResourceCategoryUtilization(category="Manpower", utilization_pct=82),
                ResourceCategoryUtilization(category="Machines", utilization_pct=68),
                ResourceCategoryUtilization(category="Vehicles", utilization_pct=71),
                ResourceCategoryUtilization(category="Materials", utilization_pct=59),
                ResourceCategoryUtilization(category="Safety Equip.", utilization_pct=93),
            ],
            upcoming_shortages=[
                UpcomingShortage(resource="Track Machine (1)", deficit=1, time_to_shortage="2h"),
                UpcomingShortage(resource="Maintenance Vehicle (1)", deficit=1, time_to_shortage="4h"),
                UpcomingShortage(resource="Specialist (2)", deficit=2, time_to_shortage="8h"),
                UpcomingShortage(resource="Rails (50)", deficit=50, time_to_shortage="12h"),
            ],
        ),
        pending_verifications=[
            PendingVerificationItem(id="PV-01", plan_title="Plan V2 - Delhi Region", region="Delhi", note="Requires resource validation", time_ago="2h ago", badge_type="warning"),
            PendingVerificationItem(id="PV-02", plan_title="Plan V1 - Mumbai Region", region="Mumbai", note="Conflict resolution needed", time_ago="4h ago", badge_type="conflict"),
            PendingVerificationItem(id="PV-03", plan_title="Plan V3 - Central Region", region="Central", note="Approval required", time_ago="6h ago", badge_type="info"),
            PendingVerificationItem(id="PV-04", plan_title="Plan V2 - East Region", region="East", note="Modification requested", time_ago="8h ago", badge_type="pending"),
            PendingVerificationItem(id="PV-05", plan_title="Plan V1 - South Region", region="South", note="Rejection feedback pending", time_ago="12h ago", badge_type="warning"),
        ],
        asset_health_distribution=AssetHealthDistribution(
            total_assets=523,
            healthy_pct=72,
            warning_pct=18,
            critical_pct=7,
            unavailable_pct=3,
        ),
        network_topology=NetworkTopologySummary(
            health_score=92,
            total_sections=142,
            active_blocks=28,
            conflicts=7,
        ),
    )


@router.get("/timeline", response_model=DashboardTimelineResponse)
def get_dashboard_timeline():
    """Return today's multi-track train and maintenance timeline."""
    return DashboardTimelineResponse(
        date="2025-05-20",
        trains=[
            TimelineTrain(train_number="12951", train_name="Rajdhani Exp", category="Coaching Premium", start_time="06:30", end_time="11:45", section="NDLS-ALD"),
            TimelineTrain(train_number="SZ314", train_name="Freight_SZ314", category="Goods", start_time="10:15", end_time="15:30", section="ALD-BPL"),
            TimelineTrain(train_number="12002", train_name="Shatabdi Exp", category="Coaching Premium", start_time="17:00", end_time="21:15", section="BPL-RJP"),
        ],
        maintenance_blocks=[
            TimelineBlock(block_id="ENG-102", department="ENG", start_time="09:00", end_time="12:00", section="NDLS-ALD", color="#f43f5e"),
            TimelineBlock(block_id="TRD-045", department="TRD", start_time="11:30", end_time="14:30", section="ALD-BPL", color="#06b6d4"),
            TimelineBlock(block_id="S&T-087", department="S&T", start_time="14:00", end_time="17:00", section="BPL-RJP", color="#10b981"),
            TimelineBlock(block_id="ENG-103", department="ENG", start_time="18:30", end_time="21:30", section="NDLS-ALD", color="#f59e0b"),
        ],
        network_sections=[
            TimelineSection(section_id="SEC-NDLS-ALD", name="NDLS - ALD", status="WARNING", has_conflict=True),
            TimelineSection(section_id="SEC-ALD-BPL", name="ALD - BPL", status="WARNING", has_conflict=True),
            TimelineSection(section_id="SEC-BPL-RJP", name="BPL - RJP", status="NORMAL", has_conflict=False),
        ],
    )
