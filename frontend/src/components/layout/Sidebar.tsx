import React from 'react';
import {
  LayoutDashboard,
  Database,
  Wrench,
  BrainCircuit,
  Award,
  Activity,
  CalendarDays,
  Layers,
  AlertTriangle,
  GitMerge,
  Sliders,
  CheckSquare,
  BarChart3,
  FileText,
  History,
  GitBranch,
  Settings,
  Info,
} from 'lucide-react';

export type NavigationItem =
  | 'dashboard'
  | 'data-integration'
  | 'maintenance'
  | 'ai-intelligence'
  | 'priority-engine'
  | 'operations'
  | 'block-planning'
  | 'resources'
  | 'conflict-detection'
  | 'consolidation'
  | 'what-if'
  | 'approval-center'
  | 'analytics'
  | 'reports'
  | 'audit-log'
  | 'plan-versions'
  | 'settings';

export const ROLE_ALLOWED_VIEWS: Record<string, NavigationItem[]> = {
  ADMIN: [
    'dashboard',
    'data-integration',
    'maintenance',
    'ai-intelligence',
    'priority-engine',
    'operations',
    'block-planning',
    'resources',
    'conflict-detection',
    'consolidation',
    'what-if',
    'approval-center',
    'analytics',
    'reports',
    'audit-log',
    'plan-versions',
    'settings',
  ],
  CONTROL_OFFICE: [
    'dashboard',
    'maintenance',
    'ai-intelligence',
    'priority-engine',
    'operations',
    'block-planning',
    'resources',
    'conflict-detection',
    'consolidation',
    'what-if',
    'approval-center',
    'analytics',
    'reports',
    'plan-versions',
  ],
  ENGINEERING: [
    'dashboard',
    'maintenance',
    'ai-intelligence',
    'priority-engine',
    'resources',
    'conflict-detection',
    'consolidation',
    'approval-center',
    'reports',
  ],
  TRD: [
    'dashboard',
    'maintenance',
    'ai-intelligence',
    'priority-engine',
    'resources',
    'conflict-detection',
    'consolidation',
    'approval-center',
    'reports',
  ],
  SNT: [
    'dashboard',
    'maintenance',
    'ai-intelligence',
    'priority-engine',
    'resources',
    'conflict-detection',
    'consolidation',
    'approval-center',
    'reports',
  ],
  DEMO_USER: [
    'dashboard',
    'ai-intelligence',
    'priority-engine',
    'block-planning',
    'what-if',
    'analytics',
    'reports',
  ],
};

const ROLE_BADGE_INFO: Record<string, { label: string; color: string; desc: string }> = {
  ADMIN: { label: 'Admin', color: 'bg-red-500/20 text-red-300 border-red-500/30', desc: 'Full System Access' },
  CONTROL_OFFICE: { label: 'Control Office', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30', desc: 'Cross-Dept Operations' },
  ENGINEERING: { label: 'Civil Track', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30', desc: 'ENG Department Scoped' },
  TRD: { label: 'TRD Electrical', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30', desc: 'OHE Department Scoped' },
  SNT: { label: 'Signal & Telecom', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', desc: 'S&T Department Scoped' },
  DEMO_USER: { label: 'Demo Sandbox', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30', desc: 'Read-Only Access' },
};

interface SidebarProps {
  currentView: NavigationItem;
  onSelectView: (view: NavigationItem) => void;
  pendingApprovalsCount?: number;
  userRole?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onSelectView,
  pendingApprovalsCount = 3,
  userRole = 'ADMIN',
}) => {
  const normalizedRole = userRole.toUpperCase();
  const allowedViews = ROLE_ALLOWED_VIEWS[normalizedRole] || ROLE_ALLOWED_VIEWS['DEMO_USER'];
  const badgeInfo = ROLE_BADGE_INFO[normalizedRole] || ROLE_BADGE_INFO['DEMO_USER'];

  const allMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'data-integration', label: 'Data Integration', icon: Database },
    { id: 'maintenance', label: 'Maintenance', icon: Wrench },
    { id: 'ai-intelligence', label: 'AI Intelligence', icon: BrainCircuit },
    { id: 'priority-engine', label: 'Priority Engine', icon: Award },
    { id: 'operations', label: 'Operations', icon: Activity },
    { id: 'block-planning', label: 'Block Planning', icon: CalendarDays },
    { id: 'resources', label: 'Resources', icon: Layers },
    { id: 'conflict-detection', label: 'Conflict Detection', icon: AlertTriangle },
    { id: 'consolidation', label: 'Consolidation', icon: GitMerge },
    { id: 'what-if', label: 'What-If Simulator', icon: Sliders },
    {
      id: 'approval-center',
      label: 'Approval Center',
      icon: CheckSquare,
      badge: pendingApprovalsCount,
      badgeColor: 'bg-rose-500',
    },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'audit-log', label: 'Audit Log', icon: History },
    { id: 'plan-versions', label: 'Plan Versions', icon: GitBranch },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const menuItems = allMenuItems.filter((item) => allowedViews.includes(item.id as NavigationItem));

  return (
    <aside className="w-64 bg-railnavy-900 border-r border-railnavy-800 flex flex-col justify-between h-[calc(100vh-4rem)] sticky top-16 select-none">
      {/* Role Scoping Header */}
      <div className="py-2.5 px-3 border-b border-railnavy-800/80 bg-railnavy-950/40">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Access Scope</span>
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${badgeInfo.color}`}>
            {badgeInfo.label}
          </span>
        </div>
        <div className="text-[10px] text-slate-400 mt-1 truncate">
          {badgeInfo.desc}
        </div>
      </div>

      {/* Navigation List */}
      <div className="py-2 px-3 space-y-0.5 overflow-y-auto flex-1 max-h-[calc(100vh-14rem)]">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectView(item.id as NavigationItem)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-blue-600/90 to-cyan-600/90 text-white shadow-md shadow-cyan-600/20 font-semibold'
                  : 'text-slate-300 hover:bg-railnavy-800/60 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && item.badge > 0 && (
                <span
                  className={`text-[10px] font-bold text-white px-1.5 py-0.2 rounded-full ${
                    item.badgeColor || 'bg-cyan-500'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Persistent Disclaimer Badge at Bottom */}
      <div className="p-3 border-t border-railnavy-800 bg-railnavy-950/40">
        <div className="p-2.5 rounded-lg border border-railnavy-700/60 bg-railnavy-900/80 text-left">
          <div className="flex items-center gap-1.5 text-emerald-400 text-[11px] font-semibold mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
            DEMO / SIMULATED DATA
          </div>
          <p className="text-[10px] text-slate-400 leading-tight">
            Not connected to live Indian Railways systems. Built for SIH26027.
          </p>
        </div>
      </div>
    </aside>
  );
};
