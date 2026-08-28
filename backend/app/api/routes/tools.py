from typing import Any, Dict, Optional

from fastapi import APIRouter
from pydantic import BaseModel

from app.services.mcp_runtime import TOOL_SCHEMAS, mcp_runtime

router = APIRouter(prefix="/tools", tags=["MCP Tool Runtime"])


class ToolExecutionRequest(BaseModel):
    tool: str
    payload: Dict[str, Any]
    user_id: str
    session_id: Optional[str] = ""
    approved: Optional[bool] = False


@router.get("")
@router.get("/")
def list_tool_schemas():
    return {
        name: model.model_json_schema()
        for name, model in TOOL_SCHEMAS.items()
    }


@router.post("/execute")
def execute_tool(req: ToolExecutionRequest):
    return mcp_runtime.execute(
        req.tool,
        req.payload,
        {"user_id": req.user_id, "session_id": req.session_id or "", "approved": bool(req.approved)},
    )
