from urllib.parse import quote

import httpx


class DocumentsRepository:
    def __init__(self, *, supabase_url: str, service_role_key: str) -> None:
        self._supabase_url = supabase_url.rstrip("/")
        self._service_role_key = service_role_key

    def _headers(self) -> dict[str, str]:
        if not self._supabase_url or not self._service_role_key:
            raise RuntimeError("Supabase metadata storage is not configured")
        if not self._supabase_url.startswith("http"):
            raise RuntimeError("Supabase URL must be an HTTP URL for metadata storage")

        return {
            "apikey": self._service_role_key,
            "Authorization": f"Bearer {self._service_role_key}",
            "Content-Type": "application/json",
        }

    async def create_document(
        self,
        *,
        user_id: str,
        file_name: str,
        source_label: str,
        extracted_text: str,
        vector_id: str,
    ) -> dict:
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(
                    f"{self._supabase_url}/rest/v1/documents",
                    headers={
                        **self._headers(),
                        "Prefer": "return=representation",
                    },
                    json={
                        "user_id": user_id,
                        "file_name": file_name,
                        "source_label": source_label,
                        "extracted_text": extracted_text,
                        "vector_id": vector_id,
                    },
                )
        except httpx.HTTPError as exc:
            raise RuntimeError("Failed to persist document metadata") from exc

        if response.status_code >= 400:
            raise RuntimeError("Failed to persist document metadata")

        rows = response.json()
        if isinstance(rows, list) and rows:
            return rows[0]
        if isinstance(rows, dict):
            return rows
        return {
            "id": "",
            "user_id": user_id,
            "file_name": file_name,
            "source_label": source_label,
            "vector_id": vector_id,
        }

    async def list_documents(self, *, user_id: str) -> list[dict]:
        encoded_user_id = quote(user_id, safe="")
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(
                    f"{self._supabase_url}/rest/v1/documents?user_id=eq.{encoded_user_id}&select=id,file_name,source_label,vector_id,created_at&order=created_at.desc",
                    headers=self._headers(),
                )
        except httpx.HTTPError as exc:
            raise RuntimeError("Failed to list documents") from exc

        if response.status_code >= 400:
            raise RuntimeError("Failed to list documents")

        rows = response.json()
        return rows if isinstance(rows, list) else []

    async def list_documents_for_profile(self, *, user_id: str, limit: int = 30) -> list[dict]:
        encoded_user_id = quote(user_id, safe="")
        capped_limit = max(1, min(limit, 100))
        try:
            async with httpx.AsyncClient(timeout=12.0) as client:
                response = await client.get(
                    f"{self._supabase_url}/rest/v1/documents?user_id=eq.{encoded_user_id}&select=id,file_name,source_label,vector_id,created_at,extracted_text&order=created_at.desc&limit={capped_limit}",
                    headers=self._headers(),
                )
        except httpx.HTTPError as exc:
            raise RuntimeError("Failed to list profile documents") from exc

        if response.status_code >= 400:
            raise RuntimeError("Failed to list profile documents")

        rows = response.json()
        return rows if isinstance(rows, list) else []
