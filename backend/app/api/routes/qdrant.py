from typing import Optional
from fastapi import APIRouter
from pydantic import BaseModel

from app.services.qdrant_service import qdrant_store

router = APIRouter(prefix="/qdrant", tags=["Vector Search & RAG"])


class QdrantSearchRequest(BaseModel):
    collection: str
    query: str
    top_k: Optional[int] = 3


@router.post("/search")
def search_qdrant_api(req: QdrantSearchRequest):
    results = qdrant_store.search(req.collection, req.query, req.top_k or 3)
    return {
        "collection": req.collection,
        "query": req.query,
        "results": results
    }
