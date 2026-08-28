import io
import uuid
from typing import Any, Dict, List

from app.services.qdrant_service import qdrant_store


class DocumentService:
    def __init__(self):
        self._documents: Dict[str, Dict[str, Any]] = {}
        self._next_chunk_id = 5000

    def _extract_text(self, filename: str, content: bytes) -> str:
        lower = filename.lower()
        if lower.endswith(".txt") or lower.endswith(".md"):
            return content.decode("utf-8", errors="ignore")
        if lower.endswith(".pdf"):
            from pypdf import PdfReader
            reader = PdfReader(io.BytesIO(content))
            return "\n".join(page.extract_text() or "" for page in reader.pages)
        if lower.endswith(".docx"):
            from docx import Document
            document = Document(io.BytesIO(content))
            return "\n".join(paragraph.text for paragraph in document.paragraphs)
        raise ValueError("Unsupported document type")

    def _chunk_text(self, text: str, chunk_size: int = 350) -> List[str]:
        cleaned = " ".join(text.split())
        if not cleaned:
            return []
        return [cleaned[index:index + chunk_size] for index in range(0, len(cleaned), chunk_size)]

    def upload_document(self, user_id: str, filename: str, content_type: str, content: bytes) -> Dict[str, Any]:
        text = self._extract_text(filename, content)
        document_id = f"doc-{uuid.uuid4().hex[:8]}"
        chunks = self._chunk_text(text)
        record = {
            "id": document_id,
            "user_id": user_id,
            "filename": filename,
            "content_type": content_type,
            "text": text,
            "chunk_count": len(chunks),
        }
        self._documents[document_id] = record

        existing = qdrant_store._memory_data.get("documents", [])
        docs = list(existing)
        for index, chunk in enumerate(chunks):
            docs.append({
                "id": self._next_chunk_id,
                "text": chunk,
                "metadata": {
                    "document_id": document_id,
                    "filename": filename,
                    "user_id": user_id,
                    "chunk_index": index,
                },
            })
            self._next_chunk_id += 1
        qdrant_store.upsert_texts("documents", docs)
        return record

    def search_documents(self, user_id: str, query: str, top_k: int = 4) -> List[Dict[str, Any]]:
        hits = qdrant_store.search("documents", query, top_k=top_k)
        return [hit for hit in hits if hit["metadata"].get("user_id") in ("", user_id, None)]

    def answer_question(self, user_id: str, query: str) -> Dict[str, Any]:
        hits = self.search_documents(user_id, query, top_k=3)
        answer = " ".join(hit["text"] for hit in hits[:2]) if hits else "No relevant document context found."
        return {"query": query, "answer": answer, "results": hits}

    def list_documents(self, user_id: str) -> List[Dict[str, Any]]:
        return [record for record in self._documents.values() if record["user_id"] == user_id]


document_service = DocumentService()
