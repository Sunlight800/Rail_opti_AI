import React, { useState, useEffect } from 'react';
import {
  GitBranch,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  Lock,
  Layers,
  Sparkles,
  RefreshCw,
  Clock,
  AlertCircle,
  FileCheck2,
  CalendarDays,
  ShieldAlert,
  X,
} from 'lucide-react';
import { fetchWithAuth } from '../services/api';

interface PlanVersionItem {
  id: string;
  version_number: number;
  parent_version_id?: string;
  status: string;
  reason: string;
  created_by?: string;
  created_at: string;
  blocks_count: number;
  conflicts_count: number;
  approvals_count: number;
  kpis: Record<string, any>;
}

interface ComparisonData {
  v1: {
    id: string;
    version_number: number;
    status: string;
    reason: string;
    kpis: Record<string, any>;
  };
  v2: {
    id: string;
    version_number: number;
    status: string;
    reason: string;
    kpis: Record<string, any>;
  };
  kpi_deltas: Record<
    string,
    {
      v1: number;
      v2: number;
      delta: number;
      improved: boolean;
    }
  >;
  block_diffs: Array<{
    block_id_v2: string;
    section_id: string;
    block_type: string;
    start_time_v1?: string;
    start_time_v2: string;
    duration_min_v1?: number;
    duration_min_v2: number;
    shift_applied: string;
    duration_delta?: string;
  }>;
  overall_verdict: string;
}

