import React, { useState, useEffect } from 'react';
import {
  Wrench,
  Search,
  Filter,
  AlertCircle,
  Clock,
  Layers,
  CheckCircle2,
  ChevronRight,
  X,
  ShieldAlert,
  Brain,
  Zap,
} from 'lucide-react';

interface TaskSummary {
  id: string;
  asset_id: string;
  asset_name: string;
  section_id: string;
  department_id: string;
  task_type: string;
  severity: string;
  priority_score: number | null;
  risk_pct: number;
  requested_date: string;
  due_date: string;
  estimated_duration_min: number;
  safety_critical_flag: boolean;
  status: string;
  notes: string | null;
}

interface TaskDetail {
  id: string;
  asset: {
    id: string;
    name: string;
    type: string;
    criticality: string;
    cumulative_gmt: number;
  };
  section_id: string;
  department_id: string;
  task_type: string;
  severity: string;
  defect: {
    id: string;
    type: string;
    severity: string;
    description: string;
  } | null;
  priority_score: {
    total_score: number;
    category: string;
    factors: Array<{
      name: string;
      value: number;
      weight: number;
      contribution: number;
    }>;
    ai_rationale: string;
  };
  risk_assessment: {
    safety_risk_level: string;
    failure_probability: number;
    operational_impact: string;
    explanation: string;
  };
  resources_required: Array<{
    id: string;
    resource_type: string;
    required_quantity: number;
    is_mandatory: boolean;
    alternative: string | null;
  }>;
  requested_date: string;
  due_date: string;
  estimated_duration_min: number;
  safety_critical_flag: boolean;
  status: string;
  notes: string | null;
}

