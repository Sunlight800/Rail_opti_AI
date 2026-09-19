"""Simulated Data Integration Gateways for Indian Railways Systems (SIH26027).

Represents:
- TMS (Train Management System)
- SMMS (Stores & Maintenance Management System)
- TDMS (Track & Defect Management System)
- COA (Control Office Application)

DISCLAIMER: DEMO / SIMULATED DATA — NOT CONNECTED TO LIVE INDIAN RAILWAYS SYSTEMS.
"""
import datetime
from typing import Dict, Any, List


class IntegrationSimulator:
    """Manages simulated connection states and telemetry for Indian Railways systems."""

    def __init__(self):
        self.last_sync_times = {
            "TMS": datetime.datetime.utcnow() - datetime.timedelta(minutes=2),
            "SMMS": datetime.datetime.utcnow() - datetime.timedelta(minutes=5),
            "TDMS": datetime.datetime.utcnow() - datetime.timedelta(minutes=1),
            "COA": datetime.datetime.utcnow() - datetime.timedelta(minutes=3),
        }
        self.record_counts = {
            "TMS": 12480,
            "SMMS": 9730,
            "TDMS": 9310,
            "COA": 15820,
        }
        self.data_quality = {
            "TMS": 98.5,
            "SMMS": 97.0,
            "TDMS": 99.1,
            "COA": 96.8,
        }

    def get_system_statuses(self) -> List[Dict[str, Any]]:
        """Return live health, sync status, and quality metrics for each system."""
        now = datetime.datetime.utcnow()
        systems = [
            {
                "id": "TMS",
                "name": "TMS",
                "full_name": "Train Management System",
                "status": "Connected",
                "mode": "Demo Data",
                "last_sync": self._format_time_ago(self.last_sync_times["TMS"], now),
                "record_count": f"{self.record_counts['TMS']:,} records",
                "raw_count": self.record_counts["TMS"],
                "data_quality_pct": self.data_quality["TMS"],
                "description": "Timetable schedules, live GPS telemetry, section run times.",
            },
            {
                "id": "SMMS",
                "name": "SMMS",
                "full_name": "Stores & Maintenance Management System",
                "status": "Connected",
                "mode": "Demo Data",
                "last_sync": self._format_time_ago(self.last_sync_times["SMMS"], now),
                "record_count": f"{self.record_counts['SMMS']:,} records",
                "raw_count": self.record_counts["SMMS"],
                "data_quality_pct": self.data_quality["SMMS"],
                "description": "Inventory levels, machine rosters, maintenance gang availability.",
            },
            {
                "id": "TDMS",
                "name": "TDMS",
                "full_name": "Track Defect Management System",
                "status": "Connected",
                "mode": "Demo Data",
                "last_sync": self._format_time_ago(self.last_sync_times["TDMS"], now),
                "record_count": f"{self.record_counts['TDMS']:,} records",
                "raw_count": self.record_counts["TDMS"],
                "data_quality_pct": self.data_quality["TDMS"],
                "description": "Ultrasonic rail flaw detections (USFD), track geometry indices, OHE anomalies.",
            },
            {
                "id": "COA",
                "name": "COA",
                "full_name": "Control Office Application",
                "status": "Connected",
                "mode": "Demo Data",
                "last_sync": self._format_time_ago(self.last_sync_times["COA"], now),
                "record_count": f"{self.record_counts['COA']:,} records",
                "raw_count": self.record_counts["COA"],
                "data_quality_pct": self.data_quality["COA"],
                "description": "Corridor operational block windows, goods train forecast, section headways.",
            },
        ]
        return systems

    def trigger_sync(self) -> Dict[str, Any]:
        """Simulate a refresh of all external system connections."""
        now = datetime.datetime.utcnow()
        for k in self.last_sync_times:
            self.last_sync_times[k] = now
            self.record_counts[k] += 12  # simulated new records ingested
        return {
            "status": "SUCCESS",
            "message": "All simulated integration feeds (TMS, SMMS, TDMS, COA) synced successfully.",
            "synced_at": now.isoformat(),
        }

    def get_data_preview(self, system: str = "TMS") -> List[Dict[str, Any]]:
        """Return preview records for UI inspection matching the concept screen."""
        if system.upper() == "TMS":
            return [
                {"task_id": "MT-001", "asset_id": "Track 7A", "section": "NDLS-ALD", "track": "Up Main", "type": "Tamping", "priority": "CRITICAL", "status": "OPEN"},
                {"task_id": "MT-002", "asset_id": "OHE", "section": "ALD-BPL", "track": "Up Line", "type": "OHE Insp.", "priority": "HIGH", "status": "SCHEDULED"},
                {"task_id": "MT-003", "asset_id": "Signal", "section": "BPL-RJP", "track": "Dn Main", "type": "Signal Test", "priority": "HIGH", "status": "OPEN"},
                {"task_id": "MT-004", "asset_id": "Track 9C", "section": "RJP-JHS", "track": "Up Main", "type": "Rail Renewal", "priority": "MEDIUM", "status": "OPEN"},
                {"task_id": "MT-005", "asset_id": "OHE", "section": "JHS-PTA", "track": "Both Lines", "type": "OHE Insp.", "priority": "MEDIUM", "status": "OPEN"},
            ]
        elif system.upper() == "SMMS":
            return [
                {"item_id": "RES-MCH-CSM-01", "name": "CSM-101 Tamping Machine", "depot": "NDLS Depot", "qty": 1, "status": "OPERATIONAL"},
                {"item_id": "RES-MAT-RAIL-60KG", "name": "60kg UIC Prime Rails", "depot": "ALD Central", "qty": 100, "status": "IN_STOCK"},
                {"item_id": "RES-GANG-ENG-01", "name": "Track Gang ENG-01 (25 Pax)", "depot": "NDLS P-Way", "qty": 25, "status": "ROSTERED"},
            ]
        elif system.upper() == "TDMS":
            return [
                {"defect_id": "DEF-2025-0101", "asset": "Track 7A", "defect": "USFD Flaw", "severity": "CRITICAL", "detected": "2025-05-18", "status": "OPEN"},
                {"defect_id": "DEF-2025-0102", "asset": "Track 7A", "defect": "Bolt Hole Crack", "severity": "HIGH", "detected": "2025-05-19", "status": "OPEN"},
                {"defect_id": "DEF-2025-0103", "asset": "OHE Mast ALD-12", "defect": "Contact Wire Sag", "severity": "HIGH", "detected": "2025-05-17", "status": "OPEN"},
            ]
        else:  # COA
            return [
                {"corridor": "Delhi - Mumbai", "section": "NDLS-ALD", "operating_window": "00:30 - 04:30", "traffic": "Low", "status": "AVAILABLE"},
                {"corridor": "Delhi - Mumbai", "section": "ALD-BPL", "operating_window": "11:30 - 14:30", "traffic": "Normal", "status": "RESTRICTED"},
                {"corridor": "Delhi - Mumbai", "section": "BPL-RJP", "operating_window": "14:00 - 17:00", "traffic": "Normal", "status": "AVAILABLE"},
            ]

    def _format_time_ago(self, past_time: datetime.datetime, current_time: datetime.datetime) -> str:
        diff_seconds = int((current_time - past_time).total_seconds())
        if diff_seconds < 60:
            return f"{diff_seconds}s ago"
        elif diff_seconds < 3600:
            return f"{diff_seconds // 60}m ago"
        else:
            return f"{diff_seconds // 3600}h ago"


simulator = IntegrationSimulator()
