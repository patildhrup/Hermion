from typing import Dict, Any, Optional
from fastapi import APIRouter
from pydantic import BaseModel

from app.database.database import db

router = APIRouter(prefix="/leads", tags=["Leads & CRM"])


class CreateLeadRequest(BaseModel):
    name: str
    company: str
    contact_info: Optional[str] = ""
    qualification_score: Optional[int] = 0
    status: Optional[str] = "new"


@router.get("")
@router.get("/")
def list_leads():
    return db.get_leads()


@router.post("")
@router.post("/")
def create_lead(req: CreateLeadRequest):
    lead = db.create_lead(req.dict())
    return lead


@router.patch("/{lead_id}")
def update_lead(lead_id: str, updates: Dict[str, Any]):
    updated = db.update_lead(lead_id, updates)
    return updated or {"status": "ok"}
