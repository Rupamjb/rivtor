from fastapi import APIRouter, Depends, Request

from backend.app.core.config import get_settings
from backend.app.services.activities_repo import ActivitiesRepository


router = APIRouter(prefix="/activities", tags=["activities"])


def get_activities_repo() -> ActivitiesRepository:
    settings = get_settings()
    return ActivitiesRepository(
        supabase_url=settings.supabase_url,
        service_role_key=settings.supabase_service_role_key,
    )


def _resolve_user_id(request: Request) -> str:
    user = getattr(request.state, "user", None)
    if isinstance(user, dict):
        return str(user.get("id") or user.get("sub") or "")
    return ""


@router.get("/feed")
async def activity_feed(
    request: Request,
    limit: int = 20,
    activities_repo: ActivitiesRepository = Depends(get_activities_repo),
) -> dict[str, list[dict]]:
    user_id = _resolve_user_id(request)
    if not user_id:
        return {"items": []}

    try:
        items = await activities_repo.list_activities(user_id=user_id, limit=limit)
        return {"items": items}
    except RuntimeError:
        return {"items": []}
