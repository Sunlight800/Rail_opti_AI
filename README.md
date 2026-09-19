# RAILOPT AI 🚆⚡

> **AI-Powered Automatic Block Planning to Maximize Asset Availability for Train Operations on Indian Railways**  
> **Problem Statement:** SIH26027  
> **Ministry:** Ministry of Railways | **Domain:** Software / Transportation & Logistics

---

> [!IMPORTANT]
> **STATUTORY DISCLAIMER:**  
> **DEMO / SIMULATED DATA — NOT CONNECTED TO LIVE INDIAN RAILWAYS SYSTEMS**  
> *This platform operates exclusively on realistic simulated datasets adhering strictly to Indian Railways operating codes, IRSEM, IRPWM, and ACTM guidelines.*

---

## 1. Executive Summary & Objective

Indian Railways operates one of the densest rail networks in the world. Maintenance blocks (traffic blocks, power isolations, and integrated shadow windows) are essential to prevent derailments and infrastructure failures, but traditional manual block allotment often conflicts with high-priority passenger and freight paths.

**RAILOPT AI** solves this trade-off using a multi-objective Operations Research formulation solved via **Google OR-Tools CP-SAT**:

$$\max(\text{Asset Availability}) + \min(\text{Maintenance Downtime}) + \min(\text{Train Disruption}) + \text{Optimize}(\text{Resource Utilization}) + \max(\text{Task Completion})$$

---

## 2. Key Capabilities & Architecture

RAILOPT AI is architected as an end-to-end, reactive platform with **no static mockups or fake buttons**. Every interaction follows:

$$\text{User Action} \longrightarrow \text{Frontend (React)} \longrightarrow \text{FastAPI REST} \longrightarrow \text{SQLAlchemy ORM} \longrightarrow \text{OR-Tools CP-SAT / ML Risk} \longrightarrow \text{DB State} \longrightarrow \text{Live UI Update}$$

### 🏛️ 17 Integrated Operational Modules

1. **Operations Control Center (Dashboard)**: High-density dark-mode command center displaying 92% Network Health, 88% Asset Availability, active corridor metrics, and 24-hour train/block timeline.
2. **Data Integration Gateway**: Live simulated gateways for **TMS** (Track Management), **SMMS** (Signaling), **TDMS** (Traction Distribution), and **COA** (Control Office Application) with sync triggers and data freshness telemetry.
3. **Maintenance & Asset Registry**: Comprehensive catalog of 53+ track, OHE, and signaling assets with USFD defect tracking, urgency rankings, and inspection cycles.
4. **AI Risk & Asset Health Engine**: ML failure probability estimation (84% on Track 7A) derived from ultrasonic flaw density, gross million tonnes (GMT) traffic, and maintenance history.
5. **Priority Engine**: Real-time 6-factor composite priority formula ($0.30S + 0.20P_f + 0.15C_a + 0.15U_m + 0.10I_o + 0.10D_s$) with safety override escalation.
6. **Resource Management**: Tracking of machinery (BCM, CSM, Tower Wagons), gang crews, supervisors, and safety equipment with depot-level feasibility and alternative allocation.
7. **Network Topology & Operations**: Delhi-Mumbai corridor GIS topology across 10 sections with live train timetables (Rajdhani Express, Bhopal Shatabdi, Container Freight).
8. **14-Category Conflict Detection Engine**: Automated scanning of section occupancy, train headway overlap, resource double-booking, and power isolation boundaries.
9. **Google OR-Tools CP-SAT Optimizer**: Exact mathematical constraint programming solver that balances priority weights, consolidation bonuses, and disruption penalties.
10. **Automatic Block Planning & Multi-Track Gantt**: Interactive 24-hour visual schedule with train paths, maintenance blocks, and AI conflict resolution overlays.
11. **Multi-Department Consolidation Engine**: Correlates Civil, Electrical (TRD), and S&T tasks into single integrated blocks, saving 124+ block hours.
12. **What-If Scenario Simulator**: Simulates operational disruptions (freight delays, machine breakdowns, weather surges) with ripple effect cascades and contingency recommendations.
13. **Human-in-the-Loop Approval Center**: 4-way statutory departmental sign-off (Civil, Electrical, S&T, Operating) with strict HITL governance.
14. **Structured Rejection & Auto-Recalculation**: Rejection taxonomy (`TRAIN_DELAY_UNACCEPTABLE`, `RESOURCE_UNAVAILABLE`, etc.) triggering automated constraint-adjusted re-optimization.
15. **Plan Versioning & Visual Comparison**: Side-by-side Plan V1 vs Plan V2 KPI deltas, block shift diffs, and operational lock/activation.
16. **Operations Research Analytics Scorecard**: 7-day rolling KPI trends, departmental workload volume, and section congestion indices rendered via Recharts.
17. **Statutory Reports & Immutable Audit Trail**: Generates daily execution dossiers, 7-day rolling corridor plans, CSV/JSON exports, and cryptographic audit logs.

