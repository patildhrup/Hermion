import os
import time
import uuid
import json
import jwt
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, HTTPException, Request, Header, BackgroundTasks
from fastapi.responses import JSONResponse, StreamingResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from config.config import settings
from database.database import db
from services.qdrant_service import qdrant_store
from agent.agent import sales_agent
from services.agora_service import generate_agora_rtc_token, agora_ai_service
from mcp_service.mcp_server import mcp as hermion_mcp

app = FastAPI(
    title="HERMION AI Voice Sales Agent API",
    description="Real-Time AI Voice Sales Agent Engine powered by Agora Conversational AI & LangChain",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Mount FastMCP at /mcp (SSE transport) ──────────────────────────────────
# The MCP server is accessible at:
#   GET  /mcp          → SSE stream (for MCP clients like Claude Desktop)
#   POST /mcp/messages → client→server messages
# Any MCP-aware client can discover and call HERMION's tools here.
try:
    mcp_app = hermion_mcp.http_app(path="/")
    app.mount("/mcp", mcp_app)
    print("[MCP] FastMCP server mounted at /mcp")
except Exception as e:
    print(f"[MCP] Mount warning: {e}")

# --- Models ---
class ChatMessage(BaseModel):
    role: str
    content: str

class LLMRequest(BaseModel):
    messages: List[ChatMessage]
    model: Optional[str] = "hermion-sales-agent"
    stream: Optional[bool] = False
    lead_id: Optional[str] = ""
    call_id: Optional[str] = ""

class CreateLeadRequest(BaseModel):
    name: str
    company: str
    contact_info: Optional[str] = ""
    qualification_score: Optional[int] = 0
    status: Optional[str] = "new"

class StartAgentRequest(BaseModel):
    channel_name: str
    lead_id: Optional[str] = ""

class QdrantSearchRequest(BaseModel):
    collection: str
    query: str
    top_k: Optional[int] = 3

class AuthLoginRequest(BaseModel):
    email: str
    password: str

class AuthSignupRequest(BaseModel):
    email: str
    password: str
    username: Optional[str] = ""

# --- Helper Functions ---
JWT_SECRET = "hermion-secret-key-echo-sphere-2026"

def create_jwt_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "exp": int(time.time()) + 86400 * 7
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")

def auto_generate_call_summary(call_id: str, lead_id: str = ""):
    """Async task to summarize call after hangup."""
    transcripts = db.get_transcripts(call_id)
    if not transcripts:
        return

    full_text = "\n".join([f"{t['speaker'].upper()}: {t['text']}" for t in transcripts])
    
    # Analyze objections & score
    objections = []
    if "expensive" in full_text.lower() or "cost" in full_text.lower() or "price" in full_text.lower():
        objections.append("pricing")
    if "ai" in full_text.lower() or "bot" in full_text.lower():
        objections.append("authenticity")
    if "setup" in full_text.lower() or "hard" in full_text.lower():
        objections.append("setup_complexity")

    has_demo = "demo" in full_text.lower() or "booked" in full_text.lower() or "thursday" in full_text.lower()
    score = 85 if has_demo else (70 if len(transcripts) > 4 else 45)

    summary_text = (
        f"Call transcript consisted of {len(transcripts)} turns. Prospect expressed interest in HERMION voice SDR capabilities. "
        + ("Demo booked successfully for Thursday." if has_demo else "Prospect was qualified and pricing options were presented.")
    )
    next_steps = "Follow up with calendar invite and product whitepaper." if has_demo else "Schedule follow-up call next week."

    db.save_summary({
        "id": str(uuid.uuid4()),
        "call_id": call_id,
        "summary_text": summary_text,
        "next_steps": next_steps,
        "objections_raised": objections,
        "sentiment": "positive" if score >= 70 else "neutral"
    })

    if lead_id:
        db.update_lead(lead_id, {
            "qualification_score": score,
            "status": "demo_booked" if has_demo else "qualified"
        })

# --- Health Check ---
@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": "HERMION AI Engine",
        "public_url": settings.get_public_url(),
        "agora_app_id_configured": bool(settings.AGORA_APP_ID),
        "groq_configured": bool(settings.GROQ_API_KEY)
    }

@app.get("/mcp/tools")
def list_mcp_tools():
    """List available MCP tools for introspection."""
    return [
        {
            "name": tool.name,
            "description": tool.description,
            "parameters": tool.parameters.model_json_schema()
        } for tool in hermion_mcp._tool_manager.list_tools()
    ]

