import time
import uuid
from typing import Any, Dict, List

from app.config.config import settings
from app.services.qdrant_service import qdrant_store


class MemoryService:
    def __init__(self):
        self._short_term: Dict[str, List[Dict[str, Any]]] = {}
        self._long_term: Dict[str, Dict[str, Any]] = {}
        self._redis = None
        if settings.REDIS_URL:
            try:
                import redis
                self._redis = redis.from_url(settings.REDIS_URL, decode_responses=True)
                self._redis.ping()
            except Exception as exc:
                print(f"[Memory] Redis connection warning: {exc}")
                self._redis = None

    def _session_key(self, session_id: str) -> str:
        return f"hermion:session:{session_id}"

    def store_short_term(self, session_id: str, role: str, text: str) -> Dict[str, Any]:
        entry = {
            "id": f"stm-{uuid.uuid4().hex[:8]}",
            "role": role,
            "text": text,
            "stored_at": int(time.time()),
        }
        self._short_term.setdefault(session_id, []).append(entry)
        self._short_term[session_id] = self._short_term[session_id][-10:]
        if self._redis:
            try:
                self._redis.rpush(self._session_key(session_id), text)
                self._redis.ltrim(self._session_key(session_id), -10, -1)
            except Exception as exc:
                print(f"[Memory] Redis write warning: {exc}")
        return entry

    def retrieve_memory(self, session_id: str) -> List[Dict[str, Any]]:
        items = self._short_term.get(session_id, [])
        if items:
            return items
        if self._redis:
            try:
                return [
                    {"id": f"redis-{index}", "role": "session", "text": item, "stored_at": int(time.time())}
                    for index, item in enumerate(self._redis.lrange(self._session_key(session_id), 0, -1))
                ]
            except Exception as exc:
                print(f"[Memory] Redis read warning: {exc}")
        return []

    def store_memory(self, user_id: str, text: str, metadata: Dict[str, Any] | None = None) -> Dict[str, Any]:
        memory_id = len(self._long_term) + 1000
        record = {
            "id": memory_id,
            "memory_key": f"mem-{uuid.uuid4().hex[:8]}",
            "user_id": user_id,
            "text": text,
            "metadata": metadata or {},
            "updated_at": int(time.time()),
        }
        self._long_term[record["memory_key"]] = record
        self._sync_long_term()
        return record

    def _sync_long_term(self):
        qdrant_store.upsert_texts(
            "memory",
            [
                {
                    "id": value["id"],
                    "text": value["text"],
                    "metadata": {"memory_key": key, "user_id": value["user_id"], **value["metadata"]},
                }
                for key, value in self._long_term.items()
            ],
        )

    def search_memory(self, user_id: str, query: str, top_k: int = 3) -> List[Dict[str, Any]]:
        hits = qdrant_store.search("memory", query, top_k=top_k)
        return [hit for hit in hits if hit["metadata"].get("user_id") in ("", user_id, None)]

    def update_memory(self, memory_key: str, text: str):
        record = self._long_term.get(memory_key)
        if not record:
            return None
        record["text"] = text
        record["updated_at"] = int(time.time())
        self._sync_long_term()
        return record

    def delete_memory(self, memory_key: str) -> bool:
        record = self._long_term.pop(memory_key, None)
        if not record:
            return False
        qdrant_store.delete_point("memory", record["id"])
        return True


memory_service = MemoryService()
