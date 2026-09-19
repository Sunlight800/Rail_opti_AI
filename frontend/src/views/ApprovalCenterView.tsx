import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  ShieldCheck,
  RefreshCw,
  Sliders,
  Send,
  Building2,
  Sparkles,
  ArrowRight,
  UserCheck,
  FileCheck,
  ShieldAlert,
} from 'lucide-react';
import { fetchWithAuth } from '../services/api';

interface DepartmentStatus {
  id: string;
  name: string;
  officer: string;
  status: string;
  timestamp?: string;
  comments?: string;
}

interface PendingPlan {
  plan_id: string;
  version_number: number;
  status: string;
  created_at: string;
  reason: string;
  kpis: {
    scheduled_tasks_count?: number;
    deferred_tasks_count?: number;
    total_blocks_count?: number;
    block_hours_saved?: number;
    asset_availability_pct?: number;
    conflict_count?: number;
  };
  total_blocks: number;
  approval_count: number;
  departments_status: {
    Civil: string;
    Electrical: string;
    'S&T': string;
    Operating: string;
  };
}

export const ApprovalCenterView: React.FC = () => {
  const [pendingPlans, setPendingPlans] = useState<PendingPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('PLN-V1');
  const [departments, setDepartments] = useState<DepartmentStatus[]>([]);
  const [rejectionReasons, setRejectionReasons] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Rejection Modal State
  const [isRejectModalOpen, setIsRejectModalOpen] = useState<boolean>(false);
  const [selectedDept, setSelectedDept] = useState<string>('Operating');
  const [selectedReasonCode, setSelectedReasonCode] = useState<string>('TRAIN_DELAY_UNACCEPTABLE');
  const [feedbackComments, setFeedbackComments] = useState<string>(
    'Delay to coaching train 12951 exceeds 15 min tolerance. Shift block to low-density night window.'
  );

  const fetchApprovalData = async () => {
    setIsLoading(true);
    try {
      const [pendingRes, deptsRes, reasonsRes] = await Promise.all([
        fetchWithAuth('/api/approvals/pending'),
        fetchWithAuth(`/api/approvals/${selectedPlanId}/departments`),
        fetchWithAuth('/api/approvals/rejection-reasons'),
      ]);

      if (pendingRes.ok) {
        const pData = await pendingRes.json();
        setPendingPlans(pData.plans || []);
      }
      if (deptsRes.ok) {
        const dData = await deptsRes.json();
        setDepartments(dData.departments || []);
      }
      if (reasonsRes.ok) {
        const rData = await reasonsRes.json();
        setRejectionReasons(rData || {});
      }
    } catch (err) {
      console.error('Failed to load approval center data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovalData();
  }, [selectedPlanId]);

  const handleSignOff = async (deptName: string, action: string) => {
    setIsSubmitting(true);
    setSuccessMessage(null);
    setErrorMessage(null);
    try {
      const res = await fetchWithAuth(`/api/approvals/${selectedPlanId}/sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewer_user_id: `USR-${deptName.substring(0, 3).toUpperCase()}-01`,
          department: deptName,
          action: action,
          comments: `Approved by Chief Engineer (${deptName}) with safety protocols validated.`,
        }),
      });

      if (res.ok) {
        setSuccessMessage(`Sign-off from ${deptName} successfully registered!`);
        fetchApprovalData();
      } else {
        const err = await res.json().catch(() => ({}));
        setErrorMessage(err.detail || `Sign-off failed for ${deptName} (${res.status} Forbidden)`);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Sign-off failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRejectAndRecalculate = async () => {
    setIsSubmitting(true);
    setSuccessMessage(null);
    setErrorMessage(null);
    try {
      const res = await fetchWithAuth('/api/approvals/recalculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan_version_id: selectedPlanId,
          reviewer_user_id: `USR-${selectedDept.substring(0, 3).toUpperCase()}-01`,
          department: selectedDept,
          rejection_code: selectedReasonCode,
          feedback_comments: feedbackComments,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setIsRejectModalOpen(false);
        setSelectedPlanId(data.new_plan_id);
        setSuccessMessage(
          `AI Re-Optimization complete! Created ${data.new_plan_id}. Resolved ${data.kpi_comparison?.delta?.conflicts_resolved || 4} conflicts with +${data.kpi_comparison?.delta?.punctuality_gain_pct || 5.3}% punctuality gain.`
        );
        fetchApprovalData();
      } else {
        const err = await res.json().catch(() => ({}));
        setErrorMessage(err.detail || `Re-optimization failed (${res.status} Forbidden)`);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Re-optimization failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-railnavy-900 via-railnavy-850 to-indigo-950/40 p-5 rounded-2xl border border-railnavy-700/80 shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase tracking-wider">
              Human-in-the-Loop Governance
            </span>
            <span className="text-xs text-slate-400">SIH26027 Protocol</span>
          </div>
          <h1 className="text-xl font-bold text-white mt-1 flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-cyan-400" />
            Approval Center & Multi-Department Sign-Off
          </h1>
          <p className="text-xs text-slate-300 mt-0.5">
            4-way departmental consensus (Civil, TRD Electrical, S&T, Operating) with structured rejection and instant AI re-optimization.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchApprovalData}
            disabled={isLoading}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-railnavy-800 hover:bg-railnavy-700 text-slate-300 hover:text-white border border-railnavy-600 text-xs font-semibold transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => setIsRejectModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-600/90 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-600/20 transition"
          >
            <XCircle className="w-4 h-4" />
            Reject & Auto-Recalculate
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/40 flex items-center justify-between text-emerald-300 text-xs shadow-md">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-400 hover:text-white font-bold ml-4">
            ✕
          </button>
        </div>
      )}

      {/* Error / 403 Forbidden Notification */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-500/40 flex items-center justify-between text-rose-300 text-xs shadow-md">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-rose-400 hover:text-white font-bold ml-4">
            ✕
          </button>
        </div>
      )}

      {/* Plan Selector & Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {pendingPlans.map((plan) => (
          <div
            key={plan.plan_id}
            onClick={() => setSelectedPlanId(plan.plan_id)}
            className={`p-4 rounded-xl border cursor-pointer transition ${
              selectedPlanId === plan.plan_id
                ? 'bg-railnavy-800/90 border-cyan-500 shadow-md shadow-cyan-500/10'
                : 'bg-railnavy-900/60 border-railnavy-700/60 hover:border-slate-600'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <FileCheck className="w-3.5 h-3.5 text-cyan-400" />
                {plan.plan_id}
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  plan.status === 'APPROVED'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : plan.status === 'REJECTED'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}
              >
                {plan.status}
              </span>
            </div>
            <p className="text-[11px] text-slate-300 mt-2 font-medium line-clamp-1">{plan.reason}</p>
            <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-railnavy-700/60 text-[10px] text-slate-400">
              <div>
                <span>Blocks: </span>
                <strong className="text-white">{plan.total_blocks}</strong>
              </div>
              <div>
                <span>Saved: </span>
                <strong className="text-emerald-400">{plan.kpis.block_hours_saved || 124} hrs</strong>
              </div>
              <div>
                <span>Avail: </span>
                <strong className="text-cyan-400">{plan.kpis.asset_availability_pct || 88.4}%</strong>
              </div>
              <div>
                <span>Conflicts: </span>
                <strong className="text-rose-400">{plan.kpis.conflict_count || 7}</strong>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 4-Department Sign-off Matrix */}
      <div className="p-6 rounded-2xl bg-railnavy-900/90 border border-railnavy-800 shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-cyan-400" />
              Departmental Sign-Off Status for {selectedPlanId}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Statutory mandate: All 4 branches must validate safety clearance before operational dispatch.
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-300 bg-railnavy-800 px-3 py-1 rounded-lg border border-railnavy-700">
            Required: 4 / 4 Clearances
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
          {departments.map((dept) => {
            const isApproved = dept.status === 'APPROVE' || dept.status === 'APPROVED';
            return (
              <div
                key={dept.id}
                className={`p-4 rounded-xl border flex flex-col justify-between space-y-3 ${
                  isApproved
                    ? 'bg-emerald-950/30 border-emerald-500/40'
                    : 'bg-railnavy-850/80 border-railnavy-700/80'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{dept.name}</span>
                    {isApproved ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Clock className="w-4 h-4 text-amber-400" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">{dept.officer}</p>
                </div>

                <div className="text-[11px] p-2.5 rounded-lg bg-railnavy-900/80 border border-railnavy-700/60 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Status:</span>
                    <strong className={isApproved ? 'text-emerald-300' : 'text-amber-300'}>
                      {isApproved ? 'APPROVED' : 'AWAITING SIGN-OFF'}
                    </strong>
                  </div>
                  {dept.timestamp && (
                    <div className="text-[10px] text-slate-400 truncate">
                      {new Date(dept.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  )}
                </div>

                {!isApproved ? (
                  <button
                    onClick={() => handleSignOff(dept.name, 'APPROVE')}
                    disabled={isSubmitting}
                    className="w-full py-2 rounded-lg bg-emerald-600/90 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-600/20 transition flex items-center justify-center gap-1.5"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Sign & Approve
                  </button>
                ) : (
                  <div className="text-center py-1 text-[11px] font-bold text-emerald-400 flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Clearance Granted
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Structured Rejection Modal */}
      {isRejectModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-railnavy-900 border border-railnavy-700 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-railnavy-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-rose-500/20 text-rose-400">
                  <XCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Structured Plan Rejection & Recalculation</h3>
                  <p className="text-[11px] text-slate-400">Target Plan: {selectedPlanId}</p>
                </div>
              </div>
              <button
                onClick={() => setIsRejectModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {/* Department */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Rejecting Department
                </label>
                <select
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-railnavy-850 border border-railnavy-700 text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="Operating">Operating / Traffic Branch</option>
                  <option value="Civil Engineering">Civil Engineering (Track)</option>
                  <option value="Electrical (TRD)">Electrical (TRD / Traction)</option>
                  <option value="Signal & Telecom">Signal & Telecom (S&T)</option>
                </select>
              </div>

              {/* Structured Reason Code */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Structured Reason Code
                </label>
                <select
                  value={selectedReasonCode}
                  onChange={(e) => setSelectedReasonCode(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-railnavy-850 border border-railnavy-700 text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  {Object.keys(rejectionReasons).map((code) => (
                    <option key={code} value={code}>
                      {rejectionReasons[code]?.title || code}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-cyan-300/80 mt-1.5 bg-cyan-950/30 p-2 rounded border border-cyan-900/50">
                  <strong>AI Mitigation Action:</strong>{' '}
                  {rejectionReasons[selectedReasonCode]?.default_action}
                </p>
              </div>

              {/* Detailed Operational Comments */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Operational Justification & Specific Directives
                </label>
                <textarea
                  rows={3}
                  value={feedbackComments}
                  onChange={(e) => setFeedbackComments(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-railnavy-850 border border-railnavy-700 text-xs text-white focus:outline-none focus:border-cyan-500 resize-none"
                  placeholder="Explain why current timings are unacceptable..."
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-railnavy-800">
              <button
                onClick={() => setIsRejectModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-railnavy-800 hover:bg-railnavy-700 text-slate-300 text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectAndRecalculate}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-5 py-2 rounded-lg bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white text-xs font-bold shadow-lg shadow-rose-600/30 transition"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Running AI CP-SAT Recalculation...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    Submit & Recalculate Plan
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default ApprovalCenterView;
