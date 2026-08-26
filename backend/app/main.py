import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config.config import settings
from app.api.routes import api_router
from app.mcp_service.mcp_server import mcp as hermion_mcp

app = FastAPI(
    title="HERMION AI Voice Sales Agent API",
    description="Real-Time AI Voice Sales Agent Engine powered by Agora Conversational AI & LangChain",
    version="1.0.0"
)

# CORS configuration — allow all origins so frontend (any domain) can reach the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Mount FastMCP at /mcp (SSE transport) ──────────────────────────────────
try:
    mcp_app = hermion_mcp.http_app(path="/")
    app.mount("/mcp", mcp_app)
    print("[MCP] FastMCP server mounted at /mcp")
except Exception as e:
    print(f"[MCP] Mount warning: {e}")

# ── Mount Modular API Routes ──────────────────────────────────────────────
# Include routes at root (e.g. /health, /llm, /conversations) and under /api
app.include_router(api_router)
app.include_router(api_router, prefix="/api")


@app.get("/")
async def root():
    """Root endpoint — confirms backend is live."""
    return {
        "status": "ok",
        "service": "HERMION AI Voice Sales Agent API",
        "version": "1.0.0",
        "docs": "/docs",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=True)

