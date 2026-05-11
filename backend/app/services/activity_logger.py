from typing import Optional

from backend.app.core.config import get_settings
from backend.app.services.activities_repo import ActivitiesRepository


class ActivityLogger:
    def __init__(self, *, activities_repo: Optional[ActivitiesRepository] = None) -> None:
        settings = get_settings()
        self._activities_repo = activities_repo or ActivitiesRepository(
            supabase_url=settings.supabase_url,
            service_role_key=settings.supabase_service_role_key,
        )

    async def log(self, *, user_id: str, event_type: str, metadata: dict) -> Optional[dict]:
        try:
            return await self._activities_repo.create_activity(
                user_id=user_id,
                event_type=event_type,
                metadata=metadata,
            )
        except RuntimeError:
            return None
