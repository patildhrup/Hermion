"""
HERMION Sales Agent
-------------------
Orchestrates each conversational turn:
  1. Decide which MCP tools to call (RAG retrieval / CRM / booking)
  2. Execute them in-process via the FastMCP server object
  3. Inject retrieved context into the system prompt
  4. Call the LLM with model-fallback chain (Groq → OpenRouter → heuristic)
  5. Return clean TTS-ready plain text
"""

import re
import httpx
from typing import List, Dict, Any, Tuple

from app.config.config import settings
# Import the MCP server – tools are invoked directly as Python functions here,
# meaning zero network overhead while still registering on the MCP protocol.
from app.mcp_service.mcp_server import (
    search_product_docs,
    search_pricing,
    search_objection_playbook,
    check_calendar_availability,
    book_demo,
    update_lead_status,
    escalate_to_human,
)

# ── System Prompt ──────────────────────────────────────────────────────────
SYSTEM_PROMPT = """You are HERMION, a real-time AI voice sales rep for EchoSphere AI.
You are on a LIVE VOICE CALL with a prospect.

VOICE RULES (non-negotiable):
• Output ONLY plain spoken English — no markdown, no bullet points, no asterisks, no headers.
• Keep every response to 1-3 short sentences. Voice responses must be concise.
• Never read out URLs, JSON, or technical identifiers.

SALES MOTION:
1. Greet warmly, ask 2-3 qualifying questions (team size, use case, timeline).
2. Educate using ONLY facts from retrieved context — never invent pricing or features.
3. Handle objections using the retrieved rebuttal from the playbook, adapted to natural speech.
4. When prospect shows interest, check calendar availability, confirm a slot, then book_demo.

GROUNDING RULE:
If the prospect asks about pricing, features, or objections — the retrieved context block
below contains the verified answer. Use it. Do NOT invent numbers or policies.

TOOLS AVAILABLE (already executed — context injected below):
• search_product_docs  → product capabilities
• search_pricing       → plan tiers, limits, pricing
• search_objection_playbook → proven rebuttals
• check_calendar_availability → open demo slots
• book_demo            → confirm meeting, update CRM
• update_lead_status   → qualification score mid-call
• escalate_to_human    → when legal/custom/angry escalation needed
"""


def _strip_think_blocks(text: str) -> str:
    """Remove <think>...</think> blocks including truncated unclosed ones."""
    # Remove complete <think>...</think> blocks (including newlines)
    text = re.sub(r'<think>.*?</think>', '', text, flags=re.DOTALL)
    # Remove any remaining unclosed <think> block (truncated by max_tokens)
    text = re.sub(r'<think>.*$', '', text, flags=re.DOTALL)
    return text.strip()


