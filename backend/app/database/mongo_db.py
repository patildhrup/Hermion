"""
MongoDB client for persistent conversation history.
Uses pymongo (sync) for simplicity — runs alongside the existing SQLite/Supabase CRM layer.
"""
import uuid
from datetime import datetime
from typing import List, Dict, Any, Optional

from app.config.config import settings

_client = None
_db = None


def _get_db():
    global _client, _db
    if _db is None:
        if not settings.MONGO_URL:
            print("[MongoDB] MONGO_URL not set - conversation history disabled.")
            return None
        try:
            from pymongo import MongoClient
            _client = MongoClient(settings.MONGO_URL, serverSelectionTimeoutMS=8000)
            _client.server_info()  # raises if unreachable
            _db = _client["hermion-db"]
            # Ensure useful indexes
            _db["conversations"].create_index("session_id")
            _db["conversations"].create_index("user_id")
            _db["conversations"].create_index("created_at")
            print("[MongoDB] Connected successfully to hermion-db")
        except Exception as e:
            print(f"[MongoDB] Connection warning: {e}")
            _db = None
    return _db


# ─── Conversations ─────────────────────────────────────────────────────────────

def create_conversation(user_id: str, title: str = "New Conversation") -> Dict[str, Any]:
    """Create a new conversation session."""
    db = _get_db()
    doc = {
        "session_id": str(uuid.uuid4()),
        "user_id": user_id,
        "title": title,
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat(),
        "messages": [],
        "call_id": None,
        "lead_id": None,
        "status": "active",
    }
    if db is not None:
        db["conversations"].insert_one(doc)
        doc.pop("_id", None)
    return doc


def get_conversations(user_id: str, limit: int = 50) -> List[Dict[str, Any]]:
    """Fetch all conversations for a user, newest first."""
    db = _get_db()
    if db is None:
        return []
    try:
        cursor = db["conversations"].find(
            {"user_id": user_id},
            {"_id": 0}
        ).sort("updated_at", -1).limit(limit)
        return list(cursor)
    except Exception as e:
        print(f"[MongoDB] get_conversations error: {e}")
        return []


def get_conversation(session_id: str) -> Optional[Dict[str, Any]]:
    """Fetch a single conversation by session_id."""
    db = _get_db()
    if db is None:
        return None
    try:
        doc = db["conversations"].find_one({"session_id": session_id}, {"_id": 0})
        return doc
    except Exception as e:
        print(f"[MongoDB] get_conversation error: {e}")
        return None


def append_message(session_id: str, role: str, content: str, metadata: Dict = None, user_id: str = "default_user") -> bool:
    """Append a message to a conversation's message list, creating the session if it doesn't exist."""
    db = _get_db()
    if db is None:
        return False
    message = {
        "id": str(uuid.uuid4()),
        "role": role,          # "user" | "assistant" | "system"
        "content": content,
        "timestamp": datetime.utcnow().isoformat(),
        "metadata": metadata or {},
    }
    try:
        db["conversations"].update_one(
            {"session_id": session_id},
            {
                "$push": {"messages": message},
                "$set": {"updated_at": datetime.utcnow().isoformat()},
                "$setOnInsert": {
                    "session_id": session_id,
                    "user_id": user_id,
                    "title": (content[:40] + ("..." if len(content) > 40 else "")) if role == "user" else "Voice Session",
                    "created_at": datetime.utcnow().isoformat(),
                    "call_id": None,
                    "lead_id": None,
                    "status": "active",
                }
            },
            upsert=True
        )
        return True
    except Exception as e:
        print(f"[MongoDB] append_message error: {e}")
        return False


def update_conversation(session_id: str, updates: Dict[str, Any]) -> bool:
    """Update conversation metadata (title, call_id, lead_id, status)."""
    db = _get_db()
    if db is None:
        return False
    updates["updated_at"] = datetime.utcnow().isoformat()
    try:
        db["conversations"].update_one(
            {"session_id": session_id},
            {"$set": updates}
        )
        return True
    except Exception as e:
        print(f"[MongoDB] update_conversation error: {e}")
        return False


def delete_conversation(session_id: str, user_id: str) -> bool:
    """Soft-delete (mark as archived) a conversation."""
    db = _get_db()
    if db is None:
        return False
    try:
        db["conversations"].update_one(
            {"session_id": session_id, "user_id": user_id},
            {"$set": {"status": "archived", "updated_at": datetime.utcnow().isoformat()}}
        )
        return True
    except Exception as e:
        print(f"[MongoDB] delete_conversation error: {e}")
        return False


def rename_conversation(session_id: str, user_id: str, new_title: str) -> bool:
    """Rename a conversation."""
    db = _get_db()
    if db is None:
        return False
    try:
        db["conversations"].update_one(
            {"session_id": session_id, "user_id": user_id},
            {"$set": {"title": new_title, "updated_at": datetime.utcnow().isoformat()}}
        )
        return True
    except Exception as e:
        print(f"[MongoDB] rename_conversation error: {e}")
        return False
