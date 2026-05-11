from datetime import datetime, timezone
from typing import Optional
from urllib.parse import quote

import httpx


class LinkedInConnectionsRepository:
    _fallback_connections: dict[str, dict] = {}

    def __init__(self, *, supabase_url: str, service_role_key: str) -> None:
        self._supabase_url = supabase_url.rstrip("/")
        self._service_role_key = service_role_key
        self._use_fallback = False

    @staticmethod
    def _table_missing_response(response: httpx.Response) -> bool:
        if response.status_code != 404:
            return False
        try:
            payload = response.json()
        except ValueError:
            return False
        if not isinstance(payload, dict):
            return False
        code = str(payload.get("code") or "")
        message = str(payload.get("message") or "").lower()
        return code == "PGRST205" and "linkedin_connections" in message

    def _headers(self) -> dict:
        if not self._supabase_url or not self._service_role_key:
            raise RuntimeError("Supabase LinkedIn connection storage is not configured")
        if not self._supabase_url.startswith("http"):
            raise RuntimeError("Supabase URL must be an HTTP URL for LinkedIn connections")
        return {
            "apikey": self._service_role_key,
            "Authorization": f"Bearer {self._service_role_key}",
            "Content-Type": "application/json",
        }

    @staticmethod
    def _iso_now() -> str:
        return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")

    async def get_connection(self, *, user_id: str) -> Optional[dict]:
        if self._use_fallback:
            return self._fallback_connections.get(user_id)

        encoded_user_id = quote(user_id, safe="")
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(
                    f"{self._supabase_url}/rest/v1/linkedin_connections?user_id=eq.{encoded_user_id}&select=id,user_id,connection_status,oauth_state,oauth_state_expires_at,access_token,access_token_expires_at,linkedin_member_urn,connected_at,created_at,updated_at&limit=1",
                    headers=self._headers(),
                )
        except httpx.HTTPError as exc:
            raise RuntimeError("Failed to fetch LinkedIn connection") from exc

        if self._table_missing_response(response):
            self._use_fallback = True
            return self._fallback_connections.get(user_id)

        if response.status_code >= 400:
            raise RuntimeError("Failed to fetch LinkedIn connection")

        rows = response.json()
        if not isinstance(rows, list) or not rows:
            return None
        row = rows[0]
        return row if isinstance(row, dict) else None

    async def upsert_pending_connection(self, *, user_id: str, oauth_state: str, expires_at: str) -> dict:
        payload = {
            "user_id": user_id,
            "connection_status": "pending",
            "oauth_state": oauth_state,
            "oauth_state_expires_at": expires_at,
            "updated_at": self._iso_now(),
        }

        if self._use_fallback:
            self._fallback_connections[user_id] = dict(payload)
            return dict(payload)

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(
                    f"{self._supabase_url}/rest/v1/linkedin_connections?on_conflict=user_id",
                    headers={
                        **self._headers(),
                        "Prefer": "resolution=merge-duplicates,return=representation",
                    },
                    json=payload,
                )
        except httpx.HTTPError as exc:
            raise RuntimeError("Failed to persist LinkedIn connection") from exc

        if self._table_missing_response(response):
            self._use_fallback = True
            self._fallback_connections[user_id] = dict(payload)
            return dict(payload)

        if response.status_code >= 400:
            raise RuntimeError("Failed to persist LinkedIn connection")

        rows = response.json()
        if isinstance(rows, list) and rows and isinstance(rows[0], dict):
            return rows[0]
        return {"id": "", **payload}

    async def mark_connected(
        self,
        *,
        user_id: str,
        access_token: str,
        access_token_expires_at: str,
        linkedin_member_urn: str,
    ) -> dict:
        encoded_user_id = quote(user_id, safe="")
        payload = {
            "connection_status": "connected",
            "oauth_state": None,
            "oauth_state_expires_at": None,
            "access_token": access_token,
            "access_token_expires_at": access_token_expires_at,
            "linkedin_member_urn": linkedin_member_urn,
            "connected_at": self._iso_now(),
            "updated_at": self._iso_now(),
        }

        if self._use_fallback:
            base = self._fallback_connections.get(user_id, {"user_id": user_id})
            merged = {**base, **payload}
            self._fallback_connections[user_id] = merged
            return merged

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.patch(
                    f"{self._supabase_url}/rest/v1/linkedin_connections?user_id=eq.{encoded_user_id}",
                    headers={
                        **self._headers(),
                        "Prefer": "return=representation",
                    },
                    json=payload,
                )
        except httpx.HTTPError as exc:
            raise RuntimeError("Failed to update LinkedIn connection") from exc

        if self._table_missing_response(response):
            self._use_fallback = True
            base = self._fallback_connections.get(user_id, {"user_id": user_id})
            merged = {**base, **payload}
            self._fallback_connections[user_id] = merged
            return merged

        if response.status_code >= 400:
            raise RuntimeError("Failed to update LinkedIn connection")

        rows = response.json()
        if isinstance(rows, list) and rows and isinstance(rows[0], dict):
            return rows[0]
        raise RuntimeError("Failed to update LinkedIn connection")
