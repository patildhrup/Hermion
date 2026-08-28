from fastapi import APIRouter
from pydantic import BaseModel

from app.database.database import db
from app.services.meeting_service import meeting_assistant_service
from app.services.memory_service import memory_service

router = APIRouter(prefix="/meetings", tags=["Meeting Assistant"])


class MeetingAnalysisRequest(BaseModel):
    transcript: str
    user_id: str = ""
    session_id: str = ""


@router.post("/analyze")
def analyze_meeting(req: MeetingAnalysisRequest):
    result = meeting_assistant_service.analyze_transcript(req.transcript)
    if req.user_id and req.transcript:
        memory_service.store_memory(req.user_id, req.transcript, {"type": "meeting_transcript"})
    if req.session_id and req.transcript:
        memory_service.store_short_term(req.session_id, "meeting", req.transcript)
    return result


@router.get("/call/{call_id}")
def analyze_call_meeting(call_id: str):
    transcripts = db.get_transcripts(call_id)
    transcript_text = " ".join(item.get("text", "") for item in transcripts)
    return meeting_assistant_service.analyze_transcript(transcript_text)
