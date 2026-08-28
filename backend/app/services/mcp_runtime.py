from typing import Any, Dict, List

from pydantic import BaseModel, Field, ValidationError

from app.services.calendar_service import calendar_service
from app.services.document_service import document_service
from app.services.email_service import email_service
from app.services.memory_service import memory_service
from app.services.task_service import task_service


class ToolExecutionContext(BaseModel):
    user_id: str = ""
    session_id: str = ""
    approved: bool = False


class GetCalendarEventsInput(BaseModel):
    date: str = ""


class CreateMeetingInput(BaseModel):
    title: str
    start_time: str
    attendees: List[str] = Field(default_factory=list)


class RescheduleMeetingInput(BaseModel):
    meeting_id: str
    new_start_time: str


class SearchEmailsInput(BaseModel):
    query: str


class DraftEmailInput(BaseModel):
    to: str
    subject: str
    message: str


class SendEmailInput(BaseModel):
    draft_id: str


class CreateTaskInput(BaseModel):
    title: str
    priority: str = "medium"
    due_date: str = ""


class UpdateTaskInput(BaseModel):
    task_id: str
    updates: Dict[str, Any]


class CompleteTaskInput(BaseModel):
    task_id: str


class SearchDocumentsInput(BaseModel):
    query: str


class StoreMemoryInput(BaseModel):
    text: str
    metadata: Dict[str, Any] = Field(default_factory=dict)


class SearchMemoryInput(BaseModel):
    query: str
    top_k: int = 3


TOOL_SCHEMAS = {
    "get_calendar_events": GetCalendarEventsInput,
    "create_meeting": CreateMeetingInput,
    "reschedule_meeting": RescheduleMeetingInput,
    "search_emails": SearchEmailsInput,
    "draft_email": DraftEmailInput,
    "send_email": SendEmailInput,
    "create_task": CreateTaskInput,
    "update_task": UpdateTaskInput,
    "complete_task": CompleteTaskInput,
    "search_documents": SearchDocumentsInput,
    "store_memory": StoreMemoryInput,
    "search_memory": SearchMemoryInput,
}

APPROVAL_REQUIRED = {"create_meeting", "reschedule_meeting", "send_email"}


class MCPRuntime:
    def _require_user(self, context: ToolExecutionContext):
        if not context.user_id:
            raise PermissionError("Authenticated user context is required for this tool.")

    def execute(self, tool_name: str, payload: Dict[str, Any], context: Dict[str, Any] | None = None) -> Dict[str, Any]:
        if tool_name not in TOOL_SCHEMAS:
            return {"tool": tool_name, "status": "failed", "error": "Unknown tool"}

        try:
            validated = TOOL_SCHEMAS[tool_name](**payload)
            execution_context = ToolExecutionContext(**(context or {}))
            self._require_user(execution_context)

            if tool_name in APPROVAL_REQUIRED and not execution_context.approved:
                return {
                    "tool": tool_name,
                    "status": "requires_approval",
                    "message": f"{tool_name} requires approval before execution.",
                    "data": validated.model_dump(),
                }

            data = self._dispatch(tool_name, validated, execution_context)
            return {"tool": tool_name, "status": "success", "data": data}
        except ValidationError as exc:
            return {"tool": tool_name, "status": "failed", "error": exc.errors()}
        except PermissionError as exc:
            return {"tool": tool_name, "status": "failed", "error": str(exc)}
        except Exception as exc:
            return {"tool": tool_name, "status": "failed", "error": str(exc)}

    def _dispatch(self, tool_name: str, validated: BaseModel, context: ToolExecutionContext):
        data = validated.model_dump()
        if tool_name == "get_calendar_events":
            return calendar_service.get_calendar_events(data["date"])
        if tool_name == "create_meeting":
            return calendar_service.create_meeting(data["title"], data["start_time"], data["attendees"])
        if tool_name == "reschedule_meeting":
            return calendar_service.reschedule_meeting(data["meeting_id"], data["new_start_time"])
        if tool_name == "search_emails":
            return email_service.search_emails(data["query"])
        if tool_name == "draft_email":
            return email_service.draft_email(data["to"], data["subject"], data["message"])
        if tool_name == "send_email":
            return email_service.send_email(data["draft_id"])
        if tool_name == "create_task":
            return task_service.create_task(data["title"], data["priority"], data["due_date"])
        if tool_name == "update_task":
            return task_service.update_task(data["task_id"], data["updates"])
        if tool_name == "complete_task":
            return task_service.complete_task(data["task_id"])
        if tool_name == "search_documents":
            return document_service.search_documents(context.user_id, data["query"])
        if tool_name == "store_memory":
            return memory_service.store_memory(context.user_id, data["text"], data["metadata"])
        if tool_name == "search_memory":
            return memory_service.search_memory(context.user_id, data["query"], data["top_k"])
        raise ValueError("Unhandled tool")


mcp_runtime = MCPRuntime()
