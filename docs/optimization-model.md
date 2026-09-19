# RAILOPT AI — Optimization Model & Constraint Formulation
**SIH26027 — Mathematical Modeling with Google OR-Tools CP-SAT**

---

## 1. Problem Formulation: Automatic Maintenance Block Planning (AMBP)

The Automatic Maintenance Block Planning (AMBP) problem for Indian Railways is formulated as a **Flexible Job-Shop Scheduling Problem with Disjunctive Resource Constraints, Sequence-Dependent Safety Buffers, and Multi-Department Consolidation Windows**.

We employ the **Google OR-Tools CP-SAT** solver due to its superior performance on discrete interval variables, cumulative resource tracking, and exact constraint satisfaction proofs.

---

## 2. Sets and Indices

- $\mathcal{T} = \{1, \dots, N\}$: Set of maintenance tasks.
- $\mathcal{S} = \{1, \dots, M\}$: Set of railway sections (tracks/corridors).
- $\mathcal{D} = \{\text{ENG}, \text{TRD}, \text{SNT}\}$: Set of engineering departments.
- $\mathcal{R} = \{1, \dots, K\}$: Set of maintenance resources (machines, vehicles, teams, specialists).
- $\mathcal{TR} = \{1, \dots, P\}$: Set of scheduled trains (passenger, freight, mail).
- $\mathcal{H} = [0, H_{max}]$: Planning horizon discretized into minutes (e.g., 1440 min for 1 day, 10080 min for 7 days).

---

## 3. Parameters

### Task Parameters
- $d_i$: Estimated duration of task $i \in \mathcal{T}$ (minutes).
- $p_i$: 6-factor priority score of task $i$ ($p_i \in [0, 100]$).
- $r_{i,k}$: Quantity of resource $k \in \mathcal{R}$ required by task $i$.
- $s_i \in \mathcal{S}$: Railway section where task $i$ is located.
- $dep_i \in \mathcal{D}$: Department responsible for task $i$.
- $[W_{i}^{start}, W_{i}^{end}]$: Mandatory time window for task $i$.
- $[P_{i}^{start}, P_{i}^{end}]$: Preferred time window for task $i$.
- $crit_i \in \{0, 1\}$: Binary flag indicating safety-critical task.

### Train & Corridor Parameters
- $[T_{j,s}^{entry}, T_{j,s}^{exit}]$: Scheduled occupancy of train $j \in \mathcal{TR}$ in section $s$.
- $w_{train}(j)$: Disruption weight of train $j$ based on priority (e.g., Vande Bharat / Rajdhani = 100, Express = 50, Freight = 20).
- $\Delta_{buffer}$: Mandatory safety clearance buffer between train passage and maintenance block start/end (typically 15–30 minutes).

### Resource Parameters
- $C_k(t)$: Total available capacity of resource $k$ at time $t$.

---

## 4. Decision Variables

1. **Task Execution Interval**:
   For each task $i \in \mathcal{T}$, we define an optional interval variable:
   $$I_i = \text{NewOptionalIntervalVar}(start_i, d_i, end_i, is\_scheduled_i)$$
   Where:
   - $start_i \in [0, H_{max} - d_i]$
   - $end_i = start_i + d_i$
   - $is\_scheduled_i \in \{0, 1\}$ (1 if task is scheduled in this horizon, 0 if deferred)

2. **Block Assignment**:
   - $b_{i,m} \in \{0, 1\}$: Binary assignment of task $i$ to consolidated block $m$.

3. **Consolidation Binary**:
   - $c_{i,j} \in \{0, 1\}$: 1 if tasks $i$ and $j$ ($i \neq j, s_i = s_j$) are scheduled in the same consolidated block.

---

## 5. Constraints

### 5.1 Hard Constraints (Non-Negotiable Safety & Feasibility)

1. **Mandatory Scheduling for Critical Tasks**:
   Safety-critical tasks must be scheduled within the horizon:
   $$is\_scheduled_i = 1 \quad \forall i \in \mathcal{T} \text{ where } crit_i = 1$$

2. **Mandatory Time Window**:
   $$start_i \ge W_{i}^{start} \cdot is\_scheduled_i$$
   $$end_i \le W_{i}^{end} \cdot is\_scheduled_i$$

3. **Section Exclusivity / Train Conflict Prevention**:
   A maintenance block and a train cannot occupy section $s$ simultaneously:
   For every train $j \in \mathcal{TR}$ passing through section $s_i$:
   $$\left( end_i + \Delta_{buffer} \le T_{j,s_i}^{entry} \right) \lor \left( start_i \ge T_{j,s_i}^{exit} + \Delta_{buffer} \right) \quad \text{if } is\_scheduled_i = 1$$

