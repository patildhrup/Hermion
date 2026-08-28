import time
import uuid
from typing import Any, Dict, Optional


class VoiceSessionService:
    def __init__(self):
        self._sessions: Dict[str, Dict[str, Any]] = {}

    def start_session(
        self,
        channel_name: str,
        session_id: str = "",
        call_id: str = "",
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        agent_id = f"agent-{uuid.uuid4().hex[:12]}"
        now = int(time.time())
        record = {
            "agent_id": agent_id,
            "channel_name": channel_name,
            "session_id": session_id or "",
            "call_id": call_id or "",
            "status": "active",
            "started_at": now,
            "stopped_at": None,
            "turn_count": 0,
            "last_error": None,
            "metadata": metadata or {},
        }
        self._sessions[agent_id] = record
        return record.copy()

    def stop_session(self, agent_id: str, error: str = "") -> Optional[Dict[str, Any]]:
        record = self._sessions.get(agent_id)
        if not record:
            return None
        record["status"] = "stopped"
        record["stopped_at"] = int(time.time())
        record["last_error"] = error or None
        return record.copy()

    def increment_turn(self, agent_id: str) -> Optional[Dict[str, Any]]:
        record = self._sessions.get(agent_id)
        if not record:
            return None
        record["turn_count"] += 1
        return record.copy()

    def get_session(self, agent_id: str) -> Optional[Dict[str, Any]]:
        record = self._sessions.get(agent_id)
        return record.copy() if record else None


voice_session_service = VoiceSessionService()
