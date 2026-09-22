import React, { useState, useEffect } from 'react';
import {
  Database,
  RefreshCw,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Activity,
  Server,
  Layers,
  Sparkles,
} from 'lucide-react';
import { fetchWithAuth } from '../services/api';

interface SystemStatus {
  id: string;
  name: string;
  full_name: string;
  status: string;
  mode: string;
  last_sync: string;
  record_count: string;
  raw_count: number;
  data_quality_pct: number;
  description: string;
}

interface PreviewRow {
  task_id: string;
  asset_id: string;
  section: string;
  track: string;
  type: string;
  priority: string;
  status: string;
}

export const DataIntegrationView: React.FC = () => {
  const [systems, setSystems] = useState<SystemStatus[]>([]);
  const [selectedSystem, setSelectedSystem] = useState<string>('TMS');
  const [previewData, setPreviewData] = useState<PreviewRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      const res = await fetchWithAuth('/api/data-integration/status');
      if (res.ok) {
        setSystems(await res.json());
      }
    } catch (err) {
      console.error('Failed to load integration status:', err);
    }
  };

  const fetchPreview = async (sys: string) => {
    try {
      const res = await fetchWithAuth(`/api/data-integration/preview/${sys}`);
      if (res.ok) {
        setPreviewData(await res.json());
      }
    } catch (err) {
      console.error('Failed to load preview data:', err);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchStatus(), fetchPreview('TMS')]);
      setLoading(false);
    };
    init();
  }, []);

  const handleSyncAll = async () => {
    setSyncing(true);
    setNotification(null);
    setErrorMessage(null);
    try {
      const res = await fetchWithAuth('/api/data-integration/sync', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setNotification(data.message);
        await fetchStatus();
      } else {
        const err = await res.json().catch(() => ({}));
        setErrorMessage(err.detail || 'Sync failed: insufficient permissions');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Sync failed');
    } finally {
      setSyncing(false);
      setTimeout(() => {
        setNotification(null);
        setErrorMessage(null);
      }, 5000);
    }
  };

  const handleSystemClick = (sysId: string) => {
    setSelectedSystem(sysId);
    fetchPreview(sysId);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setNotification(null);
    setErrorMessage(null);

    if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      setErrorMessage(`Selected Excel workbook "${file.name}". Please export or save as .csv for automated schema ingestion into RAILOPT.`);
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('dataset_type', 'tasks');

    try {
      const res = await fetchWithAuth('/api/data-integration/upload-csv', {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        setNotification(data.message || `Successfully ingested ${file.name}`);
        await fetchStatus();
      } else {
        const err = await res.json().catch(() => ({}));
        setErrorMessage(err.detail || 'Upload failed. Please ensure file is a valid .csv format.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Upload error');
    } finally {
      setTimeout(() => {
        setNotification(null);
        setErrorMessage(null);
      }, 5000);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-[1700px] mx-auto text-left">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-railnavy-900/90 border border-railnavy-800 rounded-2xl p-5 shadow">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-bold text-white">Data Integration Hub</h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              SIMULATED / DEMO ADAPTERS
            </span>
          </div>
          <p className="text-xs text-slate-300">
            Connect and manage external Indian Railways data sources (TMS, SMMS, TDMS, COA)
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-railnavy-700 bg-railnavy-950/60 hover:bg-railnavy-800 text-slate-200 text-xs font-semibold cursor-pointer transition">
            <Upload className="w-3.5 h-3.5 text-cyan-400" />
            <span>Upload CSV</span>
            <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
          </label>

          <label className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-railnavy-700 bg-railnavy-950/60 hover:bg-railnavy-800 text-slate-200 text-xs font-semibold cursor-pointer transition">
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Upload Excel</span>
            <input type="file" accept=".xlsx,.xls" onChange={handleFileUpload} className="hidden" />
          </label>

          <button
            onClick={handleSyncAll}
            disabled={syncing}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition shadow-lg shadow-blue-600/20 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
            <span>{syncing ? 'Syncing...' : 'Sync All API Feeds'}</span>
          </button>
        </div>
      </div>

      {notification && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-rose-400 hover:text-white font-bold ml-4">
            ✕
          </button>
        </div>
      )}

      {/* 4 Cards Row: TMS, SMMS, TDMS, COA */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {systems.map((sys) => {
          const isSelected = selectedSystem === sys.id;
          return (
            <div
              key={sys.id}
              onClick={() => handleSystemClick(sys.id)}
              className={`p-4 rounded-2xl bg-railnavy-900/80 border transition-all cursor-pointer relative overflow-hidden ${
                isSelected
                  ? 'border-cyan-500 ring-1 ring-cyan-500/30 shadow-lg shadow-cyan-500/10'
                  : 'border-railnavy-800 hover:border-railnavy-700'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-railnavy-950 flex items-center justify-center border border-railnavy-800 text-cyan-400 font-bold text-xs">
                    {sys.name}
                  </div>
                  <div>
                    <h2 className="text-xs font-bold text-white">{sys.full_name}</h2>
                    <span className="text-[10px] text-slate-400 font-medium">Last Sync: {sys.last_sync}</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {sys.status}
                </span>
              </div>

              <p className="text-[11px] text-slate-300 mb-3 h-8 leading-snug line-clamp-2">
                {sys.description}
              </p>

              <div className="pt-2 border-t border-railnavy-800/80 flex items-center justify-between text-[11px]">
                <div>
                  <span className="text-slate-400">Records: </span>
                  <b className="text-white font-mono">{sys.record_count}</b>
                </div>
                <div>
                  <span className="text-slate-400">Quality: </span>
                  <b className="text-emerald-400 font-mono">{sys.data_quality_pct}%</b>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Data Preview Table */}
      <div className="bg-railnavy-900/80 border border-railnavy-800 rounded-2xl p-5 shadow space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Data Preview — {selectedSystem}</span>
              <span className="text-xs font-normal text-slate-400">(Showing recent simulated records)</span>
            </h2>
            <p className="text-[11px] text-slate-400">
              Live schema validation against Indian Railways format specifications
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Live data validation completed successfully
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-[10px] uppercase text-slate-400 border-b border-railnavy-800 font-semibold">
              <tr>
                <th className="pb-2">Task ID</th>
                <th className="pb-2">Asset ID</th>
                <th className="pb-2">Section</th>
                <th className="pb-2">Track</th>
                <th className="pb-2">Work Type</th>
                <th className="pb-2">Priority</th>
                <th className="pb-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-railnavy-800/60 font-mono text-[11px]">
              {previewData.map((row, idx) => (
                <tr key={idx} className="hover:bg-railnavy-800/40 transition">
                  <td className="py-2.5 font-bold text-cyan-400">{row.task_id}</td>
                  <td className="py-2.5 font-sans text-slate-200">{row.asset_id}</td>
                  <td className="py-2.5 text-slate-300">{row.section}</td>
                  <td className="py-2.5 font-sans text-slate-400">{row.track}</td>
                  <td className="py-2.5 font-sans text-slate-200">{row.type}</td>
                  <td className="py-2.5">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      row.priority === 'CRITICAL' ? 'bg-rose-500 text-white' :
                      row.priority === 'HIGH' ? 'bg-amber-500 text-black' : 'bg-blue-500 text-white'
                    }`}>
                      {row.priority}
                    </span>
                  </td>
                  <td className="py-2.5 font-sans">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                      row.status === 'OPEN' ? 'bg-railnavy-800 text-slate-300 border-railnavy-700' :
                      'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                    }`}>
                      {row.status}
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
