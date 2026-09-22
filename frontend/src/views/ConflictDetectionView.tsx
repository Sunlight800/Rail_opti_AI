import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  Train,
  Clock,
  ArrowRight,
  RefreshCw,
  Search,
  Check,
  Zap,
  Info,
  Sliders,
  X,
} from 'lucide-react';
import { fetchWithAuth } from '../services/api';

interface ResolutionOption {
  option_id?: string;
  option?: string;
  title?: string;
  action: string;
  delay_impact_min?: number;
  confidence?: number;
}

interface ConflictItem {
  id: string;
  plan_version_id: string;
  conflict_type: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'INFO';
  block_id?: string;
  train_id?: string;
  resource_id?: string;
  section_id?: string;
  explanation: string;
  resolution_options: ResolutionOption[];
  is_resolved: boolean;
}

interface ConflictSummary {
  total_conflicts: number;
  critical_count: number;
  high_count: number;
  medium_count: number;
  resolved_count: number;
  unresolved_count: number;
  resolution_rate_pct: number;
}

export const ConflictDetectionView: React.FC = () => {
  const [conflicts, setConflicts] = useState<ConflictItem[]>([]);
  const [summary, setSummary] = useState<ConflictSummary | null>(null);
  const [selectedConflict, setSelectedConflict] = useState<ConflictItem | null>(null);
  const [selectedOptionIdx, setSelectedOptionIdx] = useState<number>(0);
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');
  const [scanning, setScanning] = useState<boolean>(false);
  const [resolving, setResolving] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchConflicts = async () => {
    try {
      const [confRes, sumRes] = await Promise.all([
        fetchWithAuth('/api/conflicts?plan_version_id=PLN-V1'),
        fetchWithAuth('/api/conflicts/summary?plan_version_id=PLN-V1'),
      ]);

      if (confRes.ok) {
        const confData = await confRes.json();
        setConflicts(confData);
        if (confData.length > 0) {
          setSelectedConflict(confData[0]);
        }
      }
      if (sumRes.ok) {
        setSummary(await sumRes.json());
      }
    } catch (err) {
      console.error('Failed to fetch conflicts:', err);
    }
  };

  const handleRunScan = async () => {
    setScanning(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const res = await fetchWithAuth('/api/conflicts/scan?plan_version_id=PLN-V1', { method: 'POST' });
      if (res.ok) {
        const scanResult = await res.json();
        // Merge scanned conflicts
        if (scanResult.conflicts) {
          setConflicts(scanResult.conflicts);
          if (scanResult.conflicts.length > 0) {
            setSelectedConflict(scanResult.conflicts[0]);
          }
        }
        setSuccessMessage(`Dynamic scan completed: ${scanResult.conflicts_detected_count} conflicts evaluated across 14 rules.`);
      } else {
        const err = await res.json().catch(() => ({}));
        setErrorMessage(err.detail || `Scan failed (${res.status} Forbidden)`);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to trigger scan');
    } finally {
      setScanning(false);
    }
  };

  const handleApplyResolution = async () => {
    if (!selectedConflict) return;
    setResolving(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const option = selectedConflict.resolution_options[selectedOptionIdx];
      const optId = option?.option_id || 'OPT-APPLY';

      const res = await fetchWithAuth(`/api/conflicts/${selectedConflict.id}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolution_option_id: optId }),
      });

      if (res.ok) {
        setSuccessMessage(`Conflict ${selectedConflict.id} successfully resolved! Schedule updated.`);
        // Mark as resolved in local state
        setConflicts((prev) =>
          prev.map((c) => (c.id === selectedConflict.id ? { ...c, is_resolved: true } : c))
        );
        setSelectedConflict((prev) => (prev ? { ...prev, is_resolved: true } : null));
      } else {
        const err = await res.json().catch(() => ({}));
        setErrorMessage(err.detail || `Failed to resolve conflict (${res.status} Forbidden)`);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to resolve conflict');
    } finally {
      setResolving(false);
    }
  };

  useEffect(() => {
    fetchConflicts();
  }, []);

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'CRITICAL':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      case 'HIGH':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'MEDIUM':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
      default:
        return 'bg-slate-500/20 text-slate-300 border-slate-500/40';
    }
  };

  const filteredConflicts = conflicts.filter((c) => {
    if (filterSeverity === 'ALL') return true;
    if (filterSeverity === 'RESOLVED') return c.is_resolved;
    if (filterSeverity === 'UNRESOLVED') return !c.is_resolved;
    return c.severity === filterSeverity;
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400">
              <AlertTriangle className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold text-slate-100">Conflict Detection & Resolution Engine</h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-mono">
              14 Conflict Categories
            </span>
          </div>
          <p className="text-slate-400 text-sm mt-1">
            Automated collision checking between train paths, maintenance blocks, power cuts, and resources
          </p>
        </div>

        <button
          onClick={handleRunScan}
          disabled={scanning}
          className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-lg shadow-rose-600/20 transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${scanning ? 'animate-spin' : ''}`} />
          Run Dynamic Conflict Scan
        </button>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-emerald-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-400 hover:text-emerald-200 text-xs font-mono"
          >
            ✕
          </button>
        </div>
      )}

      {/* Error / 403 Forbidden Notification */}
      {errorMessage && (
        <div className="bg-rose-950/40 border border-rose-500/40 rounded-xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-rose-300">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-rose-400 hover:text-rose-200 text-xs font-mono"
          >
            ✕
          </button>
        </div>
      )}

      {/* Summary Badges Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 shadow">
          <span className="text-[10px] text-slate-400 uppercase font-mono">Total Conflicts</span>
          <div className="text-xl font-bold text-slate-100 mt-0.5">
            {conflicts.length}
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 shadow">
          <span className="text-[10px] text-rose-400 uppercase font-mono">Critical</span>
          <div className="text-xl font-bold text-rose-400 mt-0.5">
            {conflicts.filter((c) => c.severity === 'CRITICAL' && !c.is_resolved).length}
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 shadow">
          <span className="text-[10px] text-amber-400 uppercase font-mono">High Severity</span>
          <div className="text-xl font-bold text-amber-400 mt-0.5">
            {conflicts.filter((c) => c.severity === 'HIGH' && !c.is_resolved).length}
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 shadow">
          <span className="text-[10px] text-cyan-400 uppercase font-mono">Medium</span>
          <div className="text-xl font-bold text-cyan-400 mt-0.5">
            {conflicts.filter((c) => c.severity === 'MEDIUM' && !c.is_resolved).length}
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 shadow">
          <span className="text-[10px] text-emerald-400 uppercase font-mono">Resolved</span>
          <div className="text-xl font-bold text-emerald-400 mt-0.5">
            {conflicts.filter((c) => c.is_resolved).length}
          </div>
        </div>
      </div>

      {/* Main Split Grid: Spotlight Conflict Resolver + Conflict Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Interactive Conflict Resolution Spotlight (Recreating Concept Image) */}
        <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-xl space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <span className="text-[10px] uppercase font-mono text-rose-400 font-semibold">
                Active Conflict Spotlight
              </span>
              <h2 className="text-base font-bold text-slate-100 mt-0.5 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                {selectedConflict?.id || 'Select a Conflict'}
              </h2>
            </div>

            {selectedConflict && (
              <span
                className={`text-xs font-semibold px-2.5 py-1 rounded border ${getSeverityBadge(
                  selectedConflict.severity
                )}`}
              >
                {selectedConflict.severity} SEVERITY
              </span>
            )}
          </div>

          {selectedConflict ? (
            <div className="space-y-4">
              {/* Conflict Context Banner */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-slate-400">Conflict Category:</span>
                  <span className="font-mono font-bold text-cyan-400">{selectedConflict.conflict_type}</span>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed">
                  {selectedConflict.explanation}
                </p>
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800/80 text-xs">
                  <div>
                    <span className="text-slate-500 text-[11px]">Affected Train:</span>
                    <div className="font-mono font-bold text-blue-400 truncate mt-0.5">
                      {selectedConflict.train_id || 'None (Infrastructure)'}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[11px]">Affected Block:</span>
                    <div className="font-mono font-bold text-indigo-400 truncate mt-0.5">
                      {selectedConflict.block_id || 'None (Schedule)'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Resolution Options Selector */}
              <div className="space-y-2.5">
                <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">
                  AI Generated Resolution Strategies ({selectedConflict.resolution_options.length})
                </h3>

                {selectedConflict.resolution_options.map((opt, idx) => (
                  <div
                    key={idx}
                    onClick={() => setSelectedOptionIdx(idx)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      selectedOptionIdx === idx
                        ? 'border-cyan-500 bg-cyan-950/20 shadow-md shadow-cyan-500/10'
                        : 'border-slate-800 bg-slate-950/30 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-4 h-4 rounded-full border flex items-center justify-center text-[10px] ${
                            selectedOptionIdx === idx
                              ? 'border-cyan-400 bg-cyan-500 text-slate-950 font-bold'
                              : 'border-slate-600 text-transparent'
                          }`}
                        >
                          ✓
                        </span>
                        <span className="font-semibold text-xs text-slate-200">
                          {opt.title || opt.option || `Option ${idx + 1}`}
                        </span>
                      </div>
                      {opt.delay_impact_min !== undefined && (
                        <span className="text-[10px] font-mono text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                          Delay Delta: {opt.delay_impact_min === 0 ? '0 min (None)' : `+${opt.delay_impact_min} min`}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-300 mt-1 pl-6">
                      {opt.action}
                    </p>
                  </div>
                ))}
              </div>

              {/* Action Button */}
              <div className="pt-2 flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  Status:{' '}
                  <strong className={selectedConflict.is_resolved ? 'text-emerald-400' : 'text-amber-400'}>
                    {selectedConflict.is_resolved ? 'RESOLVED' : 'UNRESOLVED'}
                  </strong>
                </span>

                <button
                  onClick={handleApplyResolution}
                  disabled={resolving || selectedConflict.is_resolved}
                  className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold shadow-lg shadow-cyan-600/20 transition-all"
                >
                  <Check className="w-4 h-4" />
                  {selectedConflict.is_resolved ? 'Resolution Already Applied' : 'Apply Selected Resolution'}
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500 text-xs">
              Select a conflict from the list to view resolution strategies.
            </div>
          )}
        </div>

        {/* Right: Conflict List / Queue */}
        <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-semibold text-slate-200">Conflict Queue</h3>

            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-rose-500"
            >
              <option value="ALL">All Conflicts</option>
              <option value="CRITICAL">Critical Only</option>
              <option value="HIGH">High Severity</option>
              <option value="MEDIUM">Medium Severity</option>
              <option value="UNRESOLVED">Unresolved</option>
              <option value="RESOLVED">Resolved</option>
            </select>
          </div>

          <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
            {filteredConflicts.map((c) => {
              const isSelected = selectedConflict?.id === c.id;
              return (
                <div
                  key={c.id}
                  onClick={() => {
                    setSelectedConflict(c);
                    setSelectedOptionIdx(0);
                  }}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-rose-500 bg-rose-950/20'
                      : 'border-slate-800 bg-slate-950/40 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-mono font-bold text-slate-200">{c.id}</span>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${getSeverityBadge(
                          c.severity
                        )}`}
                      >
                        {c.severity}
                      </span>
                      {c.is_resolved && (
                        <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded border border-emerald-500/30">
                          RESOLVED
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-[11px] font-mono text-cyan-400">
                    {c.conflict_type}
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">
                    {c.explanation}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
