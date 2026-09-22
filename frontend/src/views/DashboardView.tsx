import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  Calendar,
  Activity,
  AlertTriangle,
  Clock,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Brain,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  RefreshCw,
  ShieldAlert,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import {
  DashboardKPIsData,
  DashboardTimelineData,
  UserProfileData,
} from '../types/dashboard';
import { fetchWithAuth } from '../services/api';

interface DashboardViewProps {
  onNavigate: (view: string) => void;
  onSelectTask?: (taskId: string) => void;
  user?: UserProfileData | null;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onSelectTask,
  user,
}) => {
  const [kpisData, setKpisData] = useState<DashboardKPIsData | null>(null);
  const [timelineData, setTimelineData] = useState<DashboardTimelineData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch live dashboard data from FastAPI backend with auth
  const fetchData = async () => {
    setLoading(true);
    try {
      const [kpisRes, timelineRes] = await Promise.all([
        fetchWithAuth('/api/dashboard/kpis'),
        fetchWithAuth('/api/dashboard/timeline'),
      ]);
      if (kpisRes.ok && timelineRes.ok) {
        setKpisData(await kpisRes.json());
        setTimelineData(await timelineRes.json());
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Asset Health Distribution Chart Data
  const assetHealthChartData = [
    { name: 'Healthy', value: kpisData?.asset_health_distribution.healthy_pct || 72, color: '#10b981' },
    { name: 'Warning', value: kpisData?.asset_health_distribution.warning_pct || 18, color: '#f59e0b' },
    { name: 'Critical', value: kpisData?.asset_health_distribution.critical_pct || 7, color: '#f43f5e' },
    { name: 'Unavailable', value: kpisData?.asset_health_distribution.unavailable_pct || 3, color: '#64748b' },
  ];

  return (
    <div className="p-6 space-y-6 max-w-[1700px] mx-auto text-left">
      {/* 1. Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-railnavy-900/90 border border-railnavy-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-full bg-gradient-to-l from-cyan-500/10 via-blue-500/5 to-transparent pointer-events-none" />

        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-white">
              {user?.role === 'ENGINEERING' ? 'Civil Engineering (Track) Operations' :
               user?.role === 'TRD' ? 'Traction Distribution (TRD) Operations' :
               user?.role === 'SNT' ? 'Signal & Telecom (S&T) Operations' :
               user?.role === 'CONTROL_OFFICE' ? 'Railway Operations Control Center (SrDOM)' :
               user?.role === 'DEMO_USER' ? 'RAILOPT AI Sandbox (Read-Only Demo)' :
               'Railway Operations Control Center'}
            </h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              SIH26027
            </span>
            {user?.role && (
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                user.role === 'ADMIN' ? 'bg-red-500/20 text-red-300 border-red-500/30' :
                user.role === 'CONTROL_OFFICE' ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' :
                user.role === 'DEMO_USER' ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' :
                'bg-amber-500/20 text-amber-300 border-amber-500/30'
              }`}>
                {user.role.replace('_', ' ')}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-300 font-medium">
            {user?.role === 'ENGINEERING' ? 'Track geometry, rail renewals, ballast tamping & civil asset health scoping' :
             user?.role === 'TRD' ? 'OHE maintenance, power blocks, 25kV traction feeding & catenary integrity' :
             user?.role === 'SNT' ? 'Electronic interlocking, point machines, track circuits & signaling clearances' :
             user?.role === 'CONTROL_OFFICE' ? 'Cross-department corridor planning, conflict resolution & block scheduling' :
             user?.role === 'DEMO_USER' ? 'Read-only exploration of AI block planning, Gantt schedules & what-if simulator' :
             'AI-Powered Automatic Maintenance Block Planning for Indian Railways'}
          </p>
          <p className="text-[11px] text-cyan-400 font-semibold tracking-wide">
            AI Plans. Human Verifies. AI Adapts. Human Approves.
          </p>
        </div>

        {/* Header Right Status Badges */}
        <div className="flex flex-wrap items-center gap-4">
          {/* Network Health Widget */}
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-railnavy-950/80 border border-railnavy-800">
            <div className="relative flex items-center justify-center">
              <div className="w-10 h-10 rounded-full border-4 border-emerald-500/30 border-t-emerald-400 flex items-center justify-center font-bold text-xs text-emerald-400">
                {kpisData?.network_health_score || 92}%
              </div>
            </div>
            <div>
              <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                Network Health
              </div>
              <div className="text-sm font-bold text-emerald-400">Good</div>
            </div>
          </div>

          {/* Active Corridor Widget */}
          <div className="px-4 py-2.5 rounded-xl bg-railnavy-950/80 border border-railnavy-800 text-left">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
              Active Corridor
            </div>
            <div className="text-sm font-bold text-white flex items-center gap-2">
              <span>{kpisData?.active_corridor.name || 'Delhi - Mumbai'}</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <div className="text-[11px] text-slate-400 flex items-center gap-2">
              <span>Traffic: <b className="text-slate-200">{kpisData?.active_corridor.traffic_status || 'Normal'}</b></span>
              <span>•</span>
              <span><b className="text-cyan-400">{kpisData?.active_corridor.active_blocks_count || 3}</b> Maintenance Blocks</span>
            </div>
          </div>

          <button
            onClick={fetchData}
            className="p-2.5 rounded-xl border border-railnavy-800 bg-railnavy-950/80 hover:bg-railnavy-800 text-slate-300 hover:text-white transition"
            title="Refresh Live Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. Six KPI Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3.5">
        {/* Critical Tasks */}
        <div className="p-4 rounded-xl bg-railnavy-900/80 border border-railnavy-800 hover:border-rose-500/40 transition group">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Critical Tasks</span>
            <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 group-hover:bg-rose-500/20 transition">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white mb-1">
            {kpisData?.kpis.critical_tasks.value || '12'}
          </div>
          <div className="text-[11px] text-rose-400 flex items-center gap-1 font-medium">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>{kpisData?.kpis.critical_tasks.delta || '+3 vs yesterday'}</span>
          </div>
        </div>

        {/* Active Blocks */}
        <div className="p-4 rounded-xl bg-railnavy-900/80 border border-railnavy-800 hover:border-blue-500/40 transition group">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Active Blocks</span>
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20 transition">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white mb-1">
            {kpisData?.kpis.active_blocks.value || '28'}
          </div>
          <div className="text-[11px] text-blue-400 flex items-center gap-1 font-medium">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>{kpisData?.kpis.active_blocks.delta || '+5 vs yesterday'}</span>
          </div>
        </div>

        {/* Asset Availability */}
        <div className="p-4 rounded-xl bg-railnavy-900/80 border border-railnavy-800 hover:border-emerald-500/40 transition group">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Asset Availability</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20 transition">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-400 mb-1">
            {kpisData?.kpis.asset_availability.value || '88%'}
          </div>
          <div className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>{kpisData?.kpis.asset_availability.delta || '+4% vs last week'}</span>
          </div>
        </div>

        {/* Conflicts */}
        <div className="p-4 rounded-xl bg-railnavy-900/80 border border-railnavy-800 hover:border-amber-500/40 transition group">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Conflicts</span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 group-hover:bg-amber-500/20 transition">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white mb-1">
            {kpisData?.kpis.conflicts.value || '7'}
          </div>
          <div className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
            <ArrowDownRight className="w-3.5 h-3.5" />
            <span>{kpisData?.kpis.conflicts.delta || '-2 vs yesterday'}</span>
          </div>
        </div>

        {/* Pending Approvals */}
        <div className="p-4 rounded-xl bg-railnavy-900/80 border border-railnavy-800 hover:border-purple-500/40 transition group cursor-pointer" onClick={() => onNavigate('approval-center')}>
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Pending Approvals</span>
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 group-hover:bg-purple-500/20 transition">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white mb-1">
            {kpisData?.kpis.pending_approvals.value || '5'}
          </div>
          <div className="text-[11px] text-purple-400 flex items-center gap-1 font-medium">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>{kpisData?.kpis.pending_approvals.delta || '+2 vs yesterday'}</span>
          </div>
        </div>

        {/* Block Hours Saved */}
        <div className="p-4 rounded-xl bg-railnavy-900/80 border border-railnavy-800 hover:border-cyan-500/40 transition group">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Block Hours Saved</span>
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 group-hover:bg-cyan-500/20 transition">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-cyan-400 mb-1">
            {kpisData?.kpis.block_hours_saved.value || '124'}
          </div>
          <div className="text-[11px] text-cyan-400 flex items-center gap-1 font-medium">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>{kpisData?.kpis.block_hours_saved.delta || '+18% vs last week'}</span>
          </div>
        </div>
      </div>

      {/* 3. Middle Grid: Timeline + Network Health + Asset Health + AI Operations */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        {/* Today's Train & Maintenance Timeline (7 cols) */}
        <div className="xl:col-span-6 bg-railnavy-900/80 border border-railnavy-800 rounded-2xl p-5 shadow">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-white">
                Today's Train & Maintenance Timeline
              </h2>
              <p className="text-[11px] text-slate-400">
                Coordinated windows across Engineering, TRD, and S&T
              </p>
            </div>
            <button
              onClick={() => onNavigate('block-planning')}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1"
            >
              View Full Schedule <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Timeline Multi-Track Canvas View */}
          <div className="space-y-4 text-xs font-mono">
            {/* Time ticks */}
            <div className="flex justify-between text-[10px] text-slate-400 border-b border-railnavy-800 pb-1 px-16">
              <span>06:00</span>
              <span>09:00</span>
              <span>12:00</span>
              <span>15:00</span>
              <span>18:00</span>
              <span>21:00</span>
              <span>24:00</span>
            </div>

            {/* Track 1: Trains */}
            <div className="flex items-center gap-3">
              <span className="w-20 text-[11px] text-slate-400 font-sans">Trains</span>
              <div className="flex-1 h-8 bg-railnavy-950/80 rounded-lg relative border border-railnavy-800/80 overflow-hidden">
                {/* Rajdhani */}
                <div
                  onClick={() => onNavigate('operations')}
                  className="absolute top-1.5 h-5 bg-gradient-to-r from-blue-600 to-cyan-500 rounded px-2 text-[10px] text-white flex items-center font-sans shadow truncate cursor-pointer hover:scale-105 transition"
                  style={{ left: '10%', width: '28%' }}
                  title="Rajdhani Exp (06:30 - 11:45) - Click to view in Operations"
                >
                  Rajdhani Exp
                </div>
                {/* Freight */}
                <div
                  onClick={() => onNavigate('operations')}
                  className="absolute top-1.5 h-5 bg-slate-700 hover:bg-slate-600 rounded px-2 text-[10px] text-slate-200 flex items-center font-sans shadow truncate cursor-pointer hover:scale-105 transition"
                  style={{ left: '38%', width: '24%' }}
                  title="Freight_SZ314 (10:15 - 15:30) - Click to view in Operations"
                >
                  Freight_SZ314
                </div>
                {/* Shatabdi */}
                <div
                  onClick={() => onNavigate('operations')}
                  className="absolute top-1.5 h-5 bg-gradient-to-r from-blue-500 to-indigo-600 rounded px-2 text-[10px] text-white flex items-center font-sans shadow truncate cursor-pointer hover:scale-105 transition"
                  style={{ left: '68%', width: '22%' }}
                  title="Shatabdi Exp (17:00 - 21:15) - Click to view in Operations"
                >
                  Shatabdi Exp
                </div>
              </div>
            </div>

            {/* Track 2: Maintenance Blocks */}
            <div className="flex items-center gap-3">
              <span className="w-20 text-[11px] text-slate-400 font-sans">Maintenance Blocks</span>
              <div className="flex-1 h-8 bg-railnavy-950/80 rounded-lg relative border border-railnavy-800/80 overflow-hidden">
                {/* ENG-102 */}
                <div
                  onClick={() => onSelectTask ? onSelectTask('MT-001') : onNavigate('block-planning')}
                  className="absolute top-1.5 h-5 bg-rose-600/90 hover:bg-rose-500 rounded px-1.5 text-[10px] text-white flex items-center font-sans shadow cursor-pointer border border-rose-400/40 hover:scale-105 transition"
                  style={{ left: '18%', width: '16%' }}
                  title="ENG-102 (Tamping) [09:00 - 12:00] - Click to inspect Task & Block"
                >
                  ENG-102
                </div>
                {/* TRD-045 */}
                <div
                  onClick={() => onSelectTask ? onSelectTask('MT-003') : onNavigate('block-planning')}
                  className="absolute top-1.5 h-5 bg-cyan-600/90 hover:bg-cyan-500 rounded px-1.5 text-[10px] text-white flex items-center font-sans shadow cursor-pointer border border-cyan-400/40 hover:scale-105 transition"
                  style={{ left: '35%', width: '16%' }}
                  title="TRD-045 (OHE) [11:30 - 14:30] - Click to inspect Task & Block"
                >
                  TRD-045
                </div>
                {/* S&T-087 */}
                <div
                  onClick={() => onSelectTask ? onSelectTask('MT-002') : onNavigate('block-planning')}
                  className="absolute top-1.5 h-5 bg-emerald-600/90 hover:bg-emerald-500 rounded px-1.5 text-[10px] text-white flex items-center font-sans shadow cursor-pointer border border-emerald-400/40 hover:scale-105 transition"
                  style={{ left: '55%', width: '16%' }}
                  title="S&T-087 (Signals) [14:00 - 17:00] - Click to inspect Task & Block"
                >
                  S&T-087
                </div>
                {/* ENG-103 */}
                <div
                  onClick={() => onSelectTask ? onSelectTask('MT-004') : onNavigate('block-planning')}
                  className="absolute top-1.5 h-5 bg-amber-600/90 hover:bg-amber-500 rounded px-1.5 text-[10px] text-white flex items-center font-sans shadow cursor-pointer border border-amber-400/40 hover:scale-105 transition"
                  style={{ left: '76%', width: '16%' }}
                  title="ENG-103 (Rail Renewal) [18:30 - 21:30] - Click to inspect Task & Block"
                >
                  ENG-103
                </div>
              </div>
            </div>

            {/* Track 3: Network Sections Status */}
            <div className="flex items-center gap-3">
              <span className="w-20 text-[11px] text-slate-400 font-sans">Network Sections</span>
              <div className="flex-1 h-7 bg-railnavy-950/80 rounded-lg relative border border-railnavy-800/80 flex items-center px-2 gap-3 text-[10px] font-sans">
                <span
                  onClick={() => onNavigate('operations')}
                  className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1 cursor-pointer hover:bg-amber-500/30 transition"
                  title="Click to view section in Operations"
                >
                  <AlertTriangle className="w-3 h-3" /> NDLS - ALD
                </span>
                <span
                  onClick={() => onNavigate('operations')}
                  className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1 cursor-pointer hover:bg-amber-500/30 transition"
                  title="Click to view section in Operations"
                >
                  <AlertTriangle className="w-3 h-3" /> ALD - BPL
                </span>
                <span
                  onClick={() => onNavigate('operations')}
                  className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 cursor-pointer hover:bg-emerald-500/30 transition"
                  title="Click to view section in Operations"
                >
                  <CheckCircle2 className="w-3 h-3" /> BPL - RJP
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Network Health Topological Widget (2 cols) */}
        <div className="xl:col-span-2 bg-railnavy-900/80 border border-railnavy-800 rounded-2xl p-4 shadow flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white">Network Health</span>
            <span className="text-[10px] text-slate-400 font-mono">142 Sections</span>
          </div>

          {/* Interactive Network Graph Schematic */}
          <div className="h-32 relative flex items-center justify-center my-2">
            <svg className="w-full h-full" viewBox="0 0 200 120">
              {/* Edges */}
              <line x1="30" y1="60" x2="80" y2="30" stroke="#3b82f6" strokeWidth="2" strokeDasharray="3,3" />
              <line x1="30" y1="60" x2="80" y2="90" stroke="#10b981" strokeWidth="2" />
              <line x1="80" y1="30" x2="140" y2="40" stroke="#f59e0b" strokeWidth="2" />
              <line x1="80" y1="90" x2="140" y2="80" stroke="#10b981" strokeWidth="2" />
              <line x1="140" y1="40" x2="180" y2="60" stroke="#f43f5e" strokeWidth="2" />
              <line x1="140" y1="80" x2="180" y2="60" stroke="#10b981" strokeWidth="2" />

              {/* Nodes */}
              <circle cx="30" cy="60" r="7" fill="#3b82f6" />
              <circle cx="80" cy="30" r="7" fill="#f59e0b" />
              <circle cx="80" cy="90" r="7" fill="#10b981" />
              <circle cx="140" cy="40" r="7" fill="#f43f5e" />
              <circle cx="140" cy="80" r="7" fill="#10b981" />
              <circle cx="180" cy="60" r="7" fill="#10b981" />
            </svg>
          </div>

          <div className="grid grid-cols-2 gap-1.5 text-[10px] text-slate-300">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" /> Normal
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400" /> Warning
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-400" /> Critical
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400" /> Maint.
            </div>
          </div>
        </div>

        {/* Asset Health Distribution Donut (2 cols) */}
        <div className="xl:col-span-2 bg-railnavy-900/80 border border-railnavy-800 rounded-2xl p-4 shadow flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white">Asset Health</span>
            <span className="text-[10px] text-slate-400 font-mono">523 Assets</span>
          </div>

          <div className="h-28 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={assetHealthChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={30}
                  outerRadius={45}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {assetHealthChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute text-center">
              <div className="text-sm font-bold text-white">523</div>
              <div className="text-[9px] text-slate-400 uppercase">Total</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-300">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Healthy</span>
              <span className="text-emerald-400 font-semibold">72%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Warning</span>
              <span className="text-amber-400 font-semibold">18%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Critical</span>
              <span className="text-rose-400 font-semibold">7%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Unavail.</span>
              <span className="text-slate-400 font-semibold">3%</span>
            </div>
          </div>
        </div>

        {/* AI Operations Intelligence Card (2 cols) */}
        <div className="xl:col-span-2 bg-gradient-to-b from-purple-950/50 to-railnavy-900/90 border border-purple-800/40 rounded-2xl p-4 shadow flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-purple-600/10 rounded-full blur-xl pointer-events-none" />

          <div>
            <div className="flex items-center gap-2 text-purple-400 mb-2">
              <Brain className="w-4 h-4 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider">AI Intelligence</span>
            </div>

            <h3 className="text-xs font-bold text-rose-400 mb-1">
              High Risk Asset Detected
            </h3>
            <p className="text-[11px] text-slate-300 leading-snug">
              Asset: <b className="text-white">Track Section 7A</b><br />
              Failure Probability: <b className="text-rose-400">84%</b><br />
              Priority: <span className="px-1 rounded bg-rose-500/20 text-rose-400 font-bold text-[10px]">CRITICAL</span>
            </p>
          </div>

          <button
            onClick={() => onNavigate('ai-intelligence')}
            className="w-full mt-3 py-1.5 rounded-lg bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/40 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition"
          >
            View Details <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* 4. Bottom Grid: Critical Tasks Table + Resource Availability + Pending Verification */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        {/* Critical Maintenance Tasks (6 cols) */}
        <div className="xl:col-span-6 bg-railnavy-900/80 border border-railnavy-800 rounded-2xl p-5 shadow">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-white">Critical Maintenance Tasks</h2>
              <p className="text-[11px] text-slate-400">Ranked by 6-factor priority and safety risk</p>
            </div>
            <button
              onClick={() => onNavigate('maintenance')}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1"
            >
              View All <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[10px] uppercase text-slate-400 border-b border-railnavy-800 font-semibold">
                <tr>
                  <th className="pb-2">ID</th>
                  <th className="pb-2">Asset</th>
                  <th className="pb-2">Section</th>
                  <th className="pb-2">Dept</th>
                  <th className="pb-2">Priority</th>
                  <th className="pb-2">Risk</th>
                  <th className="pb-2">Due Date</th>
                  <th className="pb-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-railnavy-800/60 font-mono text-[11px]">
                {kpisData?.critical_tasks.map((task) => (
                  <tr
                    key={task.id}
                    onClick={() => onSelectTask?.(task.id)}
                    className="hover:bg-railnavy-800/40 cursor-pointer transition"
                  >
                    <td className="py-2.5 font-bold text-cyan-400">{task.id}</td>
                    <td className="py-2.5 font-sans text-slate-200">{task.asset}</td>
                    <td className="py-2.5 text-slate-400">{task.section}</td>
                    <td className="py-2.5">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        task.dept === 'ENG' ? 'bg-rose-500/20 text-rose-300' :
                        task.dept === 'TRD' ? 'bg-cyan-500/20 text-cyan-300' : 'bg-emerald-500/20 text-emerald-300'
                      }`}>
                        {task.dept}
                      </span>
                    </td>
                    <td className="py-2.5">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        task.priority === 'CRITICAL' ? 'bg-rose-500 text-white' :
                        task.priority === 'HIGH' ? 'bg-amber-500 text-black' : 'bg-blue-500 text-white'
                      }`}>
                        {task.priority}
                      </span>
                    </td>
                    <td className="py-2.5 text-rose-400 font-semibold">{task.risk_pct}%</td>
                    <td className="py-2.5 text-slate-400">{task.due_date}</td>
                    <td className="py-2.5 font-sans">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-railnavy-800 text-slate-300 border border-railnavy-700">
                        {task.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Resource Availability (3 cols) */}
        <div className="xl:col-span-3 bg-railnavy-900/80 border border-railnavy-800 rounded-2xl p-5 shadow flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-sm font-bold text-white">Resource Availability</h2>
                <p className="text-[11px] text-slate-400">Overall Utilization: <b>76%</b></p>
              </div>
              <button onClick={() => onNavigate('resources')} className="text-xs text-cyan-400 hover:text-cyan-300">
                View All
              </button>
            </div>

            {/* Category Bars */}
            <div className="space-y-2 mb-4">
              {kpisData?.resource_availability.categories.map((cat) => (
                <div key={cat.category} className="space-y-1">
                  <div className="flex justify-between text-[11px] text-slate-300 font-medium">
                    <span>{cat.category}</span>
                    <span className="text-cyan-400 font-mono">{cat.utilization_pct}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-railnavy-950 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        cat.utilization_pct > 80 ? 'bg-rose-500' :
                        cat.utilization_pct > 65 ? 'bg-cyan-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${cat.utilization_pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming Shortages */}
          <div className="p-3 rounded-xl bg-railnavy-950/90 border border-railnavy-800 space-y-1.5 text-[11px]">
            <div className="text-[10px] text-rose-400 uppercase font-bold tracking-wider flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> Upcoming Shortages
            </div>
            {kpisData?.resource_availability.upcoming_shortages.map((s, idx) => (
              <div key={idx} className="flex justify-between text-slate-300">
                <span>{s.resource}</span>
                <span className="text-rose-400 font-mono font-semibold">{s.time_to_shortage}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Human Verification (3 cols) */}
        <div className="xl:col-span-3 bg-railnavy-900/80 border border-railnavy-800 rounded-2xl p-5 shadow flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-sm font-bold text-white">Pending Human Verification</h2>
                <p className="text-[11px] text-slate-400">Strict HITL Authorization Queue</p>
              </div>
              <button onClick={() => onNavigate('approval-center')} className="text-xs text-cyan-400 hover:text-cyan-300">
                View All
              </button>
            </div>

            <div className="space-y-2">
              {kpisData?.pending_verifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => onNavigate('approval-center')}
                  className="p-2.5 rounded-xl bg-railnavy-950/70 border border-railnavy-800 hover:border-cyan-500/40 cursor-pointer transition text-left"
                >
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-200">
                    <span>{item.plan_title}</span>
                    <span className="text-[10px] font-mono text-slate-400">{item.time_ago}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{item.note}</div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => onNavigate('approval-center')}
            className="w-full mt-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition shadow-lg shadow-blue-600/20"
          >
            Review Pending Plans
          </button>
        </div>
      </div>
    </div>
  );
};
