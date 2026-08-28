import uuid
from datetime import datetime
from typing import Any, Dict, List


class CalendarService:
    def __init__(self):
        self._events: List[Dict[str, Any]] = [
            {
                "id": "cal-1",
                "title": "Product Review",
                "team": "Engineering Team",
                "start_time": "2026-08-28T14:00:00",
                "end_time": "2026-08-28T15:00:00",
                "status": "scheduled",
            },
            {
                "id": "cal-2",
                "title": "Engineering Sync",
                "team": "Development Team",
                "start_time": "2026-08-28T16:30:00",
                "end_time": "2026-08-28T17:00:00",
                "status": "scheduled",
            },
        ]

    def get_calendar_events(self, date: str = "") -> List[Dict[str, Any]]:
        if not date:
            return list(self._events)
        return [event for event in self._events if event["start_time"].startswith(date)]

    def create_meeting(self, title: str, start_time: str, attendees: List[str]) -> Dict[str, Any]:
        meeting = {
            "id": f"cal-{uuid.uuid4().hex[:8]}",
            "title": title,
            "team": ", ".join(attendees) if attendees else "Workspace",
            "start_time": start_time,
            "end_time": start_time,
            "status": "scheduled",
            "created_at": datetime.utcnow().isoformat(),
        }
        self._events.append(meeting)
        return meeting

    def reschedule_meeting(self, meeting_id: str, new_start_time: str):
        for event in self._events:
            if event["id"] == meeting_id:
                event["start_time"] = new_start_time
                event["end_time"] = new_start_time
                event["status"] = "rescheduled"
                return event
        return None


calendar_service = CalendarService()
