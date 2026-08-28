import time
from typing import Dict, Any, Optional
from fastapi import APIRouter, BackgroundTasks
from pydantic import BaseModel

from app.config.config import settings
from app.database.database import db
from app.database import mongo_db
from app.services.agora_service import generate_agora_rtc_token, agora_ai_service
from app.api.routes.calls import auto_generate_call_summary
from app.services.voice_session_service import voice_session_service

router = APIRouter(tags=["Agora Voice Engine"])


class StartAgentRequest(BaseModel):
    channel_name: str
    session_id: Optional[str] = ""
    call_id: Optional[str] = ""


class StopAgentRequest(BaseModel):
    agent_id: str
    session_id: Optional[str] = ""
    call_id: Optional[str] = ""


@router.get("/agora/token")
def get_agora_token(channel: str, uid: Optional[str] = "0"):
    token = generate_agora_rtc_token(channel_name=channel, uid=uid)
    return {
        "channel": channel,
        "uid": uid,
        "token": token,
        "app_id": settings.AGORA_APP_ID or "demo_agora_app_id"
    }


@router.post("/agora/start-agent")
def start_agora_agent(req: StartAgentRequest):
    provider_response = agora_ai_service.start_agent_session(channel_name=req.channel_name)
    session_record = voice_session_service.start_session(
        channel_name=req.channel_name,
        session_id=req.session_id or "",
        call_id=req.call_id or "",
        metadata={"provider": "agora"},
    )
    if req.session_id:
        mongo_db.update_conversation(
            req.session_id,
            {
                "call_id": req.call_id or "",
                "status": "active",
            },
        )
    return {
        **provider_response,
        "agent_id": provider_response.get("agent_id") or session_record["agent_id"],
        "voice_session": session_record,
    }


@router.post("/agora/stop-agent")
def stop_agora_agent(req: StopAgentRequest, background_tasks: BackgroundTasks):
    provider_response = agora_ai_service.stop_agent_session(req.agent_id)
    session_record = voice_session_service.stop_session(req.agent_id)
    if req.session_id:
        mongo_db.update_conversation(req.session_id, {"status": "completed"})
    if req.call_id:
        db.update_call(req.call_id, {"outcome": "completed", "ended_at": time.strftime("%Y-%m-%dT%H:%M:%SZ")})
        background_tasks.add_task(auto_generate_call_summary, req.call_id)
    return {
        **provider_response,
        "voice_session": session_record,
    }


@router.get("/agora/sessions/{agent_id}")
def get_voice_session(agent_id: str):
    session_record = voice_session_service.get_session(agent_id)
    return session_record or {"agent_id": agent_id, "status": "unknown"}


@router.post("/webhooks/agora")
def agora_webhook(req: Dict[str, Any], background_tasks: BackgroundTasks):
    event = req.get("event", "")
    channel = req.get("channel", "")
    call_id = req.get("call_id", channel or "webhook-call")

    if event == "agent_session_started":
        db.create_call({
            "id": call_id,
            "agora_channel_name": channel,
            "started_at": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "outcome": "in_progress"
        })
    elif event == "agent_session_stopped" or event == "channel_destroyed":
        db.update_call(call_id, {"outcome": "completed", "ended_at": time.strftime("%Y-%m-%dT%H:%M:%SZ")})
        background_tasks.add_task(auto_generate_call_summary, call_id)

    return {"status": "received"}
