import httpx


class ApprovalsRepository:
    def __init__(self, *, supabase_url: str, service_role_key: str) -> None:
        self._supabase_url = supabase_url.rstrip("/")
        self._service_role_key = service_role_key

    def _headers(self) -> dict[str, str]:
        if not self._supabase_url or not self._service_role_key:
            raise RuntimeError("Supabase approvals storage is not configured")
        if not self._supabase_url.startswith("http"):
            raise RuntimeError("Supabase URL must be an HTTP URL for approvals storage")

        return {
            "apikey": self._service_role_key,
            "Authorization": f"Bearer {self._service_role_key}",
            "Content-Type": "application/json",
        }

    async def create_approval(
        self,
        *,
        user_id: str,
        generation_id: str,
        status: str,
        note: str,
        reason: str,
    ) -> dict:
        payload = {
            "user_id": user_id,
            "generation_id": generation_id,
            "status": status,
            "note": note,
            "reason": reason,
        }

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(
                    f"{self._supabase_url}/rest/v1/approvals",
                    headers={
                        **self._headers(),
                        "Prefer": "return=representation",
                    },
                    json=payload,
                )
        except httpx.HTTPError as exc:
            raise RuntimeError("Failed to persist approval event") from exc

        if response.status_code >= 400:
            raise RuntimeError("Failed to persist approval event")

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
