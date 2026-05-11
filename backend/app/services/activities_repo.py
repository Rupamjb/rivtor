import json
from urllib.parse import quote

import httpx


class ActivitiesRepository:
    def __init__(self, *, supabase_url: str, service_role_key: str) -> None:
        self._supabase_url = supabase_url.rstrip("/")
        self._service_role_key = service_role_key

    def _headers(self) -> dict[str, str]:
        if not self._supabase_url or not self._service_role_key:
            raise RuntimeError("Supabase activities storage is not configured")
        if not self._supabase_url.startswith("http"):
            raise RuntimeError("Supabase URL must be an HTTP URL for activities storage")

        return {
            "apikey": self._service_role_key,
            "Authorization": f"Bearer {self._service_role_key}",
            "Content-Type": "application/json",
        }

    async def create_activity(self, *, user_id: str, event_type: str, metadata: dict) -> dict:
        payload = {
            "user_id": user_id,
            "event_type": event_type,
            "metadata": metadata,
        }

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(
                    f"{self._supabase_url}/rest/v1/activities",
                    headers={
                        **self._headers(),
                        "Prefer": "return=representation",
                    },
                    json=payload,
                )
        except httpx.HTTPError as exc:
            raise RuntimeError("Failed to persist activity") from exc

        if response.status_code >= 400:
            raise RuntimeError("Failed to persist activity")

        rows = response.json()
        if isinstance(rows, list) and rows:
            row = rows[0]
            if isinstance(row, dict):
                return row
        if isinstance(rows, dict):
            return rows
        return {
            "id": "",
            **payload,
        }

    async def list_activities(self, *, user_id: str, limit: int = 20) -> list[dict]:
        encoded_user_id = quote(user_id, safe="")
        capped_limit = max(1, min(limit, 100))
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(
                    f"{self._supabase_url}/rest/v1/activities?user_id=eq.{encoded_user_id}&select=id,event_type,metadata,created_at&order=created_at.desc&limit={capped_limit}",
                    headers=self._headers(),
                )
        except httpx.HTTPError as exc:
            raise RuntimeError("Failed to list activities") from exc

        if response.status_code >= 400:
            raise RuntimeError("Failed to list activities")

        rows = response.json()
        normalized: list[dict] = []
        if not isinstance(rows, list):
            return normalized

        for row in rows:
            if not isinstance(row, dict):
                continue
            metadata = row.get("metadata", {})
            if isinstance(metadata, str):
                try:
                    metadata = json.loads(metadata)
                except json.JSONDecodeError:
                    metadata = {}
            if not isinstance(metadata, dict):
                metadata = {}

            normalized.append(
                {
                    **row,
                    "metadata": metadata,
                }
            )

        return normalized
