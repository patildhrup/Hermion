from typing import Dict, Any, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.database import mongo_db

router = APIRouter(prefix="/conversations", tags=["Conversations & History"])


class CreateConversationRequest(BaseModel):
    user_id: str
    title: Optional[str] = "New Conversation"


class AppendMessageRequest(BaseModel):
    role: str
    content: str
    metadata: Optional[Dict[str, Any]] = None


class RenameConversationRequest(BaseModel):
    title: str


@router.post("")
@router.post("/")
def create_conversation(req: CreateConversationRequest):
    """Create a new conversation/call session for history tracking in MongoDB."""
    conv = mongo_db.create_conversation(req.user_id, req.title or "New Conversation")
    return conv


@router.get("")
@router.get("/")
def list_conversations(user_id: str, limit: int = 50):
    """List all conversations for a user, newest first."""
    return mongo_db.get_conversations(user_id, limit)


@router.get("/{session_id}")
def get_conversation(session_id: str):
    """Get a single conversation with its full message history."""
    conv = mongo_db.get_conversation(session_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return conv


@router.post("/{session_id}/messages")
def append_message(session_id: str, req: AppendMessageRequest):
    """Append a message to an existing conversation."""
    ok = mongo_db.append_message(session_id, req.role, req.content, req.metadata)
    return {"status": "ok" if ok else "fallback", "session_id": session_id}


@router.patch("/{session_id}")
def update_conversation_meta(session_id: str, updates: Dict[str, Any]):
    """Update conversation metadata like call_id, lead_id, status."""
    ok = mongo_db.update_conversation(session_id, updates)
    return {"status": "ok" if ok else "fallback"}


@router.patch("/{session_id}/rename")
def rename_conversation(session_id: str, req: RenameConversationRequest, user_id: str):
    """Rename a conversation."""
    ok = mongo_db.rename_conversation(session_id, user_id, req.title)
    return {"status": "ok" if ok else "fallback"}


@router.delete("/{session_id}")
def delete_conversation(session_id: str, user_id: str):
    """Archive/delete a conversation."""
    ok = mongo_db.delete_conversation(session_id, user_id)
    return {"status": "ok" if ok else "fallback"}
