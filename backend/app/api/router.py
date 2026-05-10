from fastapi import APIRouter

from backend.app.api.routes.activities import router as activities_router
from backend.app.api.routes.auth import router as auth_router


api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(activities_router)