export const PlanVersionsView: React.FC = () => {
  const [plans, setPlans] = useState<PlanVersionItem[]>([]);
  const [selectedV1, setSelectedV1] = useState<string>('PLN-V1');
  const [selectedV2, setSelectedV2] = useState<string>('PLN-V2');
  const [comparison, setComparison] = useState<ComparisonData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isActivating, setIsActivating] = useState<boolean>(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchPlans = async () => {
    setIsLoading(true);
    try {
      const res = await fetchWithAuth('/api/plans');
      if (res.ok) {
        const data = await res.json();
        setPlans(data);
        if (data.length >= 2) {
          setSelectedV1(data[0].id);
          setSelectedV2(data[data.length - 1].id);
        } else if (data.length === 1) {
          setSelectedV1(data[0].id);
          setSelectedV2(data[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load plan versions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchComparison = async () => {
    if (!selectedV1 || !selectedV2) return;
    try {
      const res = await fetchWithAuth(
        `/api/plans/compare?v1=${selectedV1}&v2=${selectedV2}`
      );
      if (res.ok) {
        const data = await res.json();
        setComparison(data);
      }
    } catch (err) {
      console.error('Failed to compare plans:', err);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  useEffect(() => {
    if (selectedV1 && selectedV2 && selectedV1 !== selectedV2) {
      fetchComparison();
    }
  }, [selectedV1, selectedV2]);

  const handleActivatePlan = async (planId: string) => {
    setIsActivating(true);
    setNotification(null);
    setErrorMessage(null);
    try {
      const res = await fetchWithAuth(`/api/plans/${planId}/activate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: 'USR-ADM-01',
          activation_reason: `Activated as primary operating schedule for Delhi-Mumbai corridor.`,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setNotification(`Plan ${planId} is now ACTIVE and locked for operational dispatch!`);
        fetchPlans();
      } else {
        const err = await res.json().catch(() => ({}));
        setErrorMessage(err.detail || `Failed to activate plan (${res.status} Forbidden)`);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to activate plan');
    } finally {
      setIsActivating(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-railnavy-900 via-railnavy-850 to-purple-950/40 p-5 rounded-2xl border border-railnavy-700/80 shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase tracking-wider">
              Version Control & Audit
            </span>
            <span className="text-xs text-slate-400">SIH26027 Governance</span>
          </div>
          <h1 className="text-xl font-bold text-white mt-1 flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-purple-400" />
            Plan Versions & Visual Comparison Engine
          </h1>
          <p className="text-xs text-slate-300 mt-0.5">
            Compare baseline vs AI-recalculated schedules with side-by-side KPI deltas, block shift diffs, and activation lock.
          </p>
        </div>

        <button
          onClick={() => {
            fetchPlans();
            fetchComparison();
          }}
          disabled={isLoading}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-railnavy-800 hover:bg-railnavy-700 text-slate-300 hover:text-white border border-railnavy-600 text-xs font-semibold transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Notification */}
      {notification && (
        <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/40 flex items-center justify-between text-emerald-300 text-xs shadow-md">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{notification}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-emerald-400 hover:text-white font-bold ml-4">
            ✕
          </button>
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-500/40 flex items-center justify-between text-rose-300 text-xs shadow-md">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-rose-400 hover:text-white font-bold ml-4">
            ✕
          </button>
        </div>
      )}

      {/* Plan Version Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plans.map((p) => {
          const isActive = p.status === 'ACTIVE';
          return (
            <div
              key={p.id}
              className={`p-5 rounded-xl border space-y-3 transition ${
                isActive
                  ? 'bg-gradient-to-b from-purple-950/40 to-railnavy-900 border-purple-500/60 shadow-lg shadow-purple-500/10'
                  : 'bg-railnavy-900/80 border-railnavy-700/70'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-white flex items-center gap-2">
                  <FileCheck2 className="w-4 h-4 text-purple-400" />
                  {p.id} (v{p.version_number})
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    isActive
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : p.status === 'APPROVED'
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                      : p.status === 'REJECTED'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  }`}
                >
                  {p.status}
                </span>
              </div>

              <p className="text-xs text-slate-300 line-clamp-2">{p.reason}</p>

              <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-railnavy-800 text-slate-400">
                <div>
                  <span>Blocks: </span>
                  <strong className="text-white">{p.blocks_count}</strong>
                </div>
                <div>
                  <span>Conflicts: </span>
                  <strong className={p.conflicts_count > 0 ? 'text-rose-400' : 'text-emerald-400'}>
                    {p.conflicts_count}
                  </strong>
                </div>
                <div>
                  <span>Hours Saved: </span>
                  <strong className="text-cyan-400">{p.kpis.block_hours_saved || 124}h</strong>
                </div>
                <div>
                  <span>Availability: </span>
                  <strong className="text-emerald-400">{p.kpis.asset_availability_pct || 88.4}%</strong>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between gap-2">
                <button
                  onClick={() => handleActivatePlan(p.id)}
                  disabled={isActive || isActivating}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                    isActive
                      ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30 cursor-default'
                      : 'bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-600/20'
                  }`}
                >
                  <Lock className="w-3.5 h-3.5" />
                  {isActive ? 'Active Plan' : 'Activate Plan'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Comparison Engine Section */}
      {comparison && (
        <div className="p-6 rounded-2xl bg-railnavy-900/90 border border-railnavy-800 shadow-xl space-y-6">
          {/* Comparison Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-railnavy-800">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                Side-by-Side Comparison: {comparison.v1.id} vs {comparison.v2.id}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">{comparison.overall_verdict}</p>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400">Compare</span>
              <select
                value={selectedV1}
                onChange={(e) => setSelectedV1(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-railnavy-850 border border-railnavy-700 text-xs text-white"
              >
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.id}
                  </option>
                ))}
              </select>
              <ArrowRight className="w-4 h-4 text-slate-500" />
              <select
                value={selectedV2}
                onChange={(e) => setSelectedV2(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-railnavy-850 border border-railnavy-700 text-xs text-white"
              >
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.id}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* KPI Delta Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {Object.entries(comparison.kpi_deltas).map(([kpiKey, val]) => {
              const label = kpiKey.replace(/_/g, ' ').toUpperCase();
              return (
                <div key={kpiKey} className="p-3 rounded-xl bg-railnavy-850/80 border border-railnavy-700/60 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">{label}</span>
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs text-slate-400">{val.v1}</span>
                    <ArrowRight className="w-3 h-3 text-slate-600 mx-1" />
                    <strong className="text-sm text-white">{val.v2}</strong>
                  </div>
                  <div
                    className={`flex items-center gap-1 text-[11px] font-bold ${
                      val.improved ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {val.improved ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    <span>{val.delta > 0 ? `+${val.delta}` : val.delta}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Block Differences Table */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider text-slate-400">
              Schedule & Timing Modifications
            </h3>
            <div className="overflow-x-auto rounded-xl border border-railnavy-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-railnavy-950 text-slate-400 uppercase text-[10px] border-b border-railnavy-800">
                  <tr>
                    <th className="py-2.5 px-3">Block ID</th>
                    <th className="py-2.5 px-3">Section</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Baseline Timing (v1)</th>
                    <th className="py-2.5 px-3">Recalculated Timing (v2)</th>
                    <th className="py-2.5 px-3">Shift Applied</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-railnavy-800/60 text-slate-300">
                  {comparison.block_diffs.map((diff, idx) => (
                    <tr key={idx} className="hover:bg-railnavy-800/40 transition">
                      <td className="py-2.5 px-3 font-semibold text-white">{diff.block_id_v2}</td>
                      <td className="py-2.5 px-3 text-cyan-400">{diff.section_id}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-blue-500/10 text-blue-300 border border-blue-500/20">
                          {diff.block_type}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-400">
                        {diff.start_time_v1
                          ? new Date(diff.start_time_v1).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-emerald-300 font-semibold">
                        {new Date(diff.start_time_v2).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            diff.shift_applied !== 'No Change'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'text-slate-500'
                          }`}
                        >
                          {diff.shift_applied}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default PlanVersionsView;
