import json
from typing import Optional
from urllib.parse import quote

import httpx


class GenerationsRepository:
    def __init__(self, *, supabase_url: str, service_role_key: str) -> None:
        self._supabase_url = supabase_url.rstrip("/")
        self._service_role_key = service_role_key

    def _headers(self) -> dict[str, str]:
        if not self._supabase_url or not self._service_role_key:
            raise RuntimeError("Supabase generations storage is not configured")
        if not self._supabase_url.startswith("http"):
            raise RuntimeError("Supabase URL must be an HTTP URL for generations storage")

        return {
            "apikey": self._service_role_key,
            "Authorization": f"Bearer {self._service_role_key}",
            "Content-Type": "application/json",
        }

    async def create_generation(
        self,
        *,
        user_id: str,
        agent_type: str,
        status: str,
        content: str,
        output_json: dict,
    ) -> dict:
        payload = {
            "user_id": user_id,
            "agent_type": agent_type,
            "status": status,
            "content": content,
            "output_json": output_json,
        }

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(
                    f"{self._supabase_url}/rest/v1/generations",
                    headers={
                        **self._headers(),
                        "Prefer": "return=representation",
                    },
                    json=payload,
                )
        except httpx.HTTPError as exc:
            raise RuntimeError("Failed to persist generation") from exc

        if response.status_code >= 400:
            raise RuntimeError("Failed to persist generation")

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

    @staticmethod
    def _normalize_row(row: dict) -> dict:
        output_json = row.get("output_json", {})
        if isinstance(output_json, str):
            try:
                output_json = json.loads(output_json)
            except json.JSONDecodeError:
                output_json = {}
        if not isinstance(output_json, dict):
            output_json = {}

        return {
            **row,
            "output_json": output_json,
        }

    async def get_generation(self, *, user_id: str, generation_id: str) -> Optional[dict]:
        encoded_user_id = quote(user_id, safe="")
        encoded_generation_id = quote(generation_id, safe="")

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(
                    f"{self._supabase_url}/rest/v1/generations?user_id=eq.{encoded_user_id}&id=eq.{encoded_generation_id}&select=id,agent_type,status,content,output_json,created_at&limit=1",
                    headers=self._headers(),
                )
        except httpx.HTTPError as exc:
            raise RuntimeError("Failed to fetch generation") from exc

        if response.status_code >= 400:
            raise RuntimeError("Failed to fetch generation")

        rows = response.json()
        if not isinstance(rows, list) or not rows:
            return None

        row = rows[0]
        if not isinstance(row, dict):
            return None

        return self._normalize_row(row)

    async def update_generation_status(
        self,
        *,
        user_id: str,
        generation_id: str,
        next_status: str,
    ) -> dict:
        encoded_user_id = quote(user_id, safe="")
        encoded_generation_id = quote(generation_id, safe="")
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.patch(
                    f"{self._supabase_url}/rest/v1/generations?user_id=eq.{encoded_user_id}&id=eq.{encoded_generation_id}",
                    headers={
                        **self._headers(),
                        "Prefer": "return=representation",
                    },
                    json={
                        "status": next_status,
                    },
                )
        except httpx.HTTPError as exc:
            raise RuntimeError("Failed to update generation status") from exc

        if response.status_code >= 400:
            raise RuntimeError("Failed to update generation status")

        rows = response.json()
        if not isinstance(rows, list) or not rows:
            raise RuntimeError("Generation not found")

        row = rows[0]
        if not isinstance(row, dict):
            raise RuntimeError("Generation not found")

        return self._normalize_row(row)

    async def list_generations(
        self,
        *,
        user_id: str,
        limit: int = 20,
        agent_type: str = "",
    ) -> list[dict]:
        encoded_user_id = quote(user_id, safe="")
        capped_limit = max(1, min(limit, 100))
        agent_filter = ""
        if agent_type:
            agent_filter = f"&agent_type=eq.{quote(agent_type, safe='')}"
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(
                    f"{self._supabase_url}/rest/v1/generations?user_id=eq.{encoded_user_id}{agent_filter}&select=id,agent_type,status,content,output_json,created_at&order=created_at.desc&limit={capped_limit}",
                    headers=self._headers(),
                )
        except httpx.HTTPError as exc:
            raise RuntimeError("Failed to list generations") from exc

        if response.status_code >= 400:
            raise RuntimeError("Failed to list generations")

        rows = response.json()
        normalized: list[dict] = []
        if not isinstance(rows, list):
            return normalized

        for row in rows:
            if not isinstance(row, dict):
                continue
            normalized.append(self._normalize_row(row))

        return normalized
