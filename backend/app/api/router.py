from fastapi import APIRouter

from backend.app.api.routes.activities import router as activities_router
from backend.app.api.routes.agents import router as agents_router
from backend.app.api.routes.approvals import router as approvals_router
from backend.app.api.routes.auth import router as auth_router
from backend.app.api.routes.chat import router as chat_router
from backend.app.api.routes.linkedin import router as linkedin_router
from backend.app.api.routes.memory import router as memory_router
from backend.app.api.routes.voice import router as voice_router


api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(activities_router)
api_router.include_router(agents_router)
api_router.include_router(approvals_router)
api_router.include_router(memory_router)
api_router.include_router(chat_router)
api_router.include_router(linkedin_router)
api_router.include_router(voice_router)
