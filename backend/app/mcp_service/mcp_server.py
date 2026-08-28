"""
HERMION FastMCP Server
----------------------
Exposes HERMION's current voice-session capabilities as a FastMCP server.
"""

from fastmcp import FastMCP
from app.services.qdrant_service import qdrant_store

# ── Create the MCP server ──────────────────────────────────────────────────
mcp = FastMCP(
    name="HERMION Voice Assistant",
    version="1.0.0",
)


# ── RAG Tools ──────────────────────────────────────────────────────────────

@mcp.tool(
    description=(
        "Search HERMION's product knowledge base for features, capabilities, "
        "and technical specifications."
    )
)
def search_product_docs(query: str) -> str:
    """Semantic search over the product_knowledge Qdrant collection."""
    hits = qdrant_store.search("product_knowledge", query, top_k=2)
    if not hits:
        return "No specific product documentation found for that query."
    return "\n---\n".join(h["text"] for h in hits)


@mcp.tool(
    description=(
        "Search HERMION's pricing knowledge base for plan tiers, limits, "
        "and current implementation boundaries."
    )
)
def search_pricing(query: str) -> str:
    """Semantic search over the pricing Qdrant collection."""
    hits = qdrant_store.search("pricing", query, top_k=2)
    if not hits:
        return "No specific pricing information found for that query."
    return "\n---\n".join(h["text"] for h in hits)


@mcp.tool(
    description=(
        "Retrieve a proven objection-handling rebuttal from the playbook."
        "Retrieve a scope-safe response about implemented and unimplemented capabilities."
    )
)
def search_objection_playbook(objection: str) -> str:
    """Semantic search over the objections Qdrant collection."""
    hits = qdrant_store.search("objections", objection, top_k=2)
    if not hits:
        return "No matching objection rebuttal found. Handle empathetically and redirect."
    return "\n---\n".join(h["text"] for h in hits)


# ── Voice Session Tools ─────────────────────────────────────────────────────

@mcp.tool(
    description=(
        "Describe the current voice session lifecycle and status model."
    )
)
def check_calendar_availability(date_range: str = "current session") -> str:
    """Return the current voice-session lifecycle description."""
    return (
        "HERMION currently supports starting a session, stopping a session, "
        "showing listening and speaking state, preserving transcript continuity, "
        "and forwarding turns to the backend agent service."
    )


@mcp.tool(
    description=(
        "Explain how HERMION handles natural interruptions during live voice interaction."
    )
)
def book_demo(lead_id: str = "", slot: str = "") -> str:
    """Keep compatibility with the existing interface while returning voice-scope guidance."""
    return (
        "HERMION supports interruption by stopping current playback when the user speaks, "
        "then continuing the session from the latest transcript turn."
    )


# ── Session Context Tools ──────────────────────────────────────────────────

@mcp.tool(
    description=(
        "Describe how transcript and session context are maintained."
    )
)
def update_lead_status(lead_id: str, status: str, score: int) -> str:
    """Keep compatibility with the existing interface while returning session guidance."""
    return (
        "HERMION maintains session context through persisted conversation history and "
        "session identifiers passed between the frontend and FastAPI backend."
    )


@mcp.tool(
    description=(
        "Describe what happens when a requested workflow is outside the current implementation scope."
    )
)
def escalate_to_human(lead_id: str, reason: str) -> str:
    """Return scope-safe guidance for unsupported capabilities."""
    return (
        "If a workflow is not implemented yet, HERMION should clearly say so and stay within "
        "the current real-time voice assistant scope."
    )