export const MaintenanceView: React.FC = () => {
  const [tasks, setTasks] = useState<TaskSummary[]>([]);
  const [departmentFilter, setDepartmentFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [taskDetail, setTaskDetail] = useState<TaskDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [detailLoading, setDetailLoading] = useState<boolean>(false);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      let url = '/api/maintenance?limit=50';
      if (departmentFilter !== 'ALL') url += `&department_id=${departmentFilter}`;
      if (priorityFilter !== 'ALL') url += `&priority=${priorityFilter}`;
      if (searchTerm) url += `&search=${encodeURIComponent(searchTerm)}`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks);
      }
    } catch (err) {
      console.error('Failed to load tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [departmentFilter, priorityFilter, searchTerm]);

  const handleOpenDetail = async (taskId: string) => {
    setSelectedTaskId(taskId);
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/maintenance/${taskId}`);
      if (res.ok) {
        setTaskDetail(await res.json());
      }
    } catch (err) {
      console.error('Failed to load task detail:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleUpdateStatus = async (taskId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/maintenance/${taskId}/status?new_status=${newStatus}`, {
        method: 'PUT',
      });
      if (res.ok) {
        await fetchTasks();
        if (selectedTaskId === taskId) {
          await handleOpenDetail(taskId);
        }
      }
    } catch (err) {
      console.error('Status update failed:', err);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-[1700px] mx-auto text-left">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-railnavy-900/90 border border-railnavy-800 rounded-2xl p-5 shadow">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-bold text-white">Maintenance Task Repository</h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              100+ REAL RECORDS
            </span>
          </div>
          <p className="text-xs text-slate-300">
            Multi-department maintenance requests across Engineering, TRD, and S&T
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search task ID, asset, type..."
            className="w-full bg-railnavy-950 border border-railnavy-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Filter Tabs & Priority Chips */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Department Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-railnavy-900/90 border border-railnavy-800">
          {[
            { id: 'ALL', label: 'All Departments' },
            { id: 'ENG', label: 'Civil Engineering (ENG)' },
            { id: 'TRD', label: 'Traction Distribution (TRD)' },
            { id: 'SNT', label: 'Signal & Telecom (S&T)' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setDepartmentFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                departmentFilter === tab.id
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-white hover:bg-railnavy-800/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Priority Filter Chips */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Priority:
          </span>
          {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((p) => (
            <button
              key={p}
              onClick={() => setPriorityFilter(p)}
              className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition ${
                priorityFilter === p
                  ? p === 'CRITICAL' ? 'bg-rose-500 text-white border-rose-400' :
                    p === 'HIGH' ? 'bg-amber-500 text-black border-amber-400' :
                    p === 'MEDIUM' ? 'bg-blue-500 text-white border-blue-400' : 'bg-slate-200 text-slate-900 border-white'
                  : 'border-railnavy-800 bg-railnavy-950/60 text-slate-400 hover:text-white'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Tasks Table */}
      <div className="bg-railnavy-900/80 border border-railnavy-800 rounded-2xl p-5 shadow space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white">
            Displaying {tasks.length} Maintenance Tasks
          </h2>
          <span className="text-xs text-slate-400 font-mono">
            Click any task to inspect 6-factor priority breakdown & required resources
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-[10px] uppercase text-slate-400 border-b border-railnavy-800 font-semibold">
              <tr>
                <th className="pb-2">Task ID</th>
                <th className="pb-2">Asset</th>
                <th className="pb-2">Section</th>
                <th className="pb-2">Dept</th>
                <th className="pb-2">Work Type</th>
                <th className="pb-2">Priority</th>
                <th className="pb-2">Score</th>
                <th className="pb-2">Risk %</th>
                <th className="pb-2">Duration</th>
                <th className="pb-2">Due Date</th>
                <th className="pb-2">Status</th>
                <th className="pb-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-railnavy-800/60 font-mono text-[11px]">
              {tasks.map((task) => (
                <tr
                  key={task.id}
                  onClick={() => handleOpenDetail(task.id)}
                  className="hover:bg-railnavy-800/40 cursor-pointer transition"
                >
                  <td className="py-2.5 font-bold text-cyan-400">{task.id}</td>
                  <td className="py-2.5 font-sans text-slate-200">{task.asset_name}</td>
                  <td className="py-2.5 text-slate-300">{task.section_id}</td>
                  <td className="py-2.5">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      task.department_id === 'ENG' ? 'bg-rose-500/20 text-rose-300' :
                      task.department_id === 'TRD' ? 'bg-cyan-500/20 text-cyan-300' : 'bg-emerald-500/20 text-emerald-300'
                    }`}>
                      {task.department_id}
                    </span>
                  </td>
                  <td className="py-2.5 font-sans text-slate-200">{task.task_type}</td>
                  <td className="py-2.5">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      task.severity === 'CRITICAL' ? 'bg-rose-500 text-white' :
                      task.severity === 'HIGH' ? 'bg-amber-500 text-black' :
                      task.severity === 'MEDIUM' ? 'bg-blue-500 text-white' : 'bg-slate-700 text-slate-300'
                    }`}>
                      {task.severity}
                    </span>
                  </td>
                  <td className="py-2.5 font-bold text-slate-200">
                    {task.priority_score !== null ? task.priority_score : '—'}
                  </td>
                  <td className="py-2.5 font-semibold text-rose-400">{task.risk_pct}%</td>
                  <td className="py-2.5 text-slate-400">{task.estimated_duration_min}m</td>
                  <td className="py-2.5 text-slate-400">{task.due_date}</td>
                  <td className="py-2.5 font-sans">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-railnavy-800 text-slate-300 border border-railnavy-700">
                      {task.status}
                    </span>
                  </td>
                  <td className="py-2.5 text-right font-sans">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenDetail(task.id);
                      }}
                      className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold"
                    >
                      Inspect →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Task Detail Modal */}
      {selectedTaskId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl bg-railnavy-900 border border-railnavy-800 rounded-2xl shadow-2xl p-6 text-left overflow-y-auto max-h-[90vh] space-y-5">
            <button
              onClick={() => setSelectedTaskId(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-railnavy-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            {detailLoading || !taskDetail ? (
              <div className="py-12 text-center text-xs text-slate-400">Loading task details...</div>
            ) : (
              <>
                {/* Modal Header */}
                <div className="border-b border-railnavy-800 pb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-base font-bold text-cyan-400 font-mono">{taskDetail.id}</span>
                    <span className="text-base font-bold text-white">— {taskDetail.task_type}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      taskDetail.severity === 'CRITICAL' ? 'bg-rose-500 text-white' : 'bg-amber-500 text-black'
                    }`}>
                      {taskDetail.severity}
                    </span>
                    {taskDetail.safety_critical_flag && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center gap-1">
                        <ShieldAlert className="w-3 h-3" /> SAFETY CRITICAL
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-300">
                    Section: <b className="text-white">{taskDetail.section_id}</b> • Asset: <b className="text-white">{taskDetail.asset.name}</b> ({taskDetail.asset.cumulative_gmt} GMT)
                  </p>
                </div>

                {/* 6-Factor Priority Formula Breakdown */}
                <div className="p-4 rounded-xl bg-railnavy-950/90 border border-railnavy-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Brain className="w-4 h-4 text-purple-400" />
                      <span className="text-xs font-bold text-white uppercase tracking-wider">
                        6-Factor Priority Score: <b className="text-cyan-400 text-sm font-mono">{taskDetail.priority_score.total_score}</b> / 100
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400">Configurable Formula Breakdown</span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="text-[10px] uppercase text-slate-400 border-b border-railnavy-800 font-semibold">
                        <tr>
                          <th className="pb-1.5">Factor</th>
                          <th className="pb-1.5 text-center">Value</th>
                          <th className="pb-1.5 text-center">Weight</th>
                          <th className="pb-1.5 text-right">Contribution</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-railnavy-800/60 font-mono text-[11px]">
                        {taskDetail.priority_score.factors.map((f, idx) => (
                          <tr key={idx}>
                            <td className="py-1.5 font-sans text-slate-300">{f.name}</td>
                            <td className="py-1.5 text-center text-slate-200">{f.value}</td>
                            <td className="py-1.5 text-center text-slate-400">{Math.round(f.weight * 100)}%</td>
                            <td className="py-1.5 text-right font-bold text-cyan-400">{f.contribution}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <p className="text-[11px] text-slate-300 italic bg-railnavy-900/60 p-2 rounded-lg border border-railnavy-800/80">
                    AI Rationale: "{taskDetail.priority_score.ai_rationale}"
                  </p>
                </div>

                {/* Required Resources List */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Layers className="w-4 h-4 text-blue-400" /> Required Maintenance Resources
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {taskDetail.resources_required.map((r) => (
                      <div key={r.id} className="p-2.5 rounded-lg bg-railnavy-950 border border-railnavy-800 text-xs flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-slate-200">{r.resource_type}</div>
                          <div className="text-[10px] text-slate-400">
                            {r.is_mandatory ? 'Mandatory Constraint' : 'Optional / Flexible'}
                          </div>
                        </div>
                        <span className="font-mono font-bold text-cyan-400 text-sm">x{r.required_quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Status Update Controls */}
                <div className="pt-3 border-t border-railnavy-800 flex items-center justify-between">
                  <div className="text-xs text-slate-400">
                    Current Status: <b className="text-white font-mono">{taskDetail.status}</b>
                  </div>
                  <div className="flex items-center gap-2">
                    {['OPEN', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED'].map((st) => (
                      <button
                        key={st}
                        onClick={() => handleUpdateStatus(taskDetail.id, st)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                          taskDetail.status === st
                            ? 'bg-blue-600 text-white'
                            : 'bg-railnavy-950 border border-railnavy-700 text-slate-300 hover:text-white'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
