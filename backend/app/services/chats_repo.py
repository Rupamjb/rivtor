import json
from urllib.parse import quote

import httpx


class ChatsRepository:
    def __init__(self, *, supabase_url: str, service_role_key: str) -> None:
        self._supabase_url = supabase_url.rstrip("/")
        self._service_role_key = service_role_key

    def _headers(self) -> dict[str, str]:
        if not self._supabase_url or not self._service_role_key:
            raise RuntimeError("Supabase chat storage is not configured")
        if not self._supabase_url.startswith("http"):
            raise RuntimeError("Supabase URL must be an HTTP URL for chat storage")

        return {
            "apikey": self._service_role_key,
            "Authorization": f"Bearer {self._service_role_key}",
            "Content-Type": "application/json",
        }

    async def create_chat(
        self,
        *,
        user_id: str,
        query: str,
        response: str,
        agent_type: str,
        citations: list[dict],
    ) -> dict:
        payload = {
            "user_id": user_id,
            "query": query,
            "response": response,
            "agent_type": agent_type,
            "citations": citations,
        }

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                result = await client.post(
                    f"{self._supabase_url}/rest/v1/chats",
                    headers={
                        **self._headers(),
                        "Prefer": "return=representation",
                    },
                    json=payload,
                )
        except httpx.HTTPError as exc:
            raise RuntimeError("Failed to persist chat record") from exc

        if result.status_code >= 400:
            raise RuntimeError("Failed to persist chat record")

        rows = result.json()
        if isinstance(rows, list) and rows:
            return rows[0]
        if isinstance(rows, dict):
            return rows
        return {
            "id": "",
            **payload,
        }

    async def list_chats(self, *, user_id: str, limit: int = 20) -> list[dict]:
        encoded_user_id = quote(user_id, safe="")
        capped_limit = max(1, min(limit, 100))
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                result = await client.get(
                    f"{self._supabase_url}/rest/v1/chats?user_id=eq.{encoded_user_id}&select=id,query,response,agent_type,citations,created_at&order=created_at.desc&limit={capped_limit}",
                    headers=self._headers(),
                )
        except httpx.HTTPError as exc:
            raise RuntimeError("Failed to list chats") from exc

        if result.status_code >= 400:
            raise RuntimeError("Failed to list chats")

        rows = result.json()
        normalized: list[dict] = []
        if not isinstance(rows, list):
            return normalized

        for row in rows:
            if not isinstance(row, dict):
                continue
            citations = row.get("citations", [])
            if isinstance(citations, str):
                try:
                    citations = json.loads(citations)
                except json.JSONDecodeError:
                    citations = []
            if not isinstance(citations, list):
                citations = []

            normalized.append({
                **row,
                "citations": citations,
            })
        return normalized
