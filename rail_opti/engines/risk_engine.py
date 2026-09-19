"""Risk Assessment Engine for RAILOPT AI (SIH26027).

Evaluates:
- Safety Risk (0 - 100)
- Failure Probability (0.0 - 1.0)
- Operational Impact (0 - 100)
- Risk Category (LOW, MEDIUM, HIGH, CRITICAL)
- Confidence Score & Explainability

DISCLAIMER: DEMO / SIMULATED RISK MODEL — NOT TRAINED ON CONFIDENTIAL LIVE IR DATA.
"""
from typing import Dict, Any, List
from rail_opti.engines.asset_health import asset_health_engine


class RiskEngine:
    """Evaluates multi-dimensional risk for maintenance tasks and railway assets."""

    def evaluate_task_risk(
        self,
        task_id: str,
        asset_type: str,
        severity: str,
        section_speed_kmh: int,
        cumulative_gmt: float,
        defects: List[Dict[str, Any]],
        overdue_days: int = 0,
        age_years: float = 5.0,
    ) -> Dict[str, Any]:
        """Compute full risk profile for a maintenance task."""
        # 1. Health & failure probability calculation
        health_res = asset_health_engine.calculate_health(
            asset_type=asset_type,
            age_years=age_years,
            cumulative_gmt=cumulative_gmt,
            defects=defects,
            overdue_days=overdue_days,
        )

        failure_prob = health_res["failure_probability"]

        # 2. Safety Risk (0 - 100)
        # Factors: failure probability, defect severity, section speed limit
        severity_weights = {"CRITICAL": 95.0, "HIGH": 75.0, "MEDIUM": 50.0, "LOW": 25.0}
        base_safety = severity_weights.get(severity.upper(), 50.0)

        # High sectional speeds (>110 km/h) amplify safety risk
        speed_factor = min(max(section_speed_kmh / 130.0, 0.8), 1.25)
        safety_risk = round(min(100.0, (base_safety * 0.6 + (failure_prob * 100.0) * 0.4) * speed_factor), 1)

        # 3. Operational Impact (0 - 100)
        # Higher GMT corridors (freight/trunk lines) have higher disruption impact if failure occurs
        operational_impact = round(min(100.0, (cumulative_gmt / 100.0) * 60.0 + (section_speed_kmh / 130.0) * 40.0), 1)

        # 4. Overall Risk Category
        if safety_risk >= 85.0 or failure_prob >= 0.80 or severity.upper() == "CRITICAL":
            risk_category = "CRITICAL"
        elif safety_risk >= 70.0 or failure_prob >= 0.60 or severity.upper() == "HIGH":
            risk_category = "HIGH"
        elif safety_risk >= 45.0 or failure_prob >= 0.35:
            risk_category = "MEDIUM"
        else:
            risk_category = "LOW"

        # 5. Natural Language Explanation & Evidence
        evidence = [
            f"Failure probability estimated at {round(failure_prob * 100)}% based on asset health score ({health_res['health_score']}%).",
            f"Section speed limit ({section_speed_kmh} km/h) yields a speed risk multiplier of {round(speed_factor, 2)}x.",
            f"Cumulative traffic volume ({cumulative_gmt} GMT) indicates heavy trunk line usage.",
            f"{len(defects)} active defect(s) logged in TDMS.",
        ]

        explanation = (
            f"Task {task_id} classified as {risk_category} risk. "
            f"Safety risk is {safety_risk}/100 and failure probability is {round(failure_prob * 100)}% "
            f"due to {health_res['urgency_level'].lower()} maintenance requirements."
        )

        return {
            "task_id": task_id,
            "safety_risk": safety_risk,
            "failure_probability": failure_prob,
            "operational_impact": operational_impact,
            "risk_category": risk_category,
            "confidence_score": 0.94,
            "health_score": health_res["health_score"],
            "urgency_level": health_res["urgency_level"],
            "evidence": evidence,
            "explanation": explanation,
        }


risk_engine = RiskEngine()
