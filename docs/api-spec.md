# RAILOPT AI — REST API Specification
**SIH26027 — Enterprise API Endpoints & Request/Response Contracts**

---

## 1. Authentication & RBAC (`/api/auth`)

### `POST /api/auth/login`
- **Description**: Authenticate user and receive JWT bearer token.
- **Request Body**:
  ```json
  {
    "username": "demo@railopt.ai",
    "password": "demoPassword123"
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "access_token": "eyJhbGciOi...",
    "token_type": "bearer",
    "user": {
      "id": "USR-001",
      "username": "demo@railopt.ai",
      "full_name": "Shri Rajesh Sharma",
      "role": "CONTROL_OFFICE",
      "department": "OPT"
    }
  }
  ```

### `GET /api/auth/me`
- **Description**: Get current user profile and role permissions.
- **Headers**: `Authorization: Bearer <token>`
- **Response `200 OK`**: User profile object.

---

## 2. Dashboard & Overview (`/api/dashboard`)

### `GET /api/dashboard/kpis`
- **Description**: High-level metrics for the Railway Operations Control Center.
- **Response `200 OK`**:
  ```json
  {
    "critical_tasks": { "count": 12, "delta": "+3 vs yesterday" },
    "active_blocks": { "count": 28, "delta": "+5 vs yesterday" },
    "asset_availability": { "percentage": 88.4, "delta": "+4% vs last week" },
    "conflicts": { "count": 7, "delta": "-2 vs yesterday" },
    "pending_approvals": { "count": 5, "delta": "+2 vs yesterday" },
    "block_hours_saved": { "hours": 124, "delta": "+18% vs last week" },
    "network_health_score": 92,
    "active_corridor": {
      "name": "Delhi - Mumbai",
      "traffic_status": "NORMAL",
      "active_blocks_count": 3
    }
  }
  ```

### `GET /api/dashboard/timeline`
- **Description**: Gantt timeline data for today's trains, active maintenance blocks, and section statuses.
- **Query Params**: `corridor_id` (optional), `date` (ISO date).
- **Response `200 OK`**: Multi-track timeline entries.

---

## 3. Data Integration Gateway (`/api/data-integration`)

### `GET /api/data-integration/status`
- **Description**: Status of simulated integration adapters (TMS, SMMS, TDMS, COA).
- **Response `200 OK`**:
  ```json
  [
    {
      "system": "TMS",
      "full_name": "Train Management System",
      "status": "CONNECTED_DEMO",
      "last_sync": "2m ago",
      "record_count": 12480,
      "data_quality_pct": 98.5
    },
    {
      "system": "SMMS",
      "full_name": "Stores & Maintenance Management System",
      "status": "CONNECTED_DEMO",
      "last_sync": "5m ago",
      "record_count": 9730,
      "data_quality_pct": 97.0
    },
    {
      "system": "TDMS",
      "full_name": "Track Defect Management System",
      "status": "CONNECTED_DEMO",
      "last_sync": "1m ago",
      "record_count": 9310,
      "data_quality_pct": 99.1
    },
    {
      "system": "COA",
      "full_name": "Control Office Application",
      "status": "CONNECTED_DEMO",
      "last_sync": "3m ago",
      "record_count": 15820,
      "data_quality_pct": 96.8
    }
  ]
  ```

### `POST /api/data-integration/upload-csv`
- **Description**: Ingest CSV data for assets, tasks, or timetables.
- **Multipart Form**: `file`, `dataset_type` (`assets` | `tasks` | `trains`).

---

## 4. Maintenance Tasks & Assets (`/api/maintenance`, `/api/assets`)

### `GET /api/maintenance`
- **Query Params**: `department`, `priority`, `status`, `page`, `limit`.
- **Response `200 OK`**: Paginated list of tasks.

### `GET /api/maintenance/{id}`
- **Description**: Full task detail including defect info, required resources, priority breakdown, and risk assessment.

### `POST /api/maintenance`
- **Description**: Create or submit a new maintenance block request.

### `GET /api/assets/{id}/health`
- **Description**: Computed asset health, failure probability, and historical inspection log.

---

## 5. Priority & Risk Intelligence (`/api/priority`, `/api/risk`)

### `GET /api/priority/{task_id}`
- **Description**: 6-factor priority breakdown with exact weights, contributions, and AI explanation:
  ```json
  {
    "task_id": "MT-001",
    "total_priority_score": 89.3,
    "category": "CRITICAL",
    "factors": [
      { "name": "Safety Risk", "value": 96, "weight": 0.30, "contribution": 28.8 },
      { "name": "Failure Probability", "value": 84, "weight": 0.20, "contribution": 16.8 },
      { "name": "Asset Criticality", "value": 78, "weight": 0.15, "contribution": 11.7 },
      { "name": "Maintenance Urgency", "value": 72, "weight": 0.15, "contribution": 10.8 },
      { "name": "Traffic Impact", "value": 65, "weight": 0.10, "contribution": 6.5 },
      { "name": "Defect Severity", "value": 83, "weight": 0.10, "contribution": 8.3 }
    ],
    "ai_rationale": "High safety risk (96/100) and elevated failure probability (84%) on critical track segment 7A make this task mandatory."
  }
  ```

