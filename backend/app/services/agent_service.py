import re
from typing import Dict, List, Tuple

import httpx

from app.config.config import settings
from app.database import mongo_db
from app.services.qdrant_service import qdrant_store


SYSTEM_PROMPT = """You are HERMION, a voice-first workplace AI assistant that helps users manage their work, understand information, and execute approved tasks through connected workplace tools.
You are currently operating in a real-time voice session.

Rules:
- Respond in plain spoken English only.
- Keep responses concise and natural for speech.
- Use only the currently implemented capabilities.
- Right now, focus on voice interaction, transcript continuity, interruption handling, and session-aware responses.
- If the user asks for calendar, email, documents, GitHub, Slack, RAG workflows beyond the current scope, or tool execution that is not implemented yet, say that it is not available yet.
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

    def _retrieve_context(self, utterance: str) -> Tuple[List[str], List[str]]:
        query = utterance.lower().strip()
        tools_used: List[str] = []
        retrieved: List[str] = []

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

        return retrieved, tools_used

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

    def _heuristic_fallback(self, utterance: str, context_blocks: List[str]) -> str:
        query = utterance.lower()
        if context_blocks:
            return self._normalize_output(context_blocks[0].split("---")[0][:260])
        if any(keyword in query for keyword in ["calendar", "email", "document", "github", "slack", "task"]):
            return "That workflow is not implemented yet. Right now I can help with real-time voice interaction and maintain this session."
        if any(keyword in query for keyword in ["interrupt", "barge", "stop", "speaking"]):
            return "I can stop speaking when you interrupt and continue the conversation from your latest turn."
        if any(keyword in query for keyword in ["voice", "session", "microphone", "transcript"]):
            return "I can start a live voice session, keep the transcript updated, and respond with session-aware replies."
        return "I'm HERMION, your intelligent voice work assistant. How can I help you in this session?"

    def process_turn(
        self,
        messages: List[Dict[str, str]],
        session_id: str = "",
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

        context_blocks, tools_used = self._retrieve_context(latest_user_text)
        llm_messages: List[Dict[str, str]] = [{"role": "system", "content": SYSTEM_PROMPT}]
        if context_blocks:
            llm_messages.append(
                {
                    "role": "system",
                    "content": "Verified context:\n" + "\n\n".join(context_blocks),
                }
            )
        llm_messages.extend(history[-8:])

        try:
            response = self._call_groq(llm_messages)
        except Exception:
            response = self._heuristic_fallback(latest_user_text, context_blocks)

        return response, tools_used


hermion_agent_service = HermionAgentService()
