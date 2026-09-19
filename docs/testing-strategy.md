# RAILOPT AI — Quality Assurance & Testing Strategy
**SIH26027 — Multi-Tier Verification, Automated Testing & Acceptance Framework**

---

## 1. Testing Philosophy & Quality Gates

To ensure RAILOPT AI delivers reliable, mission-critical operations research software for Indian Railways, we adopt a **strict 4-tier verification pyramid**:

1. **Tier 1: Core Mathematical & Algorithmic Unit Tests** (Priority formula, risk regression, 14-point conflict detection, resource constraint feasibility).
2. **Tier 2: Operations Research & Solver Optimality Tests** (OR-Tools CP-SAT constraint satisfaction, zero-collision proofs, minimal unsatisfied core diagnostics).
3. **Tier 3: Backend REST API & State Integration Tests** (FastAPI test client, SQLAlchemy transactions, approval validation gates, immutable versioning, audit logging).
4. **Tier 4: End-to-End Browser Acceptance Tests** (32-step hackathon demo story, visual regression, theme toggling, error state handling).

---

## 2. Test Suites & Coverage Matrix

### 2.1 Tier 1: Core Unit Tests (`tests/unit/`)

| Test File | Target Module | Scope & Verification Checks |
|---|---|---|
| `test_priority_engine.py` | `rail_opti.engines.priority` | Verifies exact formula: $0.30S + 0.20P_f + 0.15C_a + 0.15U_m + 0.10I_o + 0.10D_s$. Asserts normalized 0–100 bounds, priority banding (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`), and safety override escalation when $S \ge 90$. |
| `test_risk_engine.py` | `rail_opti.engines.risk` | Tests failure probability estimation from age, GMT, and defect history. Validates output risk levels and natural language explanation generation. |
| `test_conflict_engine.py` | `rail_opti.engines.conflicts` | Tests all 14 conflict categories (Train vs Maint, Maint vs Maint, Resource Over-allocation, Department OHE shutoff, Safety Buffers, Specialist Deficits). |
| `test_consolidation_engine.py` | `rail_opti.engines.consolidation` | Tests detection of compatible Engineering + TRD + S&T tasks on the same section and calculates block hours saved. |
| `test_resource_engine.py` | `rail_opti.engines.resources` | Validates resource demand vs. depot inventory. Verifies hard constraint failure when mandatory machine/specialist is missing. |

### 2.2 Tier 2: Optimization & Solver Tests (`tests/optimizer/`)

| Test File | Target Module | Scope & Verification Checks |
|---|---|---|
| `test_cpsat_solver.py` | `rail_opti.optimizer.cpsat` | Verifies solver finds `OPTIMAL` or `FEASIBLE` schedule on reference corridor within 2.0 seconds. |
| `test_safety_invariants.py` | `rail_opti.optimizer.constraints` | **Zero-Collision Guarantee**: Asserts no maintenance block overlaps with scheduled trains or violates $\Delta_{buffer}$ safety headways. |
| `test_infeasible_scenarios.py` | `rail_opti.optimizer.infeasibility` | Simulates impossible constraints (e.g., 5-hour block in a 30-minute train gap). Asserts solver returns `INFEASIBLE`, isolates blocking constraints, and never fabricates a plan. |
| `test_reoptimization.py` | `rail_opti.optimizer.reoptimizer` | Injects human rejection feedback ("Exclude 14:00-18:00 window") and tests that re-optimized Plan V2 strictly obeys the new exclusion constraint. |

### 2.3 Tier 3: API & State Integration Tests (`tests/api/`)

| Test File | Target Module | Scope & Verification Checks |
|---|---|---|
| `test_auth_rbac.py` | `/api/auth` | Tests JWT token issuance, password hashing (bcrypt), and role-based endpoint protection (`CONTROL_OFFICE`, `ENGINEERING`, `TRD`, `SNT`, `ADMIN`). |
| `test_maintenance_api.py` | `/api/maintenance` | Tests CRUD operations on maintenance tasks, defect linking, and pagination. |
| `test_approvals_api.py` | `/api/approvals` | Tests approval validation gates: asserts `APPROVE` fails if critical conflicts exist; asserts `REJECT_AND_RECALCULATE` generates Plan V2 and records audit entry. |
| `test_versioning_api.py` | `/api/versions` | Tests plan immutability, version parent-child links, and version diff comparison. |
| `test_audit_api.py` | `/api/audit` | Asserts all sensitive actions create append-only audit log records. |

### 2.4 Tier 4: Browser Acceptance & UI Tests (`tests/e2e/`)

| Test Scenario | Tools | Verification Criteria |
|---|---|---|
| **Main 32-Step Demo Story** | Playwright / Vitest | Automated execution of the entire demo script from login to final locked approval. |
| **Visual Fidelity & Layout** | Visual Snapshot | Validates UI accurately replicates the dark-mode operations control center reference design. |
| **Responsive & Performance** | Lighthouse / Profiler | Ensures zero unnecessary React re-renders on large tables and Gantt chart scrolling. |

---

## 3. Test Execution Commands

```bash
# 1. Run all unit tests
pytest tests/unit -v

# 2. Run optimization solver tests
pytest tests/optimizer -v

# 3. Run API integration tests with coverage
pytest tests/api --cov=rail_opti --cov-report=term-missing

# 4. Run full backend test suite
pytest -v

# 5. Run frontend component tests
cd frontend && npm run test

# 6. Run end-to-end browser tests
cd frontend && npx playwright test
```

---

## 4. Invariant Assertion Checklist

Before marking any development phase complete, the following invariants must pass:
- [ ] **Priority Score Invariant**: Always within $[0.0, 100.0]$ with sum of factor contributions equaling total score within floating-point tolerance ($\epsilon = 10^{-4}$).
- [ ] **Safety Override Invariant**: Any task with Safety Risk $\ge 90$ or safety-critical defect is flagged `CRITICAL` and scheduled with priority.
- [ ] **Safety Buffer Invariant**: Every block maintains at least $\Delta_{buffer} = 15$ min clearance before and after scheduled train paths.
- [ ] **Resource Non-Negativity Invariant**: Allocated units of any resource at any minute $t$ never exceed total operational inventory.
- [ ] **Version Immutability Invariant**: Once a plan version is marked `APPROVED` or `LOCKED`, no updates are permitted via API.
- [ ] **Audit Trail Invariant**: Every state-changing API call generates a corresponding row in `audit_logs`.
