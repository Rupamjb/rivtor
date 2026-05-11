from typing import Optional

from fastapi.testclient import TestClient

from backend.app.api.routes.memory import get_memory_service
from backend.app.main import app


class FakeMemoryService:
    async def upload_document(
        self,
        *,
        user_id: str,
        file_name: str,
        content_bytes: bytes,
        source_label: Optional[str],
    ) -> dict:
        return {
            "document_id": "doc-1",
            "vector_id": "vec-1",
            "file_name": file_name,
            "source_label": source_label or "Founder Notes",
            "chunks_indexed": 2,
            "user_id": user_id,
            "bytes": len(content_bytes),
        }

    async def search(self, *, user_id: str, query: str, top_k: int) -> list[dict]:
        return [
            {
                "text": f"Result for {query}",
                "file_name": "founder-notes.txt",
                "source_label": "Founder Notes",
                "document_id": "doc-1",
                "vector_id": "vec-1:0",
                "score": 0.91,
                "user_id": user_id,
                "top_k": top_k,
            }
        ]

    async def list_documents(self, *, user_id: str) -> list[dict]:
        return [
            {
                "id": "doc-1",
                "file_name": "founder-notes.txt",
                "vector_id": "vec-1",
                "created_at": "2026-05-10T12:00:00Z",
                "user_id": user_id,
            }
        ]


class FailingListService(FakeMemoryService):
    async def list_documents(self, *, user_id: str) -> list[dict]:
        raise RuntimeError("Supabase metadata storage is not configured")


def _auth_headers() -> dict[str, str]:
    return {"Authorization": "Bearer mock-dev-token"}


def test_memory_upload_accepts_txt_and_returns_indexing_summary() -> None:
    app.dependency_overrides[get_memory_service] = lambda: FakeMemoryService()
    client = TestClient(app)

    response = client.post(
        "/memory/upload",
        headers=_auth_headers(),
        data={"source_label": "Founder Notes"},
        files={"file": ("founder-notes.txt", b"FounderOS momentum", "text/plain")},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["document_id"] == "doc-1"
    assert body["chunks_indexed"] == 2
    assert body["source_label"] == "Founder Notes"


def test_memory_upload_rejects_non_pdf_or_txt_files() -> None:
    app.dependency_overrides[get_memory_service] = lambda: FakeMemoryService()
    client = TestClient(app)

    response = client.post(
        "/memory/upload",
        headers=_auth_headers(),
        files={"file": ("recording.mp3", b"audio", "audio/mpeg")},
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Only PDF and TXT files are supported"


def test_memory_search_returns_relevant_chunks_for_authenticated_user() -> None:
    app.dependency_overrides[get_memory_service] = lambda: FakeMemoryService()
    client = TestClient(app)

    response = client.post(
        "/memory/search",
        headers=_auth_headers(),
        json={"query": "investor update", "top_k": 3},
    )

    assert response.status_code == 200
    items = response.json()["items"]
    assert len(items) == 1
    assert items[0]["source_label"] == "Founder Notes"
    assert items[0]["top_k"] == 3


def test_memory_list_returns_user_documents() -> None:
    app.dependency_overrides[get_memory_service] = lambda: FakeMemoryService()
    client = TestClient(app)

    response = client.get("/memory/list", headers=_auth_headers())

    assert response.status_code == 200
    items = response.json()["items"]
    assert len(items) == 1
    assert items[0]["file_name"] == "founder-notes.txt"


def test_memory_list_returns_503_when_metadata_storage_fails() -> None:
    app.dependency_overrides[get_memory_service] = lambda: FailingListService()
    client = TestClient(app)

    response = client.get("/memory/list", headers=_auth_headers())

    assert response.status_code == 503
    assert response.json()["detail"] == "Supabase metadata storage is not configured"
