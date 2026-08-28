from fastapi import APIRouter
from app.config.config import settings
from app.mcp_service.mcp_server import mcp as hermion_mcp

router = APIRouter(tags=["Health & MCP"])


@router.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": "HERMION AI Engine",
        "public_url": settings.get_public_url(),
        "agora_app_id_configured": bool(settings.AGORA_APP_ID),
        "groq_configured": bool(settings.GROQ_API_KEY)
    }


@router.get("/mcp/tools")
async def list_mcp_tools():
    """List available MCP tools for introspection."""
    tools = await hermion_mcp.list_tools()
    return [
        {
            "name": tool.name,
            "description": tool.description,
            "parameters": tool.parameters,
        }
        for tool in tools
    ]
