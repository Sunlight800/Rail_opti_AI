import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Calendar,
  Layers,
  Sparkles,
  RefreshCw,
  Building2,
  CheckCircle2,
  FileSpreadsheet,
  FileCode,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { fetchWithAuth } from '../services/api';

interface ReportTemplate {
  id: string;
  title: string;
  category: string;
  frequency: string;
  description: string;
}

interface ReportPayload {
  report_id: string;
  template: ReportTemplate;
  generated_at: string;
  generated_by: string;
  corridor: string;
  executive_summary: {
    active_plan_version: string;
    total_blocks_scheduled: number;
    asset_availability_pct: number;
    block_hours_saved: number;
    train_punctuality_index: string;
    high_risk_defects_rectified: number;
  };
  table_data: Array<{
    block_id: string;
    section: string;
    block_type: string;
    start_time: string;
    end_time: string;
    duration_min: number;
    safety_status: string;
    ai_explanation: string;
  }>;
  export_formats: string[];
  disclaimer: string;
}

export const ReportsView: React.FC = () => {
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('REP-DAILY-BLOCKS');
  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [report, setReport] = useState<ReportPayload | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  const fetchTemplates = async () => {
    setIsLoading(true);
    try {
      const res = await fetchWithAuth('/api/reports/list');
      if (res.ok) {
        const data = await res.json();
        setTemplates(data || []);
      }
    } catch (err) {
      console.error('Failed to load report templates:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    try {
      const res = await fetchWithAuth('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template_id: selectedTemplateId,
          corridor_id: 'COR-DEL-BOM',
          department_id: selectedDept,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setReport(data);
      }
    } catch (err) {
      console.error('Failed to generate report:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
    handleGenerateReport();
  }, [selectedTemplateId, selectedDept]);

  const downloadJson = () => {
    if (!report) return;
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report.report_id}.json`;
    a.click();
  };

  const downloadCsv = () => {
    if (!report || !report.table_data.length) return;
    const headers = Object.keys(report.table_data[0]).join(',');
    const rows = report.table_data.map((row) => Object.values(row).join(','));
    const csvContent = [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report.report_id}.csv`;
    a.click();
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-railnavy-900 via-railnavy-850 to-indigo-950/40 p-5 rounded-2xl border border-railnavy-700/80 shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase tracking-wider">
              Statutory Dossiers & Exports
            </span>
            <span className="text-xs text-slate-400">Railway Board Compliance</span>
          </div>
          <h1 className="text-xl font-bold text-white mt-1 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-400" />
            Executive Reports & Block Execution Dossiers
          </h1>
          <p className="text-xs text-slate-300 mt-0.5">
            Generate formal Indian Railways operational briefs, multi-department audit clearances, and CSV/JSON data packages.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 bg-railnavy-800 border border-railnavy-700 rounded-lg px-2 py-1">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="bg-transparent text-xs text-white focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-railnavy-900 text-white">All Departments</option>
              <option value="ENG" className="bg-railnavy-900 text-white">Engineering (ENG)</option>
              <option value="TRD" className="bg-railnavy-900 text-white">Traction (TRD)</option>
              <option value="S&T" className="bg-railnavy-900 text-white">Signal & Telecom (S&T)</option>
              <option value="OPT" className="bg-railnavy-900 text-white">Operating (OPT)</option>
            </select>
          </div>

          <button
            onClick={handleGenerateReport}
            disabled={isGenerating}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
            {isGenerating ? 'Generating...' : 'Refresh'}
          </button>

          <button
            onClick={downloadCsv}
            disabled={!report}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-railnavy-800 hover:bg-railnavy-700 text-slate-300 hover:text-white border border-railnavy-600 text-xs font-semibold transition disabled:opacity-50"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            Export CSV
          </button>
          <button
            onClick={downloadJson}
            disabled={!report}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-railnavy-800 hover:bg-railnavy-700 text-slate-300 hover:text-white border border-railnavy-600 text-xs font-semibold transition disabled:opacity-50"
          >
            <FileCode className="w-3.5 h-3.5 text-cyan-400" />
            Export JSON
          </button>
        </div>
      </div>

      {/* Template Selection Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {templates.map((tpl) => (
          <div
            key={tpl.id}
            onClick={() => setSelectedTemplateId(tpl.id)}
            className={`p-4 rounded-xl border cursor-pointer transition ${
              selectedTemplateId === tpl.id
                ? 'bg-railnavy-800/90 border-indigo-500 shadow-md shadow-indigo-500/10'
                : 'bg-railnavy-900/60 border-railnavy-700/60 hover:border-slate-600'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {tpl.category}
              </span>
              <span className="text-[10px] text-slate-400">{tpl.frequency}</span>
            </div>
            <h3 className="text-xs font-bold text-white mt-2 line-clamp-1">{tpl.title}</h3>
            <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{tpl.description}</p>
          </div>
        ))}
      </div>

      {/* Generated Report Preview */}
      {report && (
        <div className="p-6 rounded-2xl bg-railnavy-900/90 border border-railnavy-800 shadow-xl space-y-6">
          {/* Report Meta Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-railnavy-800">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                OFFICIAL REPORT // {report.report_id}
              </span>
              <h2 className="text-lg font-bold text-white mt-1">{report.template.title}</h2>
              <p className="text-xs text-slate-400">{report.corridor} • Generated: {new Date(report.generated_at).toLocaleString()}</p>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                Validated Dossier
              </span>
            </div>
          </div>

          {/* Executive Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="p-3 rounded-xl bg-railnavy-850/80 border border-railnavy-700/60">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Active Plan</span>
              <p className="text-sm font-bold text-cyan-400 mt-0.5">{report.executive_summary.active_plan_version}</p>
            </div>
            <div className="p-3 rounded-xl bg-railnavy-850/80 border border-railnavy-700/60">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Asset Availability</span>
              <p className="text-sm font-bold text-emerald-400 mt-0.5">{report.executive_summary.asset_availability_pct}%</p>
            </div>
            <div className="p-3 rounded-xl bg-railnavy-850/80 border border-railnavy-700/60">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Hours Saved</span>
              <p className="text-sm font-bold text-purple-400 mt-0.5">{report.executive_summary.block_hours_saved} hrs</p>
            </div>
            <div className="p-3 rounded-xl bg-railnavy-850/80 border border-railnavy-700/60">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Train Punctuality</span>
              <p className="text-sm font-bold text-cyan-300 mt-0.5">{report.executive_summary.train_punctuality_index}</p>
            </div>
            <div className="p-3 rounded-xl bg-railnavy-850/80 border border-railnavy-700/60">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Critical Defects</span>
              <p className="text-sm font-bold text-emerald-300 mt-0.5">{report.executive_summary.high_risk_defects_rectified} Rectified</p>
            </div>
          </div>

          {/* Table Data */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider text-slate-400">
              Schedule Manifest
            </h3>
            <div className="overflow-x-auto rounded-xl border border-railnavy-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-railnavy-950 text-slate-400 uppercase text-[10px] border-b border-railnavy-800">
                  <tr>
                    <th className="py-2.5 px-3">Block ID</th>
                    <th className="py-2.5 px-3">Section</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Start</th>
                    <th className="py-2.5 px-3">End</th>
                    <th className="py-2.5 px-3">Duration</th>
                    <th className="py-2.5 px-3">Safety Status</th>
                    <th className="py-2.5 px-3">AI Operational Justification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-railnavy-800/60 text-slate-300">
                  {report.table_data.map((row, idx) => (
                    <tr key={idx} className="hover:bg-railnavy-800/40 transition">
                      <td className="py-2 px-3 font-semibold text-white">{row.block_id}</td>
                      <td className="py-2 px-3 text-cyan-400">{row.section}</td>
                      <td className="py-2 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-blue-500/10 text-blue-300 border border-blue-500/20">
                          {row.block_type}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-slate-300">{row.start_time}</td>
                      <td className="py-2 px-3 text-slate-300">{row.end_time}</td>
                      <td className="py-2 px-3">{row.duration_min} min</td>
                      <td className="py-2 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          {row.safety_status}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-slate-400 max-w-xs truncate">{row.ai_explanation}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mandatory Disclaimer */}
          <div className="p-3 rounded-xl bg-railnavy-950 border border-railnavy-800 text-[11px] text-slate-400 text-center">
            {report.disclaimer}
          </div>
        </div>
      )}
    </div>
  );
};
export default ReportsView;