class SalesAgent:
    def __init__(self):
        self.models = settings.HERMION_MODELS

    # ── LLM call with multi-provider fallback chain ───────────────────────
    def _call_groq(self, messages: List[Dict[str, str]], model_name: str) -> str:
        if not settings.GROQ_API_KEY:
            raise RuntimeError("GROQ_API_KEY not configured")
        headers = {
            "Authorization": f"Bearer {settings.GROQ_API_KEY}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": model_name,
            "messages": messages,
            "temperature": 0.45,
            "max_tokens": 180,
        }
        with httpx.Client(timeout=10.0) as client:
            resp = client.post("https://api.groq.com/openai/v1/chat/completions", json=payload, headers=headers)
            if resp.status_code != 200:
                raise RuntimeError(f"Groq error [{resp.status_code}]: {resp.text[:200]}")
            content = resp.json()["choices"][0]["message"]["content"]
            return _strip_think_blocks(content)

    def _call_openrouter(self, messages: List[Dict[str, str]], model_name: str) -> str:
        if not settings.OPENROUTER_API_KEY:
            raise RuntimeError("OPENROUTER_API_KEY not configured")
        headers = {
            "Authorization": f"Bearer {settings.OPENROUTER_API_KEY}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://hermion.ai",
            "X-Title": "HERMION Sales Agent"
        }
        payload = {
            "model": model_name,
            "messages": messages,
            "temperature": 0.45,
            "max_tokens": 180,
        }
        with httpx.Client(timeout=12.0) as client:
            resp = client.post("https://openrouter.ai/api/v1/chat/completions", json=payload, headers=headers)
            if resp.status_code == 429:
                raise RuntimeError(f"OpenRouter rate-limited [{model_name}]")
            if resp.status_code != 200:
                raise RuntimeError(f"OpenRouter error [{resp.status_code}]: {resp.text[:200]}")
            content = resp.json()["choices"][0]["message"]["content"]
            return _strip_think_blocks(content)

    def _call_llm_chain(self, messages: List[Dict[str, str]]) -> str:
        """Execute turn across multi-provider waterfall chain: Groq -> OpenRouter -> Heuristic."""
        # 1. Try Groq first — only confirmed-working models as of 2026-08
        groq_models = [
            "qwen/qwen3.8-27b",        # best quality, concise, follows persona
            "qwen/qwen3.6-27b",        # solid fallback
            "openai/gpt-oss-20b",      # fast, reliable
            "openai/gpt-oss-120b",     # powerful, may have charmap issues on Windows print
            "groq/compound-mini",      # ultra-fast ultra-small
        ]
        for g_model in groq_models:
            try:
                text = self._call_groq(messages, g_model)
                if text:
                    print(f"[Agent] Responded via Groq ({g_model})")
                    return text
            except Exception as e:
                print(f"[Agent Fallback] Groq ({g_model}) error: {str(e)[:120]}")

        # 2. Try OpenRouter fallback — confirmed-working free models
        or_models = [
            "nvidia/nemotron-3-super-120b-a12b:free",
            "nvidia/nemotron-3-ultra-550b-a55b:free",
            "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
            "nvidia/nemotron-3.5-lightning:free",
            "google/gemma-4-31b-it:free",
            "google/gemma-4-26b-a4b-it:free",
            "minimax/minimax-m2.7:free",
        ]
        for or_model in or_models:
            try:
                text = self._call_openrouter(messages, or_model)
                if text:
                    print(f"[Agent] Responded via OpenRouter ({or_model})")
                    return text
            except Exception as e:
                print(f"[Agent Fallback] OpenRouter ({or_model}) error: {str(e)[:120]}")

        raise RuntimeError("All LLM providers failed")

    # ── Heuristic fallback when ALL providers fail ─────────────────────────
    def _heuristic_fallback(self, last_utt: str, context: List[str]) -> str:
        u = last_utt.lower()
        if context:
            # Return the first retrieved sentence from context
            first_ctx = context[0].split("---")[0].strip()
            return first_ctx[:280] if first_ctx else "Let me look that up for you just a moment."

        if any(k in u for k in ["price", "cost", "how much", "expensive"]):
            return "Our Pro plan is $299 a month for 2,500 call minutes and full CRM integration — that's a fraction of a full-time SDR's salary."
        if any(k in u for k in ["demo", "book", "schedule", "thursday", "friday"]):
            return "I have Thursday at 2 PM EST and Friday at 11 AM EST available. Which works best for your team?"
        if any(k in u for k in ["ai", "bot", "real", "human"]):
            return "I'm HERMION, an AI voice sales rep. I work with sub-300ms latency and ground every answer in your real product docs."
        return "Great question! I'm HERMION from EchoSphere AI. Can you tell me a bit about your team size and main use case?"

    # ── Tool dispatcher via MCP functions (in-process) ────────────────────
    def _run_tools(self, utt: str, lead_id: str) -> Tuple[List[str], List[str]]:
        """
        Determine which MCP tools to call based on the prospect utterance,
        execute them synchronously (in-process), and return:
          - retrieved_context: list of grounding strings to inject into the prompt
          - executed_tools:    list of tool names called (for logging/UI)
        """
        u = utt.lower()
        ctx: List[str] = []
        tools: List[str] = []

        # ── RAG: pricing ──────────────────────────────────────────────────
        price_kw = {"price", "pricing", "cost", "plan", "tier", "discount", "trial", "how much", "cheap", "expensive"}
        if any(k in u for k in price_kw):
            result = search_pricing(utt)
            ctx.append(f"[PRICING]\n{result}")
            tools.append("search_pricing")

        # ── RAG: objections ───────────────────────────────────────────────
        obj_kw = {"expensive", "competitor", "already have", "reps", "setup", "difficult", "trust", "bot", "ai", "replace"}
        if any(k in u for k in obj_kw):
            result = search_objection_playbook(utt)
            ctx.append(f"[OBJECTION PLAYBOOK]\n{result}")
            tools.append("search_objection_playbook")

        # ── RAG: product docs ─────────────────────────────────────────────
        prod_kw = {"feature", "how does", "integration", "crm", "latency", "interrupt", "barge", "capability", "work"}
        if any(k in u for k in prod_kw):
            result = search_product_docs(utt)
            ctx.append(f"[PRODUCT DOCS]\n{result}")
            tools.append("search_product_docs")

        # ── Calendar / Booking ────────────────────────────────────────────
        book_confirm_kw = {"book", "confirm", "thursday", "friday", "monday", "2pm", "11am", "3pm", "yes", "let's do"}
        book_check_kw   = {"demo", "schedule", "meeting", "calendar", "slot", "available", "when"}
        if any(k in u for k in book_confirm_kw | book_check_kw):
            if any(k in u for k in book_confirm_kw):
                # Prospect confirmed — book the demo
                result = book_demo(lead_id, "Thursday at 2:00 PM EST")
                ctx.append(f"[BOOKING CONFIRMED]\n{result}")
                tools.append("book_demo")
            else:
                result = check_calendar_availability()
                ctx.append(f"[CALENDAR AVAILABILITY]\n{result}")
                tools.append("check_calendar_availability")

        # ── Escalation ────────────────────────────────────────────────────
        esc_kw = {"legal", "contract", "lawyer", "compliance", "angry", "speak to human", "talk to someone"}
        if any(k in u for k in esc_kw):
            reason = f"Prospect requested: '{utt[:120]}'"
            result = escalate_to_human(lead_id, reason)
            ctx.append(f"[ESCALATION]\n{result}")
            tools.append("escalate_to_human")

        return ctx, tools

    # ── Main entry point ──────────────────────────────────────────────────
    def process_turn(
        self,
        messages: List[Dict[str, str]],
        lead_id: str = "",
    ) -> Tuple[str, List[str]]:
        """
        Process one conversational turn.

        Returns:
            (response_text, executed_tool_names)
        """
        # Extract latest prospect utterance
        last_utt = next(
            (m["content"] for m in reversed(messages) if m.get("role") == "user"),
            ""
        )

        # Run MCP tools
        retrieved_ctx, executed_tools = self._run_tools(last_utt, lead_id)

        # Build message array for LLM
        llm_messages = [{"role": "system", "content": SYSTEM_PROMPT}]
        if retrieved_ctx:
            llm_messages.append({
                "role": "system",
                "content": "=== VERIFIED RETRIEVED CONTEXT ===\n" + "\n\n".join(retrieved_ctx)
            })
        # Keep last 8 turns of conversation history for context continuity
        llm_messages.extend(messages[-8:])

        # Model-fallback chain (Groq -> OpenRouter -> Heuristic)
        response_text: str | None = None
        try:
            response_text = self._call_llm_chain(llm_messages)
        except Exception as e:
            print(f"[Agent Fallback] All LLM providers failed ({e}), using heuristic.")
            response_text = self._heuristic_fallback(last_utt, retrieved_ctx)

        # Strip any stray markdown that would sound bad in TTS
        for ch in ("*", "#", "`", "_", "**", "##"):
            response_text = response_text.replace(ch, "")
        
        # Replace special unicode dashes/quotes/spaces with standard ASCII for clean TTS & logging
        response_text = response_text.replace("—", " - ").replace("–", "-").replace("\u2011", "-")
        response_text = response_text.replace("“", '"').replace("”", '"').replace("’", "'").replace("‘", "'")
        response_text = response_text.replace("\u202f", " ").replace("\u00a0", " ")
        response_text = response_text.strip()

        return response_text, executed_tools


# Global singleton
sales_agent = SalesAgent()