---

## 6. Resource Management (`/api/resources`)

### `GET /api/resources/availability`
- **Description**: Overall resource utilization, category breakdown, and upcoming shortages.
- **Response `200 OK`**:
  ```json
  {
    "overall_utilization_pct": 76,
    "categories": {
      "manpower": 82,
      "machines": 68,
      "vehicles": 71,
      "materials": 59,
      "safety_equipment": 93
    },
    "upcoming_shortages": [
      { "resource": "Track Machine (CSM-01)", "deficit": 1, "time_to_shortage": "2h" },
      { "resource": "Maintenance Vehicle (T-Van)", "deficit": 1, "time_to_shortage": "4h" },
      { "resource": "Specialist (USFD Tester)", "deficit": 2, "time_to_shortage": "8h" }
    ]
  }
  ```

---

## 7. Conflict Detection (`/api/conflicts`)

### `GET /api/conflicts`
- **Description**: Active detected conflicts across the network.
- **Query Params**: `plan_version_id`, `severity`.
- **Response `200 OK`**: List of conflicts with root-cause analysis and resolution options.

---

## 8. Multi-Department Consolidation (`/api/consolidation`)

### `GET /api/consolidation/opportunities`
- **Description**: List of potential, accepted, and rejected consolidation opportunities across Engineering, TRD, and S&T.
- **Response `200 OK`**:
  ```json
  [
    {
      "id": "CON-001",
      "section_id": "SEC-NDLS-ALD",
      "tasks": ["MT-001 (ENG)", "MT-002 (TRD)", "MT-003 (SNT)"],
      "block_type": "INTEGRATED_SHADOW_BLOCK",
      "estimated_block_hours_saved": 4.5,
      "status": "RECOMMENDED",
      "reason": "OHE power isolation for TRD aligns with track tamping window, allowing S&T point machine inspection without extra disruption."
    }
  ]
  ```

---

## 9. Block Planner & OR-Tools Optimization (`/api/planner`, `/api/optimization`)

### `POST /api/optimization/run`
- **Description**: Trigger Google OR-Tools CP-SAT automatic block planning.
- **Request Body**:
  ```json
  {
    "horizon": "NEXT_7_DAYS",
    "corridor_ids": ["COR-DEL-BOM"],
    "weights": {
      "priority_coverage": 10.0,
      "consolidation": 5.0,
      "disruption_penalty": 20.0
    }
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "optimization_run_id": "OPT-2025-0520-001",
    "solver_status": "OPTIMAL",
    "execution_time_ms": 1420,
    "plan_version_id": "PLN-V1",
    "summary": {
      "scheduled_tasks_count": 84,
      "deferred_tasks_count": 4,
      "total_blocks_count": 28,
      "consolidated_blocks_count": 9,
      "block_hours_saved": 124
    }
  }
  ```

---

## 10. What-If Simulator (`/api/simulation`)

### `POST /api/simulation/run`
- **Description**: Simulate operational disruptions (train delays, traffic spikes, machine outages) and compare with baseline plan.
- **Request Body**:
  ```json
  {
    "baseline_plan_version_id": "PLN-V1",
    "train_delay_minutes": 30,
    "maintenance_duration_increase_pct": 15,
    "traffic_level": "HIGH",
    "unavailable_resource_ids": ["RES-MCH-CSM-01"]
  }
  ```
- **Response `200 OK`**: Side-by-side comparison of baseline vs simulated plan KPIs and affected blocks.

---

## 11. Human Approval & Re-Optimization (`/api/approvals`, `/api/versions`)

### `POST /api/approvals/{plan_version_id}/action`
- **Description**: Execute human governance action.
- **Request Body**:
  ```json
  {
    "action": "REJECT_AND_RECALCULATE",
    "rejection_code": "HEAVY_TRAFFIC_CONFLICT",
    "feedback": "Move maintenance block outside the heavy goods traffic window (14:00 - 18:00)."
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "previous_version_id": "PLN-V1",
    "new_version_id": "PLN-V2",
    "status": "REOPTIMIZED",
    "ai_explanation": "Plan V2 moved Block BLK-ENG-102 to 19:30 following controller feedback to avoid the heavy traffic corridor."
  }
  ```

### `GET /api/versions/compare`
- **Description**: Compare two plan versions (e.g. `V1` vs `V2`) with detailed diffs and natural language explanations.

---

## 12. Audit, Reports & Notifications (`/api/audit`, `/api/reports`, `/api/notifications`)

- `GET /api/audit`: Searchable, filtered append-only audit trail.
- `GET /api/reports/download`: Export PDF / CSV reports for weekly plans, asset health, and compliance.
- `GET /api/notifications`: Active user notifications.
