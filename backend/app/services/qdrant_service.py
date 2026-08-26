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
                "text": "HERMION is an enterprise-grade voice-native AI sales rep capable of real-time multi-turn conversation with sub-300ms latency. It features instant barge-in interruption, automated CRM syncing, and zero-latency Qdrant knowledge retrieval.",
                "metadata": {"source": "product_docs.pdf", "section": "Core Capabilities"}
            },
            {
                "id": 2,
                "text": "HERMION integrates directly with Supabase, Hubspot, and Salesforce for real-time lead updates, transcript streaming, qualification scoring, and automated demo scheduling.",
                "metadata": {"source": "product_docs.pdf", "section": "Integrations"}
            },
            {
                "id": 3,
                "text": "HERMION features sub-300ms interruption handling (barge-in). When a prospect speaks while HERMION is speaking, VAD detects incoming speech, halts audio playback immediately, processes the new context, and responds seamlessly.",
                "metadata": {"source": "product_docs.pdf", "section": "Voice Architecture"}
            },
            {
                "id": 4,
                "text": "HERMION's AI sales motion follows a structured flow: Warm Greeting -> Prospect Qualification (company size, use case, timeline) -> Value Presentation -> Objection Handling -> Demo Booking -> CRM Sync.",
                "metadata": {"source": "sales_playbook.pdf", "section": "Sales Methodology"}
            },
            {
                "id": 5,
                "text": "HERMION supports custom voice cloning via ElevenLabs BYOK, multi-language detection, rate-limit automated model fallback, and enterprise SLA uptime.",
                "metadata": {"source": "product_docs.pdf", "section": "Enterprise Features"}
            }
        ]

        # 2. Pricing
        pricing_docs = [
            {
                "id": 101,
                "text": "HERMION Starter Plan costs $99 per month. Includes 500 voice call minutes per month, 1 concurrent call agent, basic CRM logging, and standard support. Extra minutes billed at $0.15/min.",
                "metadata": {"plan": "Starter", "price": "$99/mo", "limits": "500 mins"}
            },
            {
                "id": 102,
                "text": "HERMION Pro Plan costs $299 per month. Includes 2,500 voice call minutes per month, 5 concurrent call agents, real-time Qdrant RAG, custom objection playbooks, live calendar booking, and priority support.",
                "metadata": {"plan": "Pro", "price": "$299/mo", "limits": "2,500 mins"}
            },
            {
                "id": 103,
                "text": "HERMION Enterprise Plan costs $899 per month (billed annually). Includes unlimited voice minutes, custom ElevenLabs voice clone, dedicated account manager, custom CRM integrations, SSO, and 99.9% uptime SLA.",
                "metadata": {"plan": "Enterprise", "price": "$899/mo", "limits": "Unlimited"}
            },
            {
                "id": 104,
                "text": "All plans include a 14-day free trial with 100 free call minutes and full access to Qdrant playbook indexing and live demo booking.",
                "metadata": {"plan": "Trial", "price": "Free", "limits": "100 mins"}
            },
            {
                "id": 105,
                "text": "Annual billing discount: Paying annually grants a 20% discount on Pro and Enterprise tiers (equivalent to $239/mo for Pro and $719/mo for Enterprise).",
                "metadata": {"plan": "Discounts", "price": "20% off", "limits": "Annual"}
            }
        ]

        # 3. Objections & Rebuttals
        objection_docs = [
            {
                "id": 201,
                "text": "Objection: 'This seems expensive.' Rebuttal: 'I completely understand budget is top of mind. However, hiring a single full-time SDR costs over $65,000 per year plus onboarding. HERMION gives you 24/7 instant response coverage starting at just $99 a month, boosting qualified conversion by over 3x. Our customers usually see positive ROI in their first 14 days.'",
                "metadata": {"category": "price", "objection_text": "expensive"}
            },
            {
                "id": 202,
                "text": "Objection: 'Will prospects know it is an AI?' Rebuttal: 'HERMION utilizes state-of-the-art Voice Activity Detection and sub-300ms low-latency turn taking powered by Agora and ElevenLabs. It responds naturally, allows full mid-sentence interruptions, and handles complex Q&A grounded in your real docs so prospects feel like they are talking to a top 1% human sales rep.'",
                "metadata": {"category": "authenticity", "objection_text": "is it AI"}
            },
            {
                "id": 203,
                "text": "Objection: 'We already have sales reps / SDR team.' Rebuttal: 'HERMION isn't meant to replace your top closers—it empowers them! HERMION acts as your front-line SDR, instantly answering inbound leads 24/7 within seconds, qualifying them, and booking confirmed demos directly onto your senior reps' calendars.'",
                "metadata": {"category": "team_fit", "objection_text": "already have reps"}
            },
            {
                "id": 204,
                "text": "Objection: 'Is setup difficult or time consuming?' Rebuttal: 'Not at all! Setup takes less than 15 minutes. You simply upload your product FAQs or pricing PDFs, connect your calendar or CRM, and HERMION is ready to handle live calls immediately.'",
                "metadata": {"category": "setup", "objection_text": "hard to set up"}
            },
            {
                "id": 205,
                "text": "Objection: 'What if a prospect asks a legal or contract question HERMION doesn't know?' Rebuttal: 'If a prospect asks a question outside HERMION's verified knowledge base, HERMION smoothly escalates the call to a human account executive or schedules an immediate follow-up call with your specialist.'",
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
