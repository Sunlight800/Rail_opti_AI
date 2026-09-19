export interface KPICardData {
  value: string;
  delta: string;
  is_positive: boolean;
  icon_type: string;
}

export interface ActiveCorridorData {
  name: string;
  traffic_status: string;
  active_blocks_count: number;
}

export interface CriticalTaskData {
  id: string;
  asset: string;
  section: string;
  dept: string;
  priority: string;
  risk_pct: number;
  due_date: string;
  status: string;
}

export interface ResourceCategoryData {
  category: string;
  utilization_pct: number;
}

export interface UpcomingShortageData {
  resource: string;
  deficit: number;
  time_to_shortage: string;
}

export interface ResourceAvailabilityData {
  overall_utilization_pct: number;
  categories: ResourceCategoryData[];
  upcoming_shortages: UpcomingShortageData[];
}

export interface PendingVerificationData {
  id: string;
  plan_title: string;
  region: string;
  note: string;
  time_ago: string;
  badge_type: 'warning' | 'conflict' | 'info' | 'pending';
}

export interface AssetHealthDistributionData {
  total_assets: number;
  healthy_pct: number;
  warning_pct: number;
  critical_pct: number;
  unavailable_pct: number;
}

export interface NetworkTopologyData {
  health_score: number;
  total_sections: number;
  active_blocks: number;
  conflicts: number;
}

export interface DashboardKPIsData {
  network_health_score: number;
  active_corridor: ActiveCorridorData;
  kpis: Record<string, KPICardData>;
  critical_tasks: CriticalTaskData[];
  resource_availability: ResourceAvailabilityData;
  pending_verifications: PendingVerificationData[];
  asset_health_distribution: AssetHealthDistributionData;
  network_topology: NetworkTopologyData;
}

export interface TimelineTrainData {
  train_number: string;
  train_name: string;
  category: string;
  start_time: string;
  end_time: string;
  section: string;
}

export interface TimelineBlockData {
  block_id: string;
  department: string;
  start_time: string;
  end_time: string;
  section: string;
  color: string;
}

export interface TimelineSectionData {
  section_id: string;
  name: string;
  status: string;
  has_conflict: boolean;
}

export interface DashboardTimelineData {
  date: string;
  trains: TimelineTrainData[];
  maintenance_blocks: TimelineBlockData[];
  network_sections: TimelineSectionData[];
}

export interface UserProfileData {
  id: string;
  username: string;
  email: string;
  full_name: string;
  role: string;
  department: string;
  avatar_initials: string;
  permissions?: string[];
  token?: string;
}
