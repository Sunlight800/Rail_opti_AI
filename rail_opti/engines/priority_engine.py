"""Priority Engine for RAILOPT AI (SIH26027).

Implements exactly the configurable 6-factor priority formula:
    Priority Score =
        0.30 * Safety Risk
      + 0.20 * Failure Probability
      + 0.15 * Asset Criticality
      + 0.15 * Maintenance Urgency
      + 0.10 * Traffic / Operational Impact
      + 0.10 * Defect Severity

Normalized output: 0 - 100
Priority Categories:
    90 - 100: CRITICAL
    75 - 89:  HIGH
    50 - 74:  MEDIUM
    0 - 49:   LOW

Includes Safety Override escalation when Safety Risk >= 90.0 or safety-critical defect is detected.
"""
from typing import Dict, Any, List, Optional


class PriorityEngine:
    """Computes multi-factor priority scores with explainability and safety overrides."""

    DEFAULT_WEIGHTS = {
        "safety_risk": 0.30,
        "failure_probability": 0.20,
        "asset_criticality": 0.15,
        "maintenance_urgency": 0.15,
        "traffic_impact": 0.10,
        "defect_severity": 0.10,
    }

    SAFETY_CRITICAL_THRESHOLD = 90.0

    def calculate_priority(
        self,
        safety_risk: float,
        failure_probability: float,  # either 0.0 - 1.0 or 0.0 - 100.0
        asset_criticality: float,    # 0.0 - 100.0
        maintenance_urgency: float,  # 0.0 - 100.0
        traffic_impact: float,       # 0.0 - 100.0
        defect_severity: float,      # 0.0 - 100.0
        weights: Optional[Dict[str, float]] = None,
        has_safety_critical_defect: bool = False,
    ) -> Dict[str, Any]:
        """Compute normalized priority score (0-100) and factor contributions."""
        w = weights or self.DEFAULT_WEIGHTS

        # Normalize failure probability to 0-100 if provided as 0-1
        fprob_val = failure_probability * 100.0 if failure_probability <= 1.0 else failure_probability

        # Clamp all factors to [0.0, 100.0]
        s_val = max(0.0, min(100.0, float(safety_risk)))
        f_val = max(0.0, min(100.0, float(fprob_val)))
        c_val = max(0.0, min(100.0, float(asset_criticality)))
        u_val = max(0.0, min(100.0, float(maintenance_urgency)))
        t_val = max(0.0, min(100.0, float(traffic_impact)))
        d_val = max(0.0, min(100.0, float(defect_severity)))

        # Individual factor contributions
        contrib_s = round(s_val * w.get("safety_risk", 0.30), 2)
        contrib_f = round(f_val * w.get("failure_probability", 0.20), 2)
        contrib_c = round(c_val * w.get("asset_criticality", 0.15), 2)
        contrib_u = round(u_val * w.get("maintenance_urgency", 0.15), 2)
        contrib_t = round(t_val * w.get("traffic_impact", 0.10), 2)
        contrib_d = round(d_val * w.get("defect_severity", 0.10), 2)

        raw_score = contrib_s + contrib_f + contrib_c + contrib_u + contrib_t + contrib_d
        total_score = max(0.0, min(100.0, round(raw_score, 1)))

        # Priority category categorization
        if total_score >= 90.0:
            category = "CRITICAL"
        elif total_score >= 75.0:
            category = "HIGH"
        elif total_score >= 50.0:
            category = "MEDIUM"
        else:
            category = "LOW"

        # Safety Override Logic:
        # If Safety Risk >= 90 or safety critical defect, force CRITICAL status and mandatory scheduling
        safety_override = False
        if s_val >= self.SAFETY_CRITICAL_THRESHOLD or has_safety_critical_defect:
            safety_override = True
            category = "CRITICAL"
            if total_score < 90.0:
                total_score = max(total_score, 90.0)

        # AI Rationale generation
        if safety_override:
            ai_rationale = "High safety risk (>=90/100) or safety-critical defect detected. Safety override escalated priority to CRITICAL."
        elif category == "CRITICAL":
            ai_rationale = "High safety risk, high failure probability and overdue maintenance. Significantly increases priority."
        elif category == "HIGH":
            ai_rationale = "Elevated failure risk and track traffic density justify expedited maintenance window."
        elif category == "MEDIUM":
            ai_rationale = "Moderate wear detected. Candidate for multi-department consolidation."
        else:
            ai_rationale = "Routine preventive task. Flexible scheduling window."

        factor_codes = ["S", "P_f", "C_a", "U_m", "I_o", "D_s"]
        factor_descs = [
            "Derailment risk & track geometry tolerance limits",
            "Probabilistic Weibull & Logistic failure estimation",
            "Corridor density and Golden Quadrilateral routing tier",
            "Days overdue since last scheduled inspection / Tamping",
            "Gross Million Tonnes (GMT) and daily train density",
            "USFD flaw severity, spalling or fatigue depth",
        ]

        raw_factors = [
            {"name": "Safety Risk", "code": "S", "value": s_val, "score": s_val, "weight": w.get("safety_risk", 0.30), "contribution": contrib_s, "description": factor_descs[0]},
            {"name": "Failure Probability", "code": "P_f", "value": f_val, "score": f_val, "weight": w.get("failure_probability", 0.20), "contribution": contrib_f, "description": factor_descs[1]},
            {"name": "Asset Criticality", "code": "C_a", "value": c_val, "score": c_val, "weight": w.get("asset_criticality", 0.15), "contribution": contrib_c, "description": factor_descs[2]},
            {"name": "Maintenance Urgency", "code": "U_m", "value": u_val, "score": u_val, "weight": w.get("maintenance_urgency", 0.15), "contribution": contrib_u, "description": factor_descs[3]},
            {"name": "Traffic Impact", "code": "I_o", "value": t_val, "score": t_val, "weight": w.get("traffic_impact", 0.10), "contribution": contrib_t, "description": factor_descs[4]},
            {"name": "Defect Severity", "code": "D_s", "value": d_val, "score": d_val, "weight": w.get("defect_severity", 0.10), "contribution": contrib_d, "description": factor_descs[5]},
        ]

        # Determine top contributor
        top_factor = max(raw_factors, key=lambda f: f["contribution"])

        recommendation = {
            "action": "Schedule within 48h (Window: 01:30 - 04:30). Safety critical threshold exceeded." if safety_override else f"Schedule within standard cycle ({category.lower()} priority queue).",
            "window_hint": "01:30 - 04:30 (Low Traffic Night Window)" if total_score >= 75.0 else "11:00 - 14:00 (Midday Shadow Window)",
            "escalation_reason": "SAFETY OVERRIDE ACTIVE: Escalated to immediate block schedule." if safety_override else "Normal priority scheduling queue.",
            "top_contributor": f"{top_factor['name']} (+{top_factor['contribution']} pts)",
        }

        return {
            "total_score": total_score,
            "priority_score": total_score,
            "category": category,
            "priority_band": category,
            "safety_override": safety_override,
            "ai_rationale": ai_rationale,
            "factors": raw_factors,
            "weights_used": w,
            "recommendation": recommendation,
        }


priority_engine = PriorityEngine()