---

## 3. Technology Stack

- **Backend**: Python 3.14, FastAPI, SQLAlchemy 2.0, SQLite, Google OR-Tools CP-SAT, Pydantic v2, Pytest.
- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Lucide React, Recharts.
- **Algorithms**: Constraint Satisfaction Problem (CSP) formulation, Integer Linear Programming (ILP), Heuristic Conflict Resolution, Multi-Factor Composite Scoring.

---

## 4. Quick Start & Execution

### Prerequisites
- Python 3.10+
- Node.js v18+

### Backend Setup
```bash
# Install Python dependencies
pip install -r requirements.txt

# Run FastAPI backend server (port 8000)
uvicorn rail_opti.api.app:app --host 127.0.0.1 --port 8000 --reload
```
API Documentation will be available at `http://127.0.0.1:8000/api/docs`.

### Frontend Setup
```bash
cd frontend

# Install npm packages
npm install

# Start Vite development server (port 5173)
npm run dev -- --host 127.0.0.1 --port 5173
```
Open `http://127.0.0.1:5173` in your browser.

---

## 5. Verification & Test Suite

The system includes **112 automated unit, integration, and end-to-end scenario tests** covering all 23 implementation phases.

```bash
# Execute entire test suite
pytest tests/ -v
```

### Test Suite Summary
| Test Module | Coverage | Status |
|---|---|---|
| `test_skeleton.py` | Config, database connection, health checks | ✅ 3 Passed |
| `test_database.py` | 38 SQLAlchemy models, relationships, seed data | ✅ 6 Passed |
| `test_dashboard_api.py` | Dashboard KPIs, timeline, auth routes | ✅ 4 Passed |
| `test_data_integration.py` | TMS, SMMS, TDMS, COA simulators and sync | ✅ 5 Passed |
| `test_maintenance_api.py` | Tasks, assets, health, status transitions | ✅ 6 Passed |
| `test_risk_engine.py` | Asset health calculation, ML risk assessment | ✅ 4 Passed |
| `test_priority_formula.py` | 6-factor composite priority, safety overrides | ✅ 6 Passed |
| `test_resource_planner.py` | Resource feasibility, availability, alternatives | ✅ 8 Passed |
| `test_operations_topology.py` | Corridor topology, section GIS, train schedules | ✅ 8 Passed |
| `test_conflict_detector.py` | 14-category conflict engine, resolution options | ✅ 8 Passed |
| `test_cpsat_solver.py` | Google OR-Tools solver execution, infeasibility diagnosis | ✅ 6 Passed |
| `test_block_planner.py` | Block schedule generation, Gantt timeline | ✅ 6 Passed |
| `test_consolidation.py` | Multi-department opportunity detection, block merge | ✅ 6 Passed |
| `test_what_if.py` | Disruption simulation, KPI deltas, ripple cascade | ✅ 5 Passed |
| `test_approval_workflow.py` | 4-dept sign-offs, rejection, recalculation, activation | ✅ 9 Passed |
| `test_analytics_reports_audit.py`| KPI trends, report generation, audit trail | ✅ 7 Passed |
| `test_demo_scenario.py` | **Full 32-step end-to-end hackathon demo verification** | ✅ 15 Passed |
| **Total** | **17 Test Suites Across All Modules** | **112 / 112 Passed (100%)** |

---

## 6. End-to-End Demonstration Scenario

Refer to [`docs/demo-scenario.md`](docs/demo-scenario.md) for the step-by-step evaluator presentation script:
1. **00:00 - 01:00**: Operations Center Overview & Data Integration Gateway.
2. **01:00 - 02:30**: AI Risk Assessment on Track Section 7A (84% failure risk) & Priority Breakdown (89.3/100).
3. **02:30 - 04:00**: Resource Shortage Detection & Alternative Machinery Suggestion.
4. **04:00 - 05:30**: Google OR-Tools CP-SAT Solve, Multi-Track Gantt Timeline & Conflict Resolution.
5. **05:30 - 07:00**: Multi-Department Consolidation (4.5 hours saved) & What-If Disruption Simulation.
6. **07:00 - 08:30**: 4-Department Sign-off, Structured Rejection (`TRAIN_DELAY_UNACCEPTABLE`), AI Recalculation (Plan V2), Comparison & Activation.
7. **08:30 - 10:00**: Analytics Scorecard, Executive Dossier Export, and Immutable Audit Log Verification.

---

## 7. License & Attribution

Built for the **Smart India Hackathon (SIH26027)** under the Ministry of Railways, Government of India.
Developed by Team RAILOPT AI.