# --- Core Agora Custom LLM Endpoint ---
@app.post("/llm")
@app.post("/llm/chat/completions")
@app.post("/chat/completions")
async def agora_llm_endpoint(req: LLMRequest, background_tasks: BackgroundTasks):
    """
    Main Turn Endpoint called by Agora Conversational AI Engine on every turn.
    Input: OpenAI format messages array
    Output: OpenAI format completion object or stream
    """
    messages = [{"role": m.role, "content": m.content} for m in req.messages]
    
    # Execute turn via LangChain agent
    agent_response, tools_used = sales_agent.process_turn(messages, lead_id=req.lead_id or "")

    # Save transcripts to DB
    if req.call_id or req.lead_id:
        call_id = req.call_id or "active-call"
        # Find latest user message
        latest_user_msg = next((m.content for m in reversed(req.messages) if m.role == "user"), "")
        if latest_user_msg:
            background_tasks.add_task(db.save_transcript, call_id, "prospect", latest_user_msg)
        background_tasks.add_task(db.save_transcript, call_id, "hermion", agent_response)

    response_payload = {
        "id": f"chatcmpl-{str(uuid.uuid4())[:8]}",
        "object": "chat.completion",
        "created": int(time.time()),
        "model": "hermion-sales-agent",
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

# --- Auth Endpoints ---
@app.post("/auth/signup")
def signup(req: AuthSignupRequest):
    # Prefer real Supabase auth when configured
    if db.use_supabase and db.supabase_client:
        try:
            res = db.supabase_client.auth.sign_up({
                "email": req.email,
                "password": req.password,
                "options": {"data": {"username": req.username or req.email.split("@")[0]}}
            })
            if res.user:
                token = create_jwt_token(str(res.user.id), req.email)
                return {"id": str(res.user.id), "email": req.email,
                        "username": req.username or req.email.split("@")[0], "token": token}
        except Exception as e:
            print(f"[Auth] Supabase signup error: {e}")
    # Fallback JWT-only
    user_id = str(uuid.uuid4())
    token = create_jwt_token(user_id, req.email)
    return {"id": user_id, "email": req.email,
            "username": req.username or req.email.split("@")[0], "token": token}

@app.post("/auth/login")
def login(req: AuthLoginRequest):
    if db.use_supabase and db.supabase_client:
        try:
            res = db.supabase_client.auth.sign_in_with_password({
                "email": req.email, "password": req.password
            })
            if res.user:
                token = create_jwt_token(str(res.user.id), req.email)
                return {"id": str(res.user.id), "email": req.email,
                        "username": req.email.split("@")[0], "token": token}
        except Exception as e:
            raise HTTPException(status_code=401, detail=f"Login failed: {e}")
    # Fallback
    user_id = "user-" + str(abs(hash(req.email)) % 1000000)
    token = create_jwt_token(user_id, req.email)
    return {"id": user_id, "email": req.email,
            "username": req.email.split("@")[0], "token": token}

@app.get("/auth/me")
def me(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        return {"authenticated": False, "user": None}
    token = authorization.split(" ")[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        return {
            "authenticated": True,
            "user": {
                "id": payload["sub"],
                "email": payload["email"],
                "username": payload["email"].split("@")[0]
            }
        }
    except Exception:
        return {"authenticated": False, "user": None}

# --- Agora Engine Endpoints ---
@app.get("/agora/token")
def get_agora_token(channel: str, uid: Optional[str] = "0"):
    token = generate_agora_rtc_token(channel_name=channel, uid=uid)
    return {
        "channel": channel,
        "uid": uid,
        "token": token,
        "app_id": settings.AGORA_APP_ID or "demo_agora_app_id"
    }

@app.post("/agora/start-agent")
def start_agora_agent(req: StartAgentRequest):
    res = agora_ai_service.start_agent_session(channel_name=req.channel_name, lead_id=req.lead_id or "")
    return res

# --- Leads & CRM Endpoints ---
@app.get("/leads")
def list_leads():
    return db.get_leads()

@app.post("/leads")
def create_lead(req: CreateLeadRequest):
    lead = db.create_lead(req.dict())
    return lead

@app.patch("/leads/{lead_id}")
def update_lead(lead_id: str, updates: Dict[str, Any]):
    updated = db.update_lead(lead_id, updates)
    return updated or {"status": "ok"}

# --- Calls & Transcripts Endpoints ---
@app.get("/calls")
def list_calls(lead_id: Optional[str] = None):
    if lead_id:
        return db.get_calls_for_lead(lead_id)
    # Return all calls (for admin dashboard view)
    if db.use_supabase and db.supabase_client:
        try:
            res = db.supabase_client.table("calls").select("*").order("started_at", desc=True).execute()
            return res.data or []
        except Exception as e:
            print(f"[API] list_calls error: {e}")
    return db._sqlite_execute("SELECT * FROM calls ORDER BY started_at DESC")

@app.post("/calls")
def create_call_record(call_data: Dict[str, Any]):
    record = db.create_call(call_data)
    return record

@app.patch("/calls/{call_id}")
async def end_call_record(call_id: str, request: Request, background_tasks: BackgroundTasks):
    data = await request.json() if request.headers.get("content-type", "").startswith("application/json") else {}
    data["ended_at"] = data.get("ended_at") or time.strftime("%Y-%m-%dT%H:%M:%SZ")
    data["outcome"] = data.get("outcome") or "completed"
    db.update_call(call_id, data)
    lead_id = data.get("lead_id", "")
    background_tasks.add_task(auto_generate_call_summary, call_id, lead_id)
    return {"status": "success", "call_id": call_id}

@app.get("/calls/{call_id}/transcripts")
def get_transcripts(call_id: str):
    return db.get_transcripts(call_id)

@app.get("/calls/{call_id}/summary")
def get_summary(call_id: str):
    summary = db.get_summary(call_id)
    return summary or {"summary_text": "Call completed. Summary pending.", "objections_raised": [], "sentiment": "neutral"}

# --- Qdrant Search API ---
@app.post("/qdrant/search")
def search_qdrant_api(req: QdrantSearchRequest):
    results = qdrant_store.search(req.collection, req.query, req.top_k or 3)
    return {
        "collection": req.collection,
        "query": req.query,
        "results": results
    }

# --- Webhook Endpoint for Agora ---
@app.post("/webhooks/agora")
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

# --- Static Frontend Serving ---
frontend_dist_path = os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")
if os.path.exists(frontend_dist_path):
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dist_path, "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        if full_path.startswith("api/") or full_path in ["llm", "chat/completions", "health"]:
            raise HTTPException(status_code=404)
        file_p = os.path.join(frontend_dist_path, full_path)
        if os.path.exists(file_p) and os.path.isfile(file_p):
            return FileResponse(file_p)
        return FileResponse(os.path.join(frontend_dist_path, "index.html"))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host=settings.HOST, port=settings.PORT, reload=True)
