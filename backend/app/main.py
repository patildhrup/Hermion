import os
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config.config import settings
from app.api.routes import api_router
from app.mcp_service.mcp_server import mcp as hermion_mcp

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

# ── Static Frontend Serving ───────────────────────────────────────────────
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
