from typing import Optional

import httpx


class LinkedInPublicationsRepository:
    _fallback_rows: list[dict] = []

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
        return code == "PGRST205" and "linkedin_publications" in message

    def _headers(self) -> dict:
        if not self._supabase_url or not self._service_role_key:
            raise RuntimeError("Supabase LinkedIn publication storage is not configured")
        if not self._supabase_url.startswith("http"):
            raise RuntimeError("Supabase URL must be an HTTP URL for LinkedIn publications")
        return {
            "apikey": self._service_role_key,
            "Authorization": f"Bearer {self._service_role_key}",
            "Content-Type": "application/json",
        }

    async def create_publication_attempt(
        self,
        *,
        user_id: str,
        generation_id: str,
        status: str,
        linkedin_post_urn: Optional[str] = None,
        linkedin_post_url: Optional[str] = None,
        error_message: Optional[str] = None,
    ) -> dict:
        payload = {
            "user_id": user_id,
            "generation_id": generation_id,
            "channel": "linkedin",
            "status": status,
            "linkedin_post_urn": linkedin_post_urn,
            "linkedin_post_url": linkedin_post_url,
            "error_message": error_message,
        }

        if self._use_fallback:
            row = {"id": f"fallback-{len(self._fallback_rows) + 1}", **payload}
            self._fallback_rows.append(row)
            return row

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(
                    f"{self._supabase_url}/rest/v1/linkedin_publications",
                    headers={
                        **self._headers(),
                        "Prefer": "return=representation",
                    },
                    json=payload,
                )
        except httpx.HTTPError as exc:
            raise RuntimeError("Failed to persist LinkedIn publication") from exc

        if self._table_missing_response(response):
            self._use_fallback = True
            row = {"id": f"fallback-{len(self._fallback_rows) + 1}", **payload}
            self._fallback_rows.append(row)
            return row

        if response.status_code >= 400:
            raise RuntimeError("Failed to persist LinkedIn publication")

        rows = response.json()
        if isinstance(rows, list) and rows and isinstance(rows[0], dict):
            return rows[0]
        return {"id": "", **payload}
