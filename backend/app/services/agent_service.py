import re
from typing import Dict, List, Tuple

import httpx

from app.config.config import settings
from app.database import mongo_db
from app.services.meeting_service import meeting_assistant_service
from app.services.mcp_runtime import mcp_runtime
from app.services.memory_service import memory_service
from app.services.qdrant_service import qdrant_store


SYSTEM_PROMPT = """You are HERMION, a voice-first workplace AI assistant that helps users manage their work, understand information, and execute approved tasks through connected workplace tools.
You are currently operating in a real-time voice session.

Rules:
- Respond in plain spoken English only.
- Keep responses concise and natural for speech.
- Use only the currently implemented capabilities.
- Use validated internal tools for calendar, email, tasks, documents, and memory requests.
- If an action requires approval, say that approval is required before it can be completed.
"""


class HermionAgentService:
    def __init__(self):
        self.groq_models = [m for m in settings.HERMION_MODELS if m] or [
            "openai/gpt-oss-20b",
            "llama-3.3-70b-versatile",
        ]

    def _strip_think_blocks(self, text: str) -> str:
        text = re.sub(r"<think>.*?</think>", "", text, flags=re.DOTALL)
        text = re.sub(r"<think>.*$", "", text, flags=re.DOTALL)
        return text.strip()

    def _normalize_output(self, text: str) -> str:
        for ch in ("*", "#", "`", "_"):
            text = text.replace(ch, "")
        text = text.replace("—", " - ").replace("–", "-").replace("\u2011", "-")
        text = text.replace("“", '"').replace("”", '"').replace("’", "'").replace("‘", "'")
        text = text.replace("\u202f", " ").replace("\u00a0", " ")
        return text.strip()

    def _retrieve_context(self, utterance: str, user_id: str) -> Tuple[List[str], List[str], List[Dict[str, str]]]:
        query = utterance.lower().strip()
        tools_used: List[str] = []
        retrieved: List[str] = []
        tool_results: List[Dict[str, str]] = []

        voice_keywords = {
            "voice", "session", "transcript", "microphone", "mic", "listening",
            "speaking", "interrupt", "interruption", "agora", "backend", "assistant",
            "work", "latency", "context",
        }
        if any(keyword in query for keyword in voice_keywords):
            hits = qdrant_store.search("product_knowledge", utterance, top_k=2)
            if hits:
                retrieved.append("\n---\n".join(hit["text"] for hit in hits))
                tools_used.append("search_product_docs")

        tool_requests = [
            ("get_calendar_events", ["meeting", "calendar", "schedule", "today"]),
            ("search_emails", ["email", "inbox", "mail"]),
            ("create_task", ["task", "remind me", "todo"]),
            ("search_documents", ["document", "architecture", "requirements", "file"]),
            ("search_memory", ["remember", "memory", "previous context", "migration"]),
        ]
        for tool_name, keywords in tool_requests:
            if any(keyword in query for keyword in keywords):
                payload = {"query": utterance}
                if tool_name == "get_calendar_events":
                    payload = {"date": ""}
                elif tool_name == "create_task":
                    payload = {"title": utterance, "priority": "medium", "due_date": ""}
                result = mcp_runtime.execute(tool_name, payload, {"user_id": user_id})
                tools_used.append(tool_name)
                tool_results.append({
                    "tool": tool_name,
                    "status": result["status"],
                    "message": str(result.get("data") or result.get("message") or result.get("error")),
                })
                if result["status"] == "success":
                    retrieved.append(f"[{tool_name.upper()}]\n{result['data']}")

        if any(keyword in query for keyword in ["remember that", "remember this", "store this"]):
            memory_result = mcp_runtime.execute(
                "store_memory",
                {"text": utterance, "metadata": {"source": "voice"}},
                {"user_id": user_id},
            )
            tools_used.append("store_memory")
            tool_results.append({
                "tool": "store_memory",
                "status": memory_result["status"],
                "message": str(memory_result.get("data") or memory_result.get("error")),
            })

        if any(keyword in query for keyword in ["summarize the meeting", "what decisions", "action items", "deadlines", "participants mentioned"]):
            meeting_summary = meeting_assistant_service.analyze_transcript(utterance)
            retrieved.append(f"[MEETING ASSISTANT]\n{meeting_summary}")
            tools_used.append("meeting_assistant")

        memory_service.store_short_term(session_id="agent-session", role="user", text=utterance)

        return retrieved, tools_used, tool_results

    def _load_session_history(self, session_id: str, current_messages: List[Dict[str, str]]) -> List[Dict[str, str]]:
        if not session_id:
            return current_messages

        conversation = mongo_db.get_conversation(session_id)
        if not conversation:
            return current_messages

        persisted_messages = [
            {"role": message.get("role", "user"), "content": message.get("content", "")}
            for message in conversation.get("messages", [])
            if message.get("content")
        ]
        if not persisted_messages:
            return current_messages

        merged = persisted_messages + current_messages
        compact: List[Dict[str, str]] = []
        seen = set()
        for item in merged:
            key = (item.get("role", ""), item.get("content", ""))
            if key in seen or not key[1]:
                continue
            seen.add(key)
            compact.append({"role": key[0], "content": key[1]})
        return compact[-10:]

    def _call_groq(self, messages: List[Dict[str, str]]) -> str:
        if not settings.GROQ_API_KEY:
            raise RuntimeError("GROQ_API_KEY not configured")

        headers = {
            "Authorization": f"Bearer {settings.GROQ_API_KEY}",
            "Content-Type": "application/json",
        }
        last_error = None
        for model_name in self.groq_models:
            payload = {
                "model": model_name,
                "messages": messages,
                "temperature": 0.3,
                "max_tokens": 160,
            }
            try:
                with httpx.Client(timeout=12.0) as client:
                    response = client.post(
                        "https://api.groq.com/openai/v1/chat/completions",
                        json=payload,
                        headers=headers,
                    )
                if response.status_code != 200:
                    raise RuntimeError(f"Groq error [{response.status_code}]")
                content = response.json()["choices"][0]["message"]["content"]
                return self._normalize_output(self._strip_think_blocks(content))
            except Exception as exc:
                last_error = exc
                continue

        raise RuntimeError(str(last_error) if last_error else "Groq request failed")

    def _heuristic_fallback(self, utterance: str, context_blocks: List[str], tool_results: List[Dict[str, str]]) -> str:
        query = utterance.lower()
        if tool_results:
            latest = tool_results[-1]
            if latest["status"] == "requires_approval":
                return "I can prepare that action, but I need your approval before completing it."
            if latest["status"] == "success":
                return f"I found the relevant result through {latest['tool'].replace('_', ' ')}."
        if context_blocks:
            return self._normalize_output(context_blocks[0].split("---")[0][:260])
        if any(keyword in query for keyword in ["interrupt", "barge", "stop", "speaking"]):
            return "I can stop speaking when you interrupt and continue the conversation from your latest turn."
        if any(keyword in query for keyword in ["voice", "session", "microphone", "transcript"]):
            return "I can start a live voice session, keep the transcript updated, and respond with session-aware replies."
        return "I'm HERMION, your intelligent voice work assistant. How can I help you in this session?"

    def process_turn(
        self,
        messages: List[Dict[str, str]],
        session_id: str = "",
        user_id: str = "",
    ) -> Tuple[str, List[str]]:
        current_messages = [
            {"role": message.get("role", "user"), "content": message.get("content", "")}
            for message in messages
            if message.get("content")
        ]
        history = self._load_session_history(session_id, current_messages)
        latest_user_text = next(
            (message["content"] for message in reversed(current_messages) if message.get("role") == "user"),
            "",
        )

        context_blocks, tools_used, tool_results = self._retrieve_context(latest_user_text, user_id)
        llm_messages: List[Dict[str, str]] = [{"role": "system", "content": SYSTEM_PROMPT}]
        if context_blocks:
            llm_messages.append(
                {
                    "role": "system",
                    "content": "Verified context:\n" + "\n\n".join(context_blocks),
                }
            )
        if tool_results:
            llm_messages.append(
                {
                    "role": "system",
                    "content": "Tool execution results:\n" + "\n".join(
                        f"{item['tool']}: {item['status']} - {item['message']}" for item in tool_results
                    ),
                }
            )
        llm_messages.extend(history[-8:])

        try:
            response = self._call_groq(llm_messages)
        except Exception:
            response = self._heuristic_fallback(latest_user_text, context_blocks, tool_results)

        return response, tools_used


hermion_agent_service = HermionAgentService()
