from fastapi import APIRouter

from app.api.routes.health import router as health_router
from app.api.routes.auth import router as auth_router
from app.api.routes.conversations import router as conversations_router
from app.api.routes.llm import router as llm_router
from app.api.routes.leads import router as leads_router
from app.api.routes.calls import router as calls_router
from app.api.routes.agora import router as agora_router
from app.api.routes.qdrant import router as qdrant_router

api_router = APIRouter()

api_router.include_router(health_router)
api_router.include_router(auth_router)
api_router.include_router(conversations_router)
api_router.include_router(llm_router)
api_router.include_router(leads_router)
api_router.include_router(calls_router)
api_router.include_router(agora_router)
api_router.include_router(qdrant_router)
