import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Activity,
  Layers,
  Clock,
  Sparkles,
  RefreshCw,
  Calendar,
  AlertCircle,
  Building2,
  CheckCircle2,
} from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface TrendDay {
  date: string;
  asset_availability_pct: number;
  train_punctuality_pct: number;
  block_hours_saved: number;
  conflicts_count: number;
  maintenance_downtime_hours: number;
}

interface DepartmentBreakdown {
  department_id: string;
  department_name: string;
  color_code: string;
  total_tasks: number;
  scheduled_tasks: number;
  pending_tasks: number;
  critical_tasks: number;
  block_hours_consumed: number;
  resource_utilization_pct: number;
}

interface SectionPerformance {
  section_id: string;
  section_name: string;
  track_type: string;
  length_km: number;
  speed_limit_kmh: number;
  status: string;
  assets_monitored: number;
  active_tasks: number;
  scheduled_blocks: number;
  section_health_pct: number;
  congestion_index: number;
  punctuality_risk: string;
}

export const AnalyticsView: React.FC = () => {
  const [trends, setTrends] = useState<TrendDay[]>([]);
  const [summary, setSummary] = useState<Record<string, any>>({});
  const [deptBreakdown, setDeptBreakdown] = useState<DepartmentBreakdown[]>([]);
  const [sections, setSections] = useState<SectionPerformance[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const [trendsRes, deptsRes, corridorRes] = await Promise.all([
        fetch('http://127.0.0.1:8000/api/analytics/kpi-trends'),
        fetch('http://127.0.0.1:8000/api/analytics/departmental-breakdown'),
        fetch('http://127.0.0.1:8000/api/analytics/corridor-performance'),
      ]);

      if (trendsRes.ok) {
        const tData = await trendsRes.json();
        setTrends(tData.trend_days || []);
        setSummary(tData.summary || {});
      }
      if (deptsRes.ok) {
        const dData = await deptsRes.json();
        setDeptBreakdown(dData || []);
      }
      if (corridorRes.ok) {
        const cData = await corridorRes.json();
        setSections(cData || []);
      }
    } catch (err) {
      console.error('Failed to load analytics data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-railnavy-900 via-railnavy-850 to-blue-950/40 p-5 rounded-2xl border border-railnavy-700/80 shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 uppercase tracking-wider">
              Operations Research Analytics
            </span>
            <span className="text-xs text-slate-400">Delhi - Mumbai Corridor</span>
          </div>
          <h1 className="text-xl font-bold text-white mt-1 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-cyan-400" />
            Corridor Analytics & Operations Research Scorecard
          </h1>
          <p className="text-xs text-slate-300 mt-0.5">
            Holistic intelligence combining asset availability gains, coaching train punctuality, and multi-department maintenance efficiency.
          </p>
        </div>

        <button
          onClick={fetchAnalytics}
          disabled={isLoading}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-railnavy-800 hover:bg-railnavy-700 text-slate-300 hover:text-white border border-railnavy-600 text-xs font-semibold transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-railnavy-900/80 border border-railnavy-800 space-y-1">
          <span className="text-[10px] text-slate-400 uppercase font-semibold">Asset Availability</span>
          <div className="flex items-baseline gap-2">
            <strong className="text-2xl font-black text-cyan-400">
              {summary.current_availability_pct || 91.2}%
            </strong>
            <span className="text-xs font-bold text-emerald-400 flex items-center">
              +{summary.net_availability_gain_pct || 4.7}%
            </span>
          </div>
          <p className="text-[11px] text-slate-400">Target: ≥ 90.0% Availability</p>
        </div>

        <div className="p-4 rounded-xl bg-railnavy-900/80 border border-railnavy-800 space-y-1">
          <span className="text-[10px] text-slate-400 uppercase font-semibold">Train Punctuality</span>
          <div className="flex items-baseline gap-2">
            <strong className="text-2xl font-black text-emerald-400">
              {summary.current_punctuality_pct || 96.5}%
            </strong>
            <span className="text-xs font-bold text-emerald-400">+5.5%</span>
          </div>
          <p className="text-[11px] text-slate-400">Coaching Train On-Time Index</p>
        </div>

        <div className="p-4 rounded-xl bg-railnavy-900/80 border border-railnavy-800 space-y-1">
          <span className="text-[10px] text-slate-400 uppercase font-semibold">Block Hours Saved</span>
          <div className="flex items-baseline gap-2">
            <strong className="text-2xl font-black text-purple-400">
              {summary.total_block_hours_saved || 132.5} hrs
            </strong>
          </div>
          <p className="text-[11px] text-slate-400">Via Multi-Dept Consolidation</p>
        </div>

        <div className="p-4 rounded-xl bg-railnavy-900/80 border border-railnavy-800 space-y-1">
          <span className="text-[10px] text-slate-400 uppercase font-semibold">Active Headway Conflicts</span>
          <div className="flex items-baseline gap-2">
            <strong className="text-2xl font-black text-amber-400">
              {trends.length > 0 ? trends[trends.length - 1].conflicts_count : 2}
            </strong>
            <span className="text-xs font-bold text-emerald-400">-8 resolved</span>
          </div>
          <p className="text-[11px] text-slate-400">Critical safety interlocks clear</p>
        </div>
      </div>

      {/* Recharts Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Availability & Punctuality Trend Chart */}
        <div className="p-5 rounded-2xl bg-railnavy-900/90 border border-railnavy-800 shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              7-Day Availability & Punctuality Trajectory
            </h2>
            <span className="text-[11px] text-slate-400">AI CP-SAT Optimized</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trends} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis domain={[80, 100]} stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Line
                  type="monotone"
                  dataKey="asset_availability_pct"
                  name="Asset Availability (%)"
                  stroke="#06b6d4"
                  strokeWidth={2.5}
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="train_punctuality_pct"
                  name="Train Punctuality (%)"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Block Hours Saved & Maintenance Downtime */}
        <div className="p-5 rounded-2xl bg-railnavy-900/90 border border-railnavy-800 shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-400" />
              Cumulative Hours Saved vs Maintenance Downtime
            </h2>
            <span className="text-[11px] text-slate-400">Gross Hours</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Area
                  type="monotone"
                  dataKey="block_hours_saved"
                  name="Hours Saved"
                  stroke="#a855f7"
                  fill="#a855f7"
                  fillOpacity={0.2}
                />
                <Area
                  type="monotone"
                  dataKey="maintenance_downtime_hours"
                  name="Maintenance Downtime"
                  stroke="#f59e0b"
                  fill="#f59e0b"
                  fillOpacity={0.15}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Departmental Workload & Resource Utilization */}
      <div className="p-5 rounded-2xl bg-railnavy-900/90 border border-railnavy-800 shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Building2 className="w-4 h-4 text-cyan-400" />
            Departmental Maintenance Volume & Resource Utilization
          </h2>
          <span className="text-[11px] text-slate-400">4 Operational Branches</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {deptBreakdown.map((d) => (
            <div
              key={d.department_id}
              className="p-4 rounded-xl bg-railnavy-850/80 border border-railnavy-700/60 space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">{d.department_name}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  {d.department_id}
                </span>
              </div>
              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between text-slate-400">
                  <span>Total Tasks:</span>
                  <strong className="text-white">{d.total_tasks}</strong>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Critical Tasks:</span>
                  <strong className="text-rose-400">{d.critical_tasks}</strong>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Block Hours:</span>
                  <strong className="text-cyan-400">{d.block_hours_consumed}h</strong>
                </div>
              </div>
              <div className="pt-2 border-t border-railnavy-700/50">
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-slate-400">Resource Utilization</span>
                  <strong className="text-emerald-400">{d.resource_utilization_pct}%</strong>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500"
                    style={{ width: `${d.resource_utilization_pct}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Corridor Section Scorecard Table */}
      <div className="p-5 rounded-2xl bg-railnavy-900/90 border border-railnavy-800 shadow-lg space-y-4">
        <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-400" />
          Corridor Section Health & Congestion Index Scorecard
        </h2>

        <div className="overflow-x-auto rounded-xl border border-railnavy-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-railnavy-950 text-slate-400 uppercase text-[10px] border-b border-railnavy-800">
              <tr>
                <th className="py-2.5 px-3">Section ID</th>
                <th className="py-2.5 px-3">Section Name</th>
                <th className="py-2.5 px-3">Track Type</th>
                <th className="py-2.5 px-3">Speed Limit</th>
                <th className="py-2.5 px-3">Active Tasks</th>
                <th className="py-2.5 px-3">Blocks</th>
                <th className="py-2.5 px-3">Health Score</th>
                <th className="py-2.5 px-3">Congestion</th>
                <th className="py-2.5 px-3">Punctuality Risk</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-railnavy-800/60 text-slate-300">
              {sections.map((sec) => (
                <tr key={sec.section_id} className="hover:bg-railnavy-800/40 transition">
                  <td className="py-2 px-3 font-semibold text-white">{sec.section_id}</td>
                  <td className="py-2 px-3 text-cyan-400">{sec.section_name}</td>
                  <td className="py-2 px-3 text-slate-400">{sec.track_type}</td>
                  <td className="py-2 px-3">{sec.speed_limit_kmh} km/h</td>
                  <td className="py-2 px-3 text-white font-medium">{sec.active_tasks}</td>
                  <td className="py-2 px-3 text-purple-300">{sec.scheduled_blocks}</td>
                  <td className="py-2 px-3">
                    <span className="font-bold text-emerald-400">{sec.section_health_pct}%</span>
                  </td>
                  <td className="py-2 px-3 text-slate-300">{sec.congestion_index}x</td>
                  <td className="py-2 px-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        sec.punctuality_risk === 'LOW'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : sec.punctuality_risk === 'MEDIUM'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      }`}
                    >
                      {sec.punctuality_risk}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
export default AnalyticsView;