4. **Cumulative Resource Capacity**:
   At any time $t \in \mathcal{H}$, total allocated units of resource $k$ must not exceed capacity:
   $$\sum_{i \in \mathcal{T} : start_i \le t < end_i} r_{i,k} \cdot is\_scheduled_i \le C_k(t) \quad \forall k \in \mathcal{R}, \forall t$$
   Implemented in CP-SAT using `model.AddCumulative(intervals, demands, capacity)`.

5. **Disjunctive Machine & Specialist Allocation**:
   For non-shareable resources (e.g., a specific CSM tamping machine or ultrasonic testing specialist):
   $$\text{NoOverlap}(I_i, I_j) \quad \forall i, j \text{ sharing exclusive resource } k$$

6. **Task Precedence & Dependencies**:
   If task $j$ depends on task $i$:
   $$start_j \ge end_i \quad \text{if } is\_scheduled_i = 1 \land is\_scheduled_j = 1$$

---

### 5.2 Soft Constraints (Optimization Objectives & Penalties)

1. **Preferred Time Window Deviation Penalty**:
   $$\text{Dev}_i = \max(0, P_i^{start} - start_i) + \max(0, end_i - P_i^{end})$$

2. **Multi-Department Consolidation Incentive**:
   If tasks $i, j$ belong to different departments ($dep_i \neq dep_j$) but are on the same section ($s_i = s_j$), we award a consolidation bonus when their intervals overlap:
   $$\text{Bonus}_{con}(i, j) = B \cdot c_{i,j}$$

3. **Train Disruption Minimization**:
   If a train must be rescheduled or speed-restricted due to an adjacent block:
   $$\text{Disruption} = \sum_{j \in \mathcal{TR}} w_{train}(j) \cdot \text{Delay}_j$$

---

## 6. Multi-Objective Function

The objective is formulated as a weighted scalarization:

$$\max \quad \sum_{i \in \mathcal{T}} \left( \lambda_{priority} \cdot p_i \cdot is\_scheduled_i \right) + \sum_{i, j} \left( \lambda_{con} \cdot c_{i,j} \right) - \sum_{i \in \mathcal{T}} \left( \lambda_{dev} \cdot \text{Dev}_i \right) - \sum_{j \in \mathcal{TR}} \left( \lambda_{disrupt} \cdot \text{Disruption}_j \right)$$

### Default Weights:
- $\lambda_{priority} = 10.0$ (Strong incentive to schedule high-priority tasks)
- $\lambda_{con} = 5.0$ (Incentive to merge Eng, TRD, and S&T tasks)
- $\lambda_{dev} = 1.0$ (Mild penalty for shifting outside preferred window)
- $\lambda_{disrupt} = 20.0$ (High penalty for delaying passenger trains)

---

## 7. Infeasibility Diagnosis & Minimal Unsatisfied Core

If no feasible plan exists within the given constraints:
1. **Never fabricate a fictitious schedule.**
2. **CP-SAT Constraint Diagnostics**:
   - The engine disables soft penalties and isolates the conflicting constraint subset.
   - Identifies whether the bottleneck is:
     - *Resource shortage* (e.g., Tamping machine unavailable).
     - *Corridor congestion* (train headways leave no gap $\ge d_i + 2\Delta_{buffer}$).
     - *Conflicting safety windows*.
3. **Structured Infeasibility Response**:
   Returns:
   - `status`: `INFEASIBLE`
   - `blocking_constraints`: List of task IDs, train IDs, and missing resource IDs.
   - `recommended_relaxations`: E.g., "Increase time window by 45 minutes" or "Substitute Specialist A with Specialist B".

---

## 8. Human Feedback Re-Optimization Loop

When a human controller rejects a plan with feedback (e.g., *"Move block outside heavy goods traffic period (14:00 - 18:00)"*):
1. **Dynamic Constraint Injection**:
   The engine translates the feedback into a hard exclusion constraint:
   $$end_i \le 14:00 \quad \lor \quad start_i \ge 18:00 \quad \text{for section } s$$
2. **Warm-Start Seeding**:
   The previous plan's valid variables are fed as hints (`model.AddHint`) to accelerate solving.
3. **Delta Minimization**:
   Penalizes drastic changes to previously accepted tasks, ensuring schedule stability.
