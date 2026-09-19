"""Asset Health Engine for RAILOPT AI (SIH26027).

Calculates composite asset health score (0-100%) and failure probability (0.0 - 1.0)
using simulated telemetry, age, GMT traffic load, defect history, and overdue maintenance cycles.

DISCLAIMER: DEMO / SIMULATED AI/ML MODEL — NOT TRAINED ON CONFIDENTIAL LIVE IR DATA.
"""
import math
from typing import Dict, Any, Optional


class AssetHealthEngine:
    """Calculates asset health indices and failure probabilities based on operational factors."""

    # Default design lifecycles in years
    DESIGN_LIFECYCLE_YEARS = {
        "TRACK": 20,
        "TURNOUT": 15,
        "OHE_MAST": 30,
        "SIGNAL_POST": 25,
        "POINT_MACHINE": 12,
    }

    # Defect severity penalty points
    DEFECT_SEVERITY_PENALTIES = {
        "CRITICAL": 35.0,
        "HIGH": 20.0,
        "MEDIUM": 10.0,
        "LOW": 4.0,
    }

    def calculate_health(
        self,
        asset_type: str,
        age_years: float,
        cumulative_gmt: float,
        defects: list,
        overdue_days: int = 0,
        historical_failure_rate: float = 0.05,
    ) -> Dict[str, Any]:
        """Compute composite health index (0-100%), failure probability, and urgency."""
        # 1. Base score
        health = 100.0

        # 2. Age degradation factor
        lifecycle = self.DESIGN_LIFECYCLE_YEARS.get(asset_type.upper(), 20)
        age_ratio = min(age_years / max(lifecycle, 1), 1.5)
        age_penalty = age_ratio * 25.0
        health -= age_penalty

        # 3. Traffic intensity (GMT) factor: standard track design ~ 500 GMT total life
        gmt_penalty = min((cumulative_gmt / 100.0) * 15.0, 30.0)
        health -= gmt_penalty

        # 4. Active defects penalty
        defect_penalty = sum(
            self.DEFECT_SEVERITY_PENALTIES.get(d.get("severity", "MEDIUM").upper(), 10.0)
            for d in defects
        )
        health -= min(defect_penalty, 40.0)

        # 5. Overdue maintenance penalty (0.2 points per overdue day, max 20)
        overdue_penalty = min(overdue_days * 0.2, 20.0)
        health -= overdue_penalty

        # Clamp health to [0.0, 100.0]
        health_score = max(0.0, min(100.0, round(health, 1)))

        # 6. Failure probability calculation via calibrated logistic function
        # z increases with lower health, higher overdue days, and active critical defects
        has_critical_defect = any(d.get("severity", "").upper() == "CRITICAL" for d in defects)
        z = (
            (100.0 - health_score) * 0.05
            + (overdue_days * 0.02)
            + (1.5 if has_critical_defect else 0.0)
            - 2.5
        )
        failure_prob = 1.0 / (1.0 + math.exp(-z))
        failure_prob = max(0.02, min(0.98, round(failure_prob, 2)))

        # 7. Recommended urgency
        if failure_prob >= 0.75 or has_critical_defect:
            urgency = "IMMEDIATE"
        elif failure_prob >= 0.50 or overdue_days > 30:
            urgency = "URGENT"
        else:
            urgency = "ROUTINE"

        evidence = (
            f"Asset evaluated with {health_score}% health index and {round(failure_prob * 100)}% failure risk. "
            f"Key factors: {len(defects)} active defects, {overdue_days} overdue days, and {cumulative_gmt} GMT load."
        )

        return {
            "health_score": health_score,
            "failure_probability": failure_prob,
            "overdue_days": overdue_days,
            "urgency_level": urgency,
            "evidence_summary": evidence,
            "penalties": {
                "age_penalty": round(age_penalty, 1),
                "gmt_penalty": round(gmt_penalty, 1),
                "defect_penalty": round(defect_penalty, 1),
                "overdue_penalty": round(overdue_penalty, 1),
            },
        }


asset_health_engine = AssetHealthEngine()
