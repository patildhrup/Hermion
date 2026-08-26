import time
from typing import Dict, Any, Optional
from fastapi import APIRouter, BackgroundTasks
from pydantic import BaseModel

from app.config.config import settings
from app.database.database import db
from app.services.agora_service import generate_agora_rtc_token, agora_ai_service
from app.api.routes.calls import auto_generate_call_summary

router = APIRouter(tags=["Agora Voice Engine"])


class StartAgentRequest(BaseModel):
    channel_name: str
    lead_id: Optional[str] = ""


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
    res = agora_ai_service.start_agent_session(channel_name=req.channel_name, lead_id=req.lead_id or "")
    return res


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
