from typing import Any, Dict, Optional

from fastapi import APIRouter
from pydantic import BaseModel

from app.services.memory_service import memory_service

router = APIRouter(prefix="/memory", tags=["Memory"])


class StoreMemoryRequest(BaseModel):
    user_id: str
    text: str
    metadata: Optional[Dict[str, Any]] = None


class UpdateMemoryRequest(BaseModel):
    text: str


@router.get("/session")
def get_session_memory(session_id: str):
    return memory_service.retrieve_memory(session_id)


@router.post("")
@router.post("/")
def store_memory(req: StoreMemoryRequest):
    return memory_service.store_memory(req.user_id, req.text, req.metadata or {})


@router.get("/search")
def search_memory(user_id: str, query: str, top_k: Optional[int] = 3):
    return {
        "query": query,
        "results": memory_service.search_memory(user_id, query, top_k or 3),
    }


@router.patch("/{memory_key}")
def update_memory(memory_key: str, req: UpdateMemoryRequest):
    return memory_service.update_memory(memory_key, req.text)


@router.delete("/{memory_key}")
def delete_memory(memory_key: str):
    return {"deleted": memory_service.delete_memory(memory_key)}
