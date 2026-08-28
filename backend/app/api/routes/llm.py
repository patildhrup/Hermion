import time
import uuid
from typing import List, Optional
from fastapi import APIRouter, BackgroundTasks
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from app.services.agent_service import hermion_agent_service
from app.database.database import db
from app.database import mongo_db
from app.services.voice_session_service import voice_session_service

router = APIRouter(tags=["LLM & Agent"])


class ChatMessage(BaseModel):
    role: str
    content: str


class LLMRequest(BaseModel):
    messages: List[ChatMessage]
    model: Optional[str] = "hermion-work-assistant"
    stream: Optional[bool] = False
    call_id: Optional[str] = ""
    session_id: Optional[str] = ""
    agent_id: Optional[str] = ""


@router.post("/llm")
@router.post("/llm/chat/completions")
@router.post("/chat/completions")
async def agora_llm_endpoint(req: LLMRequest, background_tasks: BackgroundTasks):
    """
    Main Turn Endpoint called by Agora Conversational AI Engine and Dashboard on every turn.
    Input: OpenAI format messages array
    Output: OpenAI format completion object
    """
    messages = [{"role": m.role, "content": m.content} for m in req.messages]

    agent_response, tools_used = hermion_agent_service.process_turn(messages, session_id=req.session_id or "")

    # Save transcripts to DB (SQLite / Supabase)
    if req.call_id:
        call_id = req.call_id or "active-call"
        latest_user_msg = next((m.content for m in reversed(req.messages) if m.role == "user"), "")
        if latest_user_msg:
            background_tasks.add_task(db.save_transcript, call_id, "user", latest_user_msg)
        background_tasks.add_task(db.save_transcript, call_id, "hermion", agent_response)

    # Persist to MongoDB conversation history if session_id provided
    if req.session_id:
        latest_user_msg = next((m.content for m in reversed(req.messages) if m.role == "user"), "")
        if latest_user_msg:
            background_tasks.add_task(mongo_db.append_message, req.session_id, "user", latest_user_msg)
        background_tasks.add_task(
            mongo_db.append_message,
            req.session_id,
            "assistant",
            agent_response,
            {"tools_used": tools_used}
        )

    if req.agent_id:
        background_tasks.add_task(voice_session_service.increment_turn, req.agent_id)

    response_payload = {
        "id": f"chatcmpl-{str(uuid.uuid4())[:8]}",
        "object": "chat.completion",
        "created": int(time.time()),
        "model": "hermion-work-assistant",
        "choices": [
            {
                "index": 0,
                "message": {
                    "role": "assistant",
                    "content": agent_response
                },
                "finish_reason": "stop"
            }
        ],
        "usage": {
            "prompt_tokens": 120,
            "completion_tokens": 45,
            "total_tokens": 165
        },
        "x_executed_tools": tools_used
    }

    return JSONResponse(content=response_payload)
