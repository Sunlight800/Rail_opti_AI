"""Dashboard data models and schemas matching the Railway Operations Control Center concept."""
from pydantic import BaseModel
from typing import List, Optional


class KPICard(BaseModel):
    value: str
    delta: str
    is_positive: bool = True
    icon_type: str


class ActiveCorridorSummary(BaseModel):
    name: str
    traffic_status: str  # NORMAL, RESTRICTED, HEAVY
    active_blocks_count: int


class CriticalTaskSummary(BaseModel):
    id: str
    asset: str
    section: str
    dept: str
    priority: str  # CRITICAL, HIGH, MEDIUM, LOW
    risk_pct: int
    due_date: str
    status: str  # AI SCHEDULED, UNDER REVIEW, OPEN, COMPLETED


class ResourceCategoryUtilization(BaseModel):
    category: str
    utilization_pct: int


class UpcomingShortage(BaseModel):
    resource: str
    deficit: int
    time_to_shortage: str


class ResourceAvailabilitySummary(BaseModel):
    overall_utilization_pct: int
    categories: List[ResourceCategoryUtilization]
    upcoming_shortages: List[UpcomingShortage]


class PendingVerificationItem(BaseModel):
    id: str
    plan_title: str
    region: str
    note: str
    time_ago: str
    badge_type: str  # warning, conflict, info, pending


class AssetHealthDistribution(BaseModel):
    total_assets: int
    healthy_pct: int
    warning_pct: int
    critical_pct: int
    unavailable_pct: int


class NetworkTopologySummary(BaseModel):
    health_score: int
    total_sections: int
    active_blocks: int
    conflicts: int


class DashboardKPIsResponse(BaseModel):
    network_health_score: int
    active_corridor: ActiveCorridorSummary
    kpis: dict[str, KPICard]
    critical_tasks: List[CriticalTaskSummary]
    resource_availability: ResourceAvailabilitySummary
    pending_verifications: List[PendingVerificationItem]
    asset_health_distribution: AssetHealthDistribution
    network_topology: NetworkTopologySummary


class TimelineTrain(BaseModel):
    train_number: str
    train_name: str
    category: str
    start_time: str
    end_time: str
    section: str


class TimelineBlock(BaseModel):
    block_id: str
    department: str
    start_time: str
    end_time: str
    section: str
    color: str


class TimelineSection(BaseModel):
    section_id: str
    name: str
    status: str  # NORMAL, WARNING, CRITICAL
    has_conflict: bool = False


class DashboardTimelineResponse(BaseModel):
    date: str
    trains: List[TimelineTrain]
    maintenance_blocks: List[TimelineBlock]
    network_sections: List[TimelineSection]
