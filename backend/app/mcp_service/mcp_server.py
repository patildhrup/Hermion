"""
HERMION FastMCP Server
----------------------
Exposes all HERMION sales-agent tools as a FastMCP server.
"""

from fastmcp import FastMCP
from services.qdrant_service import qdrant_store
from database.database import db

# ── Create the MCP server ──────────────────────────────────────────────────
mcp = FastMCP(
    name="HERMION Sales Agent",
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
        "discounts, and trial info. ALWAYS call this before quoting any price."
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
    )
)
def search_objection_playbook(objection: str) -> str:
    """Semantic search over the objections Qdrant collection."""
    hits = qdrant_store.search("objections", objection, top_k=2)
    if not hits:
        return "No matching objection rebuttal found. Handle empathetically and redirect."
    return "\n---\n".join(h["text"] for h in hits)


# ── Calendar & Booking Tools ───────────────────────────────────────────────

@mcp.tool(
    description=(
        "Check available demo calendar slots."
    )
)
def check_calendar_availability(date_range: str = "this week") -> str:
    """Return open demo slots for the requested date range."""
    slots = {
        "this week":  "Thursday 2:00 PM EST, Friday 11:00 AM EST, Friday 3:30 PM EST",
        "next week":  "Monday 10:00 AM EST, Tuesday 2:00 PM EST, Wednesday 4:00 PM EST",
        "tomorrow":   "Tomorrow 11:00 AM EST, Tomorrow 3:00 PM EST",
    }
    normalized = date_range.lower().strip()
    available = slots.get(normalized, slots["this week"])
    return f"Available slots for {date_range}: {available}"


@mcp.tool(
    description=(
        "Book a confirmed demo for the prospect."
    )
)
def book_demo(lead_id: str, slot: str) -> str:
    """Confirm a demo booking and update the lead status to demo_booked."""
    if lead_id:
        db.update_lead(lead_id, {
            "status": "demo_booked",
            "qualification_score": 90,
        })
    return (
        f"Demo confirmed for {slot}. "
        "A calendar invite has been sent to the prospect."
    )


# ── CRM Tools ─────────────────────────────────────────────────────────────

@mcp.tool(
    description=(
        "Update the prospect's lead record with qualification status and score."
    )
)
def update_lead_status(lead_id: str, status: str, score: int) -> str:
    """Update lead status and qualification score."""
    if lead_id:
        db.update_lead(lead_id, {"status": status, "qualification_score": score})
    return f"Lead {lead_id} updated → status={status}, score={score}."


@mcp.tool(
    description=(
        "Escalate the call to a human representative."
    )
)
def escalate_to_human(lead_id: str, reason: str) -> str:
    """Flag the lead for human follow-up."""
    if lead_id:
        db.update_lead(lead_id, {"status": "escalated"})
    return f"Call escalated to human specialist. Reason: {reason}"
