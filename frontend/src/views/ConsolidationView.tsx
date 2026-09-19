import React, { useState, useEffect } from 'react';
import {
  GitMerge,
  Sparkles,
  Clock,
  TrendingUp,
  CheckCircle2,
  Wrench,
  Zap,
  Radio,
  Activity,
  ArrowRight,
  Shield,
  Layers,
  RefreshCw,
} from 'lucide-react';

interface ConsolidationGroup {
  id: string;
  section_id: string;
  participating_departments: string[];
  block_hours_saved: number;
  consolidation_reason: string;
  block_count: number;
  block_ids: string[];
}

interface ConsolidationOpportunity {
  opportunity_id: string;
  section_id: string;
  section_name: string;
  departments: string[];
  department_labels: string[];
  task_count: number;
  candidate_task_ids: string[];
  estimated_hours_saved: number;
  synergy_explanation: string;
  compatibility_score: number;
}

interface ConsolidationSummary {
  total_consolidation_groups: number;
  total_block_hours_saved: number;
  average_hours_saved_per_block: number;
  synergy_index: number;
  participating_departments: string[];
  top_spotlight_group: {
    id: string;
    section: string;
    departments: string[];
    hours_saved: number;
    reason: string;
  };
}

export const ConsolidationView: React.FC = () => {
  const [groups, setGroups] = useState<ConsolidationGroup[]>([]);
  const [opportunities, setOpportunities] = useState<ConsolidationOpportunity[]>([]);
  const [summary, setSummary] = useState<ConsolidationSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [mergingId, setMergingId] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const fetchConsolidationData = async () => {
    setLoading(true);
    try {
      const [grpRes, oppRes, sumRes] = await Promise.all([
        fetch('/api/consolidation/groups'),
        fetch('/api/consolidation/opportunities'),
        fetch('/api/consolidation/summary'),
      ]);

      if (grpRes.ok) setGroups(await grpRes.json());
      if (oppRes.ok) setOpportunities(await oppRes.json());
      if (sumRes.ok) setSummary(await sumRes.json());
    } catch (err) {
      console.error('Failed to fetch consolidation data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMergeOpportunity = async (opp: ConsolidationOpportunity) => {
    setMergingId(opp.opportunity_id);
    try {
      const payload = {
        section_id: opp.section_id,
        task_ids: opp.candidate_task_ids,
        duration_min: 180,
      };

      const res = await fetch('/api/consolidation/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        setSuccessToast(`Merged ${opp.task_count} tasks into ${data.block_id}, saving ${data.hours_saved} hours!`);
        fetchConsolidationData();
      }
    } catch (err) {
      console.error('Failed to merge tasks:', err);
    } finally {
      setMergingId(null);
    }
  };

  useEffect(() => {
    fetchConsolidationData();
  }, []);

  const getDeptBadge = (dept: string) => {
    switch (dept) {
      case 'ENG':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      case 'TRD':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
      case 'SNT':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'OPT':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      default:
        return 'bg-slate-500/20 text-slate-300 border-slate-500/40';
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-purple-500/10 border border-purple-500/30 rounded-lg text-purple-400">
              <GitMerge className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold text-slate-100">Multi-Department Consolidation Engine</h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-mono">
              Civil · Electrical · S&T · Operations
            </span>
          </div>
          <p className="text-slate-400 text-sm mt-1">
            Co-locating maintenance tasks across departments into unified integrated mega-blocks
          </p>
        </div>

        <button
          onClick={fetchConsolidationData}
          className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Opportunities
        </button>
      </div>

      {/* Success Toast */}
      {successToast && (
        <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-emerald-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{successToast}</span>
          </div>
          <button onClick={() => setSuccessToast(null)} className="text-emerald-400 text-xs font-mono">✕</button>
        </div>
      )}

      {/* Top Spotlight Card (Recreating Concept Image Layout: CON-2025-01) */}
      <div className="bg-gradient-to-r from-purple-950/40 via-slate-900/90 to-slate-900/90 border border-purple-500/40 rounded-xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 flex-1">
            <div className="flex items-center gap-2.5">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                MEGA-BLOCK SPOTLIGHT
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {summary?.top_spotlight_group.id || 'CON-2025-01'}
              </span>
            </div>

            <h2 className="text-xl font-bold text-slate-100">
              {summary?.top_spotlight_group.section || 'New Delhi – Prayagraj (SEC-NDLS-ALD)'}
            </h2>

            <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
              {summary?.top_spotlight_group.reason}
            </p>

            {/* Department Badges */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-xs text-slate-400 mr-1">Co-located Departments:</span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded border bg-rose-500/20 text-rose-300 border-rose-500/40 flex items-center gap-1">
                <Wrench className="w-3 h-3" /> Civil (Track Tamping)
              </span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded border bg-cyan-500/20 text-cyan-300 border-cyan-500/40 flex items-center gap-1">
                <Zap className="w-3 h-3" /> Electrical (OHE Power Cut)
              </span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded border bg-emerald-500/20 text-emerald-300 border-emerald-500/40 flex items-center gap-1">
                <Radio className="w-3 h-3" /> S&T (Point Interlocking)
              </span>
            </div>
          </div>

          {/* Hours Saved Metric Circle */}
          <div className="bg-purple-950/40 border border-purple-500/30 rounded-xl p-5 flex flex-col items-center justify-center text-center min-w-[200px]">
            <span className="text-[10px] uppercase font-mono text-purple-300 font-semibold tracking-wider">
              Track Downtime Saved
            </span>
            <div className="text-4xl font-extrabold text-purple-300 my-1">
              +{summary?.top_spotlight_group.hours_saved || 4.5}h
            </div>
            <span className="text-[11px] text-slate-400">
              Eliminated 2 secondary blocks
            </span>
          </div>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Corridor Hours Saved</span>
            <Clock className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-purple-400">
            {summary?.total_block_hours_saved ?? 124.0}h
          </div>
          <span className="text-[10px] text-slate-500 font-mono">Cumulative across corridor</span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Consolidated Blocks</span>
            <GitMerge className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-slate-100">
            {groups.length} Groups
          </div>
          <span className="text-[10px] text-slate-500 font-mono">Multi-department co-located</span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Cross-Dept Synergy</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400">
            {summary?.synergy_index ?? 92.4}%
          </div>
          <span className="text-[10px] text-slate-500 font-mono">Compatibility index</span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Average Reduction</span>
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400">
            {summary?.average_hours_saved_per_block ?? 4.5}h
          </div>
          <span className="text-[10px] text-slate-500 font-mono">Per consolidated block</span>
        </div>
      </div>

      {/* Consolidation Opportunities Table (Detected by AI) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              AI Detected Consolidation Opportunities
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Open candidate tasks sharing the same section and shadow windows ready for merging
            </p>
          </div>
          <span className="text-xs font-mono text-purple-400 bg-purple-950/40 px-2.5 py-1 rounded border border-purple-500/30">
            {opportunities.length} Candidates Detected
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-mono uppercase tracking-wider">
                <th className="py-2.5 px-3">Opportunity ID</th>
                <th className="py-2.5 px-3">Section</th>
                <th className="py-2.5 px-3">Departments</th>
                <th className="py-2.5 px-2 text-center">Tasks</th>
                <th className="py-2.5 px-3">Estimated Saving</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {opportunities.map((opp) => (
                <tr key={opp.opportunity_id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-3 font-mono font-bold text-purple-400">
                    {opp.opportunity_id}
                  </td>
                  <td className="py-3 px-3 font-semibold text-slate-200">
                    {opp.section_name}
                    <div className="text-[10px] text-slate-500 font-normal font-mono">{opp.section_id}</div>
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex flex-wrap gap-1">
                      {opp.departments.map((d) => (
                        <span key={d} className={`text-[10px] font-semibold px-2 py-0.2 rounded border ${getDeptBadge(d)}`}>
                          {d}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 px-2 text-center font-mono font-bold text-cyan-400">
                    {opp.task_count} Tasks
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-emerald-400">
                    +{opp.estimated_hours_saved}h saved
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={() => handleMergeOpportunity(opp)}
                      disabled={mergingId === opp.opportunity_id}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold shadow-md shadow-purple-600/20 transition-all"
                    >
                      <GitMerge className={`w-3.5 h-3.5 ${mergingId === opp.opportunity_id ? 'animate-spin' : ''}`} />
                      {mergingId === opp.opportunity_id ? 'Merging...' : 'Merge into Mega-Block'}
                    </button>
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
