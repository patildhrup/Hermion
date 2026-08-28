import re
import math
from typing import List, Dict, Any
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct
from app.config.config import settings

class QdrantKnowledgeStore:
    def __init__(self):
        # Initialize client
        if settings.QDRANT_URL:
            self.client = QdrantClient(url=settings.QDRANT_URL, api_key=settings.QDRANT_API_KEY or None)
        else:
            self.client = QdrantClient(":memory:")
            
        self.collections = ["product_knowledge", "pricing", "objections"]
        self._memory_data: Dict[str, List[Dict[str, Any]]] = {
            "product_knowledge": [],
            "pricing": [],
            "objections": []
        }
        self.init_collections()
        self.seed_knowledge_base()

    def _simple_vectorize(self, text: str, dim: int = 128) -> List[float]:
        """Deterministic pseudo-embedding for local in-memory search without requiring heavy Torch download."""
        words = re.findall(r'\w+', text.lower())
        vec = [0.0] * dim
        for i, word in enumerate(words):
            hash_val = hash(word)
            idx = abs(hash_val) % dim
            val = (hash_val % 100) / 100.0
            vec[idx] += val + 1.0 / (i + 1)
        norm = math.sqrt(sum(x * x for x in vec)) or 1.0
        return [x / norm for x in vec]

    def init_collections(self):
        for col in self.collections:
            try:
                if not self.client.collection_exists(col):
                    self.client.create_collection(
                        collection_name=col,
                        vectors_config=VectorParams(size=128, distance=Distance.COSINE),
                    )
            except Exception as e:
                print(f"[Qdrant] Collection init note for {col}: {e}")

    def seed_knowledge_base(self):
        # 1. Product Knowledge
        product_docs = [
            {
                "id": 1,
                "text": "HERMION is a voice-first workplace assistant capable of real-time multi-turn conversation with low-latency response. It supports live transcript streaming, natural interruption handling, session continuity, and backend-connected reasoning.",
                "metadata": {"source": "product_docs.pdf", "section": "Core Capabilities"}
            },
            {
                "id": 2,
                "text": "HERMION connects the frontend voice experience to a FastAPI backend that manages session state, agent orchestration, and secure credential handling through environment variables.",
                "metadata": {"source": "product_docs.pdf", "section": "Integrations"}
            },
            {
                "id": 3,
                "text": "HERMION supports interruption handling during live voice sessions. When a user speaks while HERMION is speaking, the voice layer can halt playback, preserve context, and continue the session naturally.",
                "metadata": {"source": "product_docs.pdf", "section": "Voice Architecture"}
            },
            {
                "id": 4,
                "text": "HERMION's current implementation focus is reliable real-time voice interaction: start session, stop session, show microphone and speaking state, display transcript, preserve session continuity, and return simple assistant responses.",
                "metadata": {"source": "voice_workflow.pdf", "section": "Voice Interaction Workflow"}
            },
            {
                "id": 5,
                "text": "HERMION is designed to evolve through a modular backend service layer so speech, language reasoning, and future workplace tools can remain isolated and maintainable.",
                "metadata": {"source": "product_docs.pdf", "section": "Enterprise Features"}
            }
        ]

        # 2. Pricing
        pricing_docs = [
            {
                "id": 101,
                "text": "The current implementation is focused on real-time voice interaction rather than product pricing. Pricing workflows are not implemented in the assistant yet.",
                "metadata": {"plan": "Starter", "price": "$99/mo", "limits": "500 mins"}
            },
            {
                "id": 102,
                "text": "HERMION currently supports real-time voice sessions, transcript updates, session continuity, and backend-routed assistant responses. Broader workplace tooling is planned but not active yet.",
                "metadata": {"plan": "Pro", "price": "$299/mo", "limits": "2,500 mins"}
            },
            {
                "id": 103,
                "text": "Credentials for Agora and language model providers should remain server-side and be supplied through environment variables in production deployments.",
                "metadata": {"plan": "Enterprise", "price": "$899/mo", "limits": "Unlimited"}
            },
            {
                "id": 104,
                "text": "The current stage uses simple assistant replies and a modular FastAPI backend so future workplace integrations can be added without rewriting the voice layer.",
                "metadata": {"plan": "Trial", "price": "Free", "limits": "100 mins"}
            },
            {
                "id": 105,
                "text": "The voice stack is designed around start and stop session controls, visible listening state, live transcript display, and interruption handling.",
                "metadata": {"plan": "Discounts", "price": "20% off", "limits": "Annual"}
            }
        ]

        # 3. Objections & Rebuttals
        objection_docs = [
            {
                "id": 201,
                "text": "Question: 'What can HERMION do right now?' Response: 'The assistant currently focuses on reliable real-time voice interaction, transcript continuity, and backend-connected test responses.'",
                "metadata": {"category": "price", "objection_text": "expensive"}
            },
            {
                "id": 202,
                "text": "Question: 'Will people know it is an AI?' Response: 'HERMION uses Voice Activity Detection and low-latency turn taking to respond naturally, support interruptions, and stay grounded in the available session context.'",
                "metadata": {"category": "authenticity", "objection_text": "is it AI"}
            },
            {
                "id": 203,
                "text": "Question: 'We already have established workflows.' Response: 'HERMION is designed to support existing teams with a voice-first interface for real-time interaction, not to replace their workflow or decision-making.'",
                "metadata": {"category": "team_fit", "objection_text": "already have reps"}
            },
            {
                "id": 204,
                "text": "Question: 'Is setup difficult or time consuming?' Response: 'The implemented flow is intentionally narrow: configure environment variables, run the FastAPI backend, and connect the frontend voice UI.'",
                "metadata": {"category": "setup", "objection_text": "hard to set up"}
            },
            {
                "id": 205,
                "text": "Question: 'What happens when HERMION cannot handle a request?' Response: 'HERMION should respond clearly that the requested workflow is not implemented yet and stay within the current voice-assistant scope.'",
                "metadata": {"category": "escalation", "objection_text": "unknown questions"}
            }
        ]

        seeds = {
            "product_knowledge": product_docs,
            "pricing": pricing_docs,
            "objections": objection_docs
        }

        for col_name, docs in seeds.items():
            self._memory_data[col_name] = docs
            points = []
            for doc in docs:
                vec = self._simple_vectorize(doc["text"])
                points.append(PointStruct(
                    id=doc["id"],
                    vector=vec,
                    payload={"text": doc["text"], **doc["metadata"]}
                ))
            try:
                self.client.upsert(collection_name=col_name, points=points)
            except Exception as e:
                print(f"[Qdrant] Upsert note for {col_name}: {e}")

    def search(self, collection_name: str, query: str, top_k: int = 3) -> List[Dict[str, Any]]:
        """Search collection by semantic vector similarity or keyword match fallback."""
        if collection_name not in self.collections:
            return []

        query_vec = self._simple_vectorize(query)
        try:
            results = None
            if hasattr(self.client, 'search'):
                results = self.client.search(
                    collection_name=collection_name,
                    query_vector=query_vec,
                    limit=top_k
                )
            elif hasattr(self.client, 'query_points'):
                response = self.client.query_points(
                    collection_name=collection_name,
                    query=query_vec,
                    limit=top_k
                )
                results = response.points

            if results:
                hits = []
                for res in results:
                    payload = res.payload or {}
                    hits.append({
                        "score": round(res.score, 4),
                        "text": payload.get("text", ""),
                        "metadata": {k: v for k, v in payload.items() if k != "text"}
                    })
                if hits:
                    return hits
        except Exception as e:
            pass

        # Fallback keyword ranking in memory
        keywords = set(re.findall(r'\w+', query.lower()))
        scored_docs = []
        for doc in self._memory_data.get(collection_name, []):
            text = doc["text"]
            words = set(re.findall(r'\w+', text.lower()))
            overlap = len(keywords.intersection(words))
            score = overlap / (len(keywords) or 1)
            scored_docs.append((score, text, doc["metadata"]))

        scored_docs.sort(key=lambda x: x[0], reverse=True)
        return [
            {"score": round(s, 4), "text": txt, "metadata": meta}
            for s, txt, meta in scored_docs[:top_k]
        ]

# Global singleton
qdrant_store = QdrantKnowledgeStore()
