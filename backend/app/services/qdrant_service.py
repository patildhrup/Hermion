import math
import re
from typing import Any, Dict, List

from qdrant_client import QdrantClient
from qdrant_client.models import Distance, PointStruct, VectorParams

from app.config.config import settings


class QdrantKnowledgeStore:
    def __init__(self):
        if settings.QDRANT_URL:
            self.client = QdrantClient(url=settings.QDRANT_URL, api_key=settings.QDRANT_API_KEY or None)
        else:
            self.client = QdrantClient(":memory:")

        self.collections = ["product_knowledge", "pricing", "objections", "documents", "memory"]
        self._memory_data: Dict[str, List[Dict[str, Any]]] = {
            "product_knowledge": [],
            "pricing": [],
            "objections": [],
            "documents": [],
            "memory": [],
        }
        self.init_collections()
        self.seed_knowledge_base()

    def _simple_vectorize(self, text: str, dim: int = 128) -> List[float]:
        words = re.findall(r"\w+", text.lower())
        vec = [0.0] * dim
        for index, word in enumerate(words):
            hash_val = hash(word)
            bucket = abs(hash_val) % dim
            value = (hash_val % 100) / 100.0
            vec[bucket] += value + 1.0 / (index + 1)
        norm = math.sqrt(sum(value * value for value in vec)) or 1.0
        return [value / norm for value in vec]

    def ensure_collection(self, collection_name: str):
        try:
            if not self.client.collection_exists(collection_name):
                self.client.create_collection(
                    collection_name=collection_name,
                    vectors_config=VectorParams(size=128, distance=Distance.COSINE),
                )
        except Exception as exc:
            print(f"[Qdrant] Collection init note for {collection_name}: {exc}")

    def init_collections(self):
        for collection_name in self.collections:
            self.ensure_collection(collection_name)

    def upsert_texts(self, collection_name: str, docs: List[Dict[str, Any]]):
        if collection_name not in self.collections:
            self.collections.append(collection_name)
        self._memory_data.setdefault(collection_name, [])
        self.ensure_collection(collection_name)
        self._memory_data[collection_name] = docs

        points = []
        for doc in docs:
            points.append(
                PointStruct(
                    id=doc["id"],
                    vector=self._simple_vectorize(doc["text"]),
                    payload={"text": doc["text"], **doc.get("metadata", {})},
                )
            )

        try:
            self.client.upsert(collection_name=collection_name, points=points)
        except Exception as exc:
            print(f"[Qdrant] Upsert note for {collection_name}: {exc}")

    def delete_point(self, collection_name: str, point_id: int):
        try:
            if hasattr(self.client, "delete"):
                self.client.delete(collection_name=collection_name, points_selector=[point_id])
        except Exception as exc:
            print(f"[Qdrant] Delete note for {collection_name}/{point_id}: {exc}")

        self._memory_data[collection_name] = [
            item for item in self._memory_data.get(collection_name, [])
            if item.get("id") != point_id
        ]

    def seed_knowledge_base(self):
        product_docs = [
            {
                "id": 1,
                "text": "HERMION is a voice-first workplace assistant capable of real-time multi-turn conversation with low-latency response. It supports live transcript streaming, natural interruption handling, session continuity, and backend-connected reasoning.",
                "metadata": {"source": "product_docs.pdf", "section": "Core Capabilities"},
            },
            {
                "id": 2,
                "text": "HERMION connects the frontend voice experience to a FastAPI backend that manages session state, agent orchestration, secure credential handling, and MCP-based tool execution.",
                "metadata": {"source": "product_docs.pdf", "section": "Integrations"},
            },
            {
                "id": 3,
                "text": "HERMION supports interruption handling during live voice sessions. When a user speaks while HERMION is speaking, the voice layer can halt playback, preserve context, and continue the session naturally.",
                "metadata": {"source": "product_docs.pdf", "section": "Voice Architecture"},
            },
            {
                "id": 4,
                "text": "HERMION is evolving toward a modular workplace-agent architecture with MCP tools, memory retrieval, document search, and meeting assistance.",
                "metadata": {"source": "voice_workflow.pdf", "section": "Voice Interaction Workflow"},
            },
        ]

        pricing_docs = [
            {
                "id": 101,
                "text": "The current implementation is focused on real-time voice interaction and modular tool architecture rather than pricing workflows.",
                "metadata": {"topic": "scope"},
            },
            {
                "id": 102,
                "text": "HERMION supports real-time voice sessions, transcript updates, session continuity, backend-routed responses, and staged workplace-agent architecture.",
                "metadata": {"topic": "capabilities"},
            },
        ]

        objection_docs = [
            {
                "id": 201,
                "text": "Question: What can HERMION do right now? Response: It supports real-time voice interaction, session continuity, and a modular tool architecture for workplace workflows.",
                "metadata": {"category": "scope"},
            },
            {
                "id": 202,
                "text": "Question: How does HERMION handle requests safely? Response: The assistant selects tools, passes structured requests through validation and authorization, and only then performs actions.",
                "metadata": {"category": "architecture"},
            },
        ]

        for collection_name, docs in {
            "product_knowledge": product_docs,
            "pricing": pricing_docs,
            "objections": objection_docs,
        }.items():
            self.upsert_texts(collection_name, docs)

    def search(self, collection_name: str, query: str, top_k: int = 3) -> List[Dict[str, Any]]:
        if collection_name not in self.collections:
            return []

        query_vec = self._simple_vectorize(query)
        try:
            results = None
            if hasattr(self.client, "search"):
                results = self.client.search(
                    collection_name=collection_name,
                    query_vector=query_vec,
                    limit=top_k,
                )
            elif hasattr(self.client, "query_points"):
                response = self.client.query_points(
                    collection_name=collection_name,
                    query=query_vec,
                    limit=top_k,
                )
                results = response.points

            if results:
                hits = []
                for result in results:
                    payload = result.payload or {}
                    hits.append(
                        {
                            "score": round(result.score, 4),
                            "text": payload.get("text", ""),
                            "metadata": {key: value for key, value in payload.items() if key != "text"},
                        }
                    )
                if hits:
                    return hits
        except Exception:
            pass

        keywords = set(re.findall(r"\w+", query.lower()))
        scored_docs = []
        for doc in self._memory_data.get(collection_name, []):
            words = set(re.findall(r"\w+", doc["text"].lower()))
            overlap = len(keywords.intersection(words))
            score = overlap / (len(keywords) or 1)
            scored_docs.append((score, doc["text"], doc.get("metadata", {})))

        scored_docs.sort(key=lambda item: item[0], reverse=True)
        return [
            {"score": round(score, 4), "text": text, "metadata": metadata}
            for score, text, metadata in scored_docs[:top_k]
        ]


qdrant_store = QdrantKnowledgeStore()
