# RAILOPT AI — Main Demonstration Scenario Walkthrough
**SIH26027 — End-to-End Hackathon Presentation Script & Verification Guide**

---

## 1. Overview

This document specifies the exact 32-step user journey for presenting **RAILOPT AI** to evaluators and railway officials. It guarantees that every screen, button, metric, optimization algorithm, and backend transaction functions flawlessly with real data and no mocked visual trickery.

---

## 2. Step-by-Step Walkthrough

| Step | Persona / Screen | User Action | System State & Display | Underlying Engineering |
|---|---|---|---|---|
| **1** | Control Center Dashboard | Open application URL (`localhost:5173`) | Premium dark-mode operations center loads. Top bar displays "DEMO / SIMULATED DATA" badge and user "Admin / System Administrator". | React + Tailwind layout initializes; fetches `/api/dashboard/kpis`. |
| **2** | Dashboard KPI Grid | View Asset Availability | Displays **88% Asset Availability** (+4% vs last week), 12 Critical Tasks, 28 Active Blocks, 7 Conflicts, 124 Block Hours Saved. | Aggregated from live database records via SQLAlchemy queries. |
| **3** | Critical Tasks Table | Click task **MT-001 (Track 7A)** | Task MT-001 highlighted: Section `NDLS-ALD`, Dept `ENG`, Priority `CRITICAL`, Risk `84%`, Status `AI SCHEDULED`. | Client queries `/api/maintenance/MT-001`. |
| **4** | AI Operations Intelligence | Click "View Details" on Risk card | Modal opens showing failure probability breakdown and historical evidence. | Fetches `/api/assets/AST-TRK-7A/health`. |
| **5** | Risk Engine Modal | Inspect Failure Probability | Displays **84% failure probability**, 3 active USFD flaw defects, 42 overdue days past tamping cycle, high GMT traffic. | Computed by Asset Health & Risk ML regression. |
| **6** | Priority Engine View | Navigate to Priority tab | Shows exact 6-factor formula breakdown totaling **89.3/100 (CRITICAL)**: Safety Risk (28.8), Failure Prob (16.8), Asset Crit (11.7), Urgency (10.8), Traffic (6.5), Defect (8.3). | Real-time calculation from `priority_scores` entity. |
| **7** | Resource Management | View Resource Requirements for MT-001 | Required: Manpower (15/15), Supervisor (1/1), CSM Tamping Machine (1/0 ⚠️), Maintenance Vehicle (1/1), Safety Equipment (5/5). | Fetches `/api/maintenance/MT-001/resources`. |
| **8** | Resource Management | Observe Shortage Alert | Red warning banner: *"Resource Constraint Detected: Track Machine [Required: 1, Available: 0] at Section NDLS-ALD"*. "View Alternatives" button active. | Real-time capacity check across section depots. |
| **9** | Block Planning | Navigate to "Automatic Block Planner" | Displays corridor selector (`Delhi - Mumbai`), planning horizon (`Next 7 Days`), and optimization parameters. | Loads network topology and active schedule constraints. |
| **10** | Automatic Block Planner | Click **"Run Optimization (OR-Tools CP-SAT)"** | Loading spinner indicates solver execution. Solver finishes in ~1.4s with status `OPTIMAL`. | Backend triggers Google OR-Tools CP-SAT formulation; outputs Plan V1. |
| **11** | Automatic Block Planner | View Generated Plan V1 | Plan V1 generates 28 blocks, scheduling 84 tasks and deferring 4 low-priority tasks with full explanation. | Database persists `optimization_runs` and `plan_versions` (V1). |
| **12** | Gantt View | Inspect Train & Maintenance Timeline | Interactive timeline shows train paths (Rajdhani, Freight SZ314) and maintenance blocks color-coded by department. | Multi-track Gantt timeline rendered via React + SVG/Canvas. |
| **13** | Gantt View | Locate Conflict on Section ALD-BPL | High-severity amber conflict badge appears where Block `BLK-ENG-102` overlaps with incoming Freight Train `SZ314`. | Conflict Detection Engine flags Section Occupancy Conflict. |
| **14** | Gantt View | View AI Resolution Proposal | Hovering over conflict shows AI recommendation: *"Shift Block BLK-ENG-102 by +45 min to clear Freight SZ314 operating window"*. | Automated resolution generator proposes zero-conflict window. |
| **15** | Multi-Department Consolidation | Open "Consolidation" View | Shows unified block `BLK-CON-004` on Section `NDLS-ALD` combining **ENG-102** (Tamping), **TRD-045** (OHE Inspection), and **S&T-087** (Point Machine Testing). Saved 4.5 hours! | Consolidation Engine computes overlapping window & shared safety isolation. |
| **16** | What-If Simulator | Navigate to "What-If Simulator" | Simulator opens with baseline Plan V1 loaded. | Loads baseline parameters from `/api/simulation/baseline`. |
| **17** | What-If Simulator | Adjust Sliders: Train Delay +30 min, Heavy Traffic | Controller simulates 30-min Rajdhani delay and sets traffic intensity to "High". | Disruption parameters bound to simulation state. |
| **18** | What-If Simulator | Click **"Recalculate Scenario"** | Engine re-runs CP-SAT under disrupted operational constraints in 1.1s. | Runs scenario optimization without modifying baseline database. |
| **19** | What-If Simulator | View Side-by-Side Comparison | Displays: Baseline vs Scenario metrics (Asset Availability: 88% vs 84%, Conflicts: 0 vs 2, Block Hours: 124h vs 108h). | Client renders comparative delta charts using Recharts. |
| **20** | Approval Center | Navigate to "Approval Center" | Approval card for Plan V1 displayed. Checklist validates resource feasibility and safety status. | Controller evaluates plan for operational sign-off. |
| **21** | Approval Center | Click **"Reject & Recalculate"** | Rejection modal opens requiring structured reason and feedback. | Strict HITL governance workflow initiated. |
| **22** | Rejection Modal | Select Reason: *"Expected heavy traffic during proposed maintenance window"* | Dropdown selects code `HEAVY_TRAFFIC_CONFLICT`. | Rejection taxonomy captured. |
| **23** | Rejection Modal | Enter Feedback: *"Keep this maintenance window outside the heavy traffic period (14:00 - 18:00)"* | Free-text feedback entered into comment box. | Feedback serialized into constraint generator. |
| **24** | Rejection Modal | Submit Rejection & Recalculate | System records rejection in audit log, transforms feedback into exclusion constraint, and invokes CP-SAT. | Backend creates `approvals` rejection record and generates Plan V2. |
| **25** | Approval Center | Inspect Plan V2 | Plan V2 generated with parent `PLN-V1`. Status: `PENDING_REVIEW`. | Plan versioning creates immutable version record. |
| **26** | Plan Versions | Click **"Compare V1 vs V2"** | Diff viewer highlights Block `BLK-ENG-102` moved from 15:00 to 19:30. Zero conflicts during heavy traffic window. | Computes set-theoretic and temporal diff between V1 and V2. |
| **27** | Plan Versions | Read AI Explanation | Banner explains: *"Plan V2 relocated Block BLK-ENG-102 to 19:30 to accommodate reviewer instruction avoiding 14:00-18:00 heavy traffic."* | Natural language explainability engine generates rationale. |
| **28** | Approval Center | Click **"Modify & Approve"** | Controller adjusts block duration from 180 min to 165 min to give extra train buffer. | Interactive slider updates block end time. |
| **29** | Approval Center | Validation Gatekeeper Runs | All 8 validation checks pass: Resource Validated (✅), Safety Validated (✅), Interlocking Validated (✅), Corridor Clear (✅). | Backend runs strict `/api/approvals/validate` suite. |
| **30** | Approval Center | Click **"Approve Plan"** | System marks Plan V2 as `APPROVED` and locks it from further edits. | Immutable state transition committed to DB. |
| **31** | Plan Versions | Verify Locked Status | Plan V2 shows green "LOCKED & AUTHORIZED" badge. Edit buttons disabled. | Role-based authorization locks operational plan. |
| **32** | Audit Log | Navigate to "Audit Log" | Complete trace visible: User, Timestamp, Action (`REJECT_PLAN`, `REOPTIMIZE`, `MODIFY_BLOCK`, `APPROVE_PLAN`), Diff JSON. | Append-only audit record saved in `audit_logs` table. |

---

## 3. Evaluator Q&A Preparedness

- **Q: Does this connect to live Indian Railways databases?**  
  *A: No. As prominently indicated by our "DEMO / SIMULATED DATA" badge, this prototype integrates with realistic simulation gateways (TMS, SMMS, TDMS, COA) that replicate Indian Railways data structures without unauthorized live network access.*

- **Q: What happens if OR-Tools cannot find a feasible block?**  
  *A: RAILOPT AI never fabricates a schedule. It isolates the minimal unsatisfied constraints (e.g., machine deficit or train congestion) and presents actionable relaxation suggestions to the human controller.*

- **Q: Can AI authorize track blocks autonomously?**  
  *A: Never. Indian Railways safety rules require Human-in-the-Loop authorization. AI proposes and re-optimizes; Section Controllers and SrDOM verify and approve.*
