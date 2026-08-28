"""
HERMION FastMCP Server
----------------------
Exposes validated workplace-agent tools through a modular MCP surface.
"""

from fastmcp import FastMCP

from app.services.mcp_runtime import mcp_runtime

mcp = FastMCP(
    name="HERMION Workplace MCP",
    version="2.0.0",
)


@mcp.tool(description="Get calendar events for a date or date range.")
def get_calendar_events(user_id: str, date: str = ""):
    return mcp_runtime.execute("get_calendar_events", {"date": date}, {"user_id": user_id})


@mcp.tool(description="Create a meeting after approval.")
def create_meeting(user_id: str, title: str, start_time: str, attendees: list[str] | None = None, approved: bool = False):
    return mcp_runtime.execute(
        "create_meeting",
        {"title": title, "start_time": start_time, "attendees": attendees or []},
        {"user_id": user_id, "approved": approved},
    )


@mcp.tool(description="Reschedule an existing meeting after approval.")
def reschedule_meeting(user_id: str, meeting_id: str, new_start_time: str, approved: bool = False):
    return mcp_runtime.execute(
        "reschedule_meeting",
        {"meeting_id": meeting_id, "new_start_time": new_start_time},
        {"user_id": user_id, "approved": approved},
    )


@mcp.tool(description="Search emails using a human-readable query.")
def search_emails(user_id: str, query: str):
    return mcp_runtime.execute("search_emails", {"query": query}, {"user_id": user_id})


@mcp.tool(description="Create an email draft.")
def draft_email(user_id: str, to: str, subject: str, message: str):
    return mcp_runtime.execute(
        "draft_email",
        {"to": to, "subject": subject, "message": message},
        {"user_id": user_id},
    )


@mcp.tool(description="Send a draft email after approval.")
def send_email(user_id: str, draft_id: str, approved: bool = False):
    return mcp_runtime.execute(
        "send_email",
        {"draft_id": draft_id},
        {"user_id": user_id, "approved": approved},
    )


@mcp.tool(description="Create a task.")
def create_task(user_id: str, title: str, priority: str = "medium", due_date: str = ""):
    return mcp_runtime.execute(
        "create_task",
        {"title": title, "priority": priority, "due_date": due_date},
        {"user_id": user_id},
    )


@mcp.tool(description="Update an existing task.")
def update_task(user_id: str, task_id: str, updates: dict):
    return mcp_runtime.execute(
        "update_task",
        {"task_id": task_id, "updates": updates},
        {"user_id": user_id},
    )


@mcp.tool(description="Mark a task as completed.")
def complete_task(user_id: str, task_id: str):
    return mcp_runtime.execute("complete_task", {"task_id": task_id}, {"user_id": user_id})


@mcp.tool(description="Search indexed documents.")
def search_documents(user_id: str, query: str):
    return mcp_runtime.execute("search_documents", {"query": query}, {"user_id": user_id})


@mcp.tool(description="Store long-term memory.")
def store_memory(user_id: str, text: str, metadata: dict | None = None):
    return mcp_runtime.execute(
        "store_memory",
        {"text": text, "metadata": metadata or {}},
        {"user_id": user_id},
    )


@mcp.tool(description="Search long-term memory.")
def search_memory(user_id: str, query: str, top_k: int = 3):
    return mcp_runtime.execute(
        "search_memory",
        {"query": query, "top_k": top_k},
        {"user_id": user_id},
    )
