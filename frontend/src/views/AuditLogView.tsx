import React, { useState, useEffect } from 'react';
import {
  History,
  Shield,
  Search,
  Filter,
  RefreshCw,
  User,
  Calendar,
  Eye,
  CheckCircle2,
  XCircle,
  FileText,
  Clock,
} from 'lucide-react';
import { fetchWithAuth } from '../services/api';

interface AuditLogEntry {
  id: string;
  timestamp: string;
  user_id: string;
  user_name: string;
  user_role: string;
  action: string;
  entity_name: string;
  entity_id: string;
  old_value: Record<string, any> | null;
  new_value: Record<string, any> | null;
  reason: string;
}

export const AuditLogView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [actions, setActions] = useState<string[]>([]);
  const [selectedAction, setSelectedAction] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchAuditData = async () => {
    setIsLoading(true);
    try {
      const url =
        selectedAction === 'ALL'
          ? '/api/audit/logs'
          : `/api/audit/logs?action=${encodeURIComponent(selectedAction)}`;

      const [logsRes, actionsRes] = await Promise.all([
        fetchWithAuth(url),
        fetchWithAuth('/api/audit/actions'),
      ]);

      if (logsRes.ok) {
        const lData = await logsRes.json();
        setLogs(lData.logs || []);
      }
      if (actionsRes.ok) {
        const aData = await actionsRes.json();
        setActions(aData || []);
      }
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditData();
  }, [selectedAction]);

  const filteredLogs = logs.filter((log) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      log.action.toLowerCase().includes(q) ||
      log.entity_id.toLowerCase().includes(q) ||
      log.user_name.toLowerCase().includes(q) ||
      (log.reason && log.reason.toLowerCase().includes(q))
    );
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-railnavy-900 via-railnavy-850 to-slate-900 p-5 rounded-2xl border border-railnavy-700/80 shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-500/20 text-slate-300 border border-slate-500/30 uppercase tracking-wider">
              Cryptographic Audit Integrity
            </span>
            <span className="text-xs text-slate-400">SIH26027 Governance</span>
          </div>
          <h1 className="text-xl font-bold text-white mt-1 flex items-center gap-2">
            <History className="w-5 h-5 text-cyan-400" />
            Immutable Audit Trail & Governance Log
          </h1>
          <p className="text-xs text-slate-300 mt-0.5">
            Full compliance record of every optimization run, departmental sign-off, constraint adjustment, and plan activation.
          </p>
        </div>

        <button
          onClick={fetchAuditData}
          disabled={isLoading}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-railnavy-800 hover:bg-railnavy-700 text-slate-300 hover:text-white border border-railnavy-600 text-xs font-semibold transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-xl bg-railnavy-900/80 border border-railnavy-800 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by action, entity ID, officer, or reason..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-railnavy-850 border border-railnavy-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
            className="px-3 py-2 rounded-lg bg-railnavy-850 border border-railnavy-700 text-xs text-white focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Actions</option>
            {actions.map((act) => (
              <option key={act} value={act}>
                {act}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="p-5 rounded-2xl bg-railnavy-900/90 border border-railnavy-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-white uppercase tracking-wider text-slate-400">
            Recorded Events ({filteredLogs.length})
          </h2>
          <span className="text-[11px] text-slate-400">Sorted: Most Recent First</span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-railnavy-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-railnavy-950 text-slate-400 uppercase text-[10px] border-b border-railnavy-800">
              <tr>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Action</th>
                <th className="py-2.5 px-3">Officer / Actor</th>
                <th className="py-2.5 px-3">Entity</th>
                <th className="py-2.5 px-3">Operational Justification</th>
                <th className="py-2.5 px-3 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-railnavy-800/60 text-slate-300">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-railnavy-800/40 transition">
                  <td className="py-2.5 px-3 text-slate-400 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        log.action.includes('APPROVE')
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : log.action.includes('RECALCULATE')
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : log.action.includes('ACTIVATED')
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                          : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      }`}
                    >
                      {log.action}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="font-semibold text-white">{log.user_name}</div>
                    <div className="text-[10px] text-slate-500">{log.user_role}</div>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="text-cyan-400 font-mono text-[11px]">{log.entity_id}</span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-300 max-w-sm truncate">{log.reason || '—'}</td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      onClick={() => setSelectedLog(log)}
                      className="p-1.5 rounded-lg bg-railnavy-800 hover:bg-railnavy-700 text-slate-300 hover:text-white"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-railnavy-900 border border-railnavy-700 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-railnavy-800">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Shield className="w-4 h-4 text-cyan-400" />
                  Audit Event: {selectedLog.action}
                </h3>
                <p className="text-[11px] text-slate-400">Record ID: {selectedLog.id}</p>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-railnavy-850 border border-railnavy-700/60">
                <div>
                  <span className="text-[10px] text-slate-400">Actor</span>
                  <p className="font-semibold text-white">{selectedLog.user_name}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400">Role</span>
                  <p className="font-semibold text-cyan-400">{selectedLog.user_role}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400">Target Entity</span>
                  <p className="font-semibold text-white">{selectedLog.entity_id}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400">Timestamp</span>
                  <p className="font-semibold text-white">{new Date(selectedLog.timestamp).toLocaleString()}</p>
                </div>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Justification</span>
                <p className="p-3 rounded-lg bg-railnavy-850 text-slate-200 text-xs mt-1 border border-railnavy-700/50">
                  {selectedLog.reason || 'No justification provided.'}
                </p>
              </div>

              {selectedLog.new_value && (
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">State Snapshot (New Value)</span>
                  <pre className="p-3 rounded-lg bg-railnavy-950 text-cyan-300 font-mono text-[10px] overflow-x-auto mt-1 border border-railnavy-800">
                    {JSON.stringify(selectedLog.new_value, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 rounded-lg bg-railnavy-800 hover:bg-railnavy-700 text-slate-300 text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default AuditLogView;
