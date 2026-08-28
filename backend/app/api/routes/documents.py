from typing import Optional

from fastapi import APIRouter, File, Form, UploadFile

from app.services.document_service import document_service

router = APIRouter(prefix="/documents", tags=["Document Intelligence"])


@router.get("")
@router.get("/")
def list_documents(user_id: str):
    return document_service.list_documents(user_id)


@router.post("/upload")
async def upload_document(
    user_id: str = Form(...),
    file: UploadFile = File(...),
):
    content = await file.read()
    return document_service.upload_document(
        user_id=user_id,
        filename=file.filename or "document.txt",
        content_type=file.content_type or "application/octet-stream",
        content=content,
    )


@router.get("/search")
def search_documents(user_id: str, query: str, top_k: Optional[int] = 4):
    return {
        "query": query,
        "results": document_service.search_documents(user_id, query, top_k or 4),
    }


@router.get("/answer")
def answer_document_question(user_id: str, query: str):
    return document_service.answer_question(user_id, query)
