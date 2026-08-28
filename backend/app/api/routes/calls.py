import time
import uuid
from typing import Dict, Any, Optional
from fastapi import APIRouter, Request, BackgroundTasks

from app.database.database import db

router = APIRouter(prefix="/calls", tags=["Calls & Transcripts"])


def auto_generate_call_summary(call_id: str, lead_id: str = ""):
    """Async task to summarize call after hangup."""
    transcripts = db.get_transcripts(call_id)
    if not transcripts:
        return

    full_text = "\n".join([f"{t['speaker'].upper()}: {t['text']}" for t in transcripts])

    lower_text = full_text.lower()
    topics = []
    if any(term in lower_text for term in ["voice", "session", "call"]):
        topics.append("voice_session")
    if any(term in lower_text for term in ["interrupt", "stop", "speaking"]):
        topics.append("interruption")
    if any(term in lower_text for term in ["transcript", "history", "context"]):
        topics.append("session_context")

    turn_count = len(transcripts)
    summary_text = (
        f"Voice session completed with {turn_count} transcript turns. "
        "The conversation remained focused on HERMION's real-time voice assistant capabilities."
    )
    next_steps = (
        "Review the transcript and continue refining the real-time voice workflow."
        if turn_count > 2
        else "Start another session to continue testing the voice interaction flow."
    )

    db.save_summary({
        "id": str(uuid.uuid4()),
        "call_id": call_id,
        "summary_text": summary_text,
        "next_steps": next_steps,
        "objections_raised": topics,
        "sentiment": "positive" if turn_count > 2 else "neutral"
    })


@router.get("")
@router.get("/")
def list_calls(lead_id: Optional[str] = None):
    if lead_id:
        return db.get_calls_for_lead(lead_id)
    # Return all calls
    if db.use_supabase and db.supabase_client:
        try:
            res = db.supabase_client.table("calls").select("*").order("started_at", desc=True).execute()
            return res.data or []
        except Exception as e:
            print(f"[API] list_calls error: {e}")
    return db._sqlite_execute("SELECT * FROM calls ORDER BY started_at DESC")


@router.post("")
@router.post("/")
def create_call_record(call_data: Dict[str, Any]):
    record = db.create_call(call_data)
    return record


@router.patch("/{call_id}")
async def end_call_record(call_id: str, request: Request, background_tasks: BackgroundTasks):
    data = await request.json() if request.headers.get("content-type", "").startswith("application/json") else {}
    data["ended_at"] = data.get("ended_at") or time.strftime("%Y-%m-%dT%H:%M:%SZ")
    data["outcome"] = data.get("outcome") or "completed"
    db.update_call(call_id, data)
    lead_id = data.get("lead_id", "")
    background_tasks.add_task(auto_generate_call_summary, call_id, lead_id)
    return {"status": "success", "call_id": call_id}


@router.get("/{call_id}/transcripts")
def get_transcripts(call_id: str):
    return db.get_transcripts(call_id)


@router.get("/{call_id}/summary")
def get_summary(call_id: str):
    summary = db.get_summary(call_id)
    return summary or {
        "summary_text": "Call completed. Summary pending.",
        "objections_raised": [],
        "sentiment": "neutral"
    }
