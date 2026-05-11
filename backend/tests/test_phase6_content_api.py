from fastapi.testclient import TestClient
from typing import Optional

from backend.app.main import app


class FakeContentAgentService:
    def __init__(self) -> None:
        self.received_generate_image: Optional[bool] = None

    async def run(
        self,
        *,
        user_id: str,
        query: str,
        format_type: str,
        tone: str,
        length: str,
        top_k: int,
        generate_image: bool,
    ) -> dict:
        self.received_generate_image = generate_image
        return {
            "generation_id": "gen-c1",
            "agent_type": "content",
            "status": "approval_required",
            "approval_required": True,
            "query": query,
            "format": format_type,
            "tone": tone,
            "length": length,
            "title": "FounderOS Launch Update",
            "draft": "We shipped onboarding improvements and validated founder traction.",
            "context_labels": ["Founder Notes", "Research Summary"],
            "sources": [
                {
                    "source_type": "memory",
                    "source_label": "Founder Notes",
                    "title": "founder-notes.txt",
                    "snippet": "Founder note snippet",
                }
            ],
            "created_at": "2026-05-11T12:00:00Z",
        }


class NonContentIntentService:
    async def run(
        self,
        *,
        user_id: str,
        query: str,
        format_type: str,
        tone: str,
        length: str,
        top_k: int,
        generate_image: bool,
    ) -> dict:
        raise ValueError("Query is not content intent")


class UnavailableContentService:
    async def run(
        self,
        *,
        user_id: str,
        query: str,
        format_type: str,
        tone: str,
        length: str,
        top_k: int,
        generate_image: bool,
    ) -> dict:
        raise RuntimeError("Content generation unavailable")


def _auth_headers() -> dict[str, str]:
    return {"Authorization": "Bearer mock-dev-token"}


def test_content_endpoint_requires_bearer_token() -> None:
    client = TestClient(app)

    response = client.post("/agents/content", json={"query": "write linkedin post"})

    assert response.status_code == 401
    assert response.json()["detail"] == "Missing bearer token"


def test_content_endpoint_returns_approval_ready_payload_with_dependency_override() -> None:
    from backend.app.api.routes.agents import get_content_agent_service

    fake_service = FakeContentAgentService()
    app.dependency_overrides[get_content_agent_service] = lambda: fake_service
    client = TestClient(app)

    response = client.post(
        "/agents/content",
        headers=_auth_headers(),
        json={
            "query": "write a linkedin launch post",
            "format": "linkedin",
            "tone": "professional",
            "length": "medium",
            "generate_image": False,
            "top_k": 3,
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["agent_type"] == "content"
    assert body["status"] == "approval_required"
    assert body["approval_required"] is True
    assert "Founder Notes" in body["context_labels"]
    assert fake_service.received_generate_image is False

    app.dependency_overrides.clear()


def test_content_endpoint_returns_400_for_non_content_intent() -> None:
    from backend.app.api.routes.agents import get_content_agent_service

    app.dependency_overrides[get_content_agent_service] = lambda: NonContentIntentService()
    client = TestClient(app)

    response = client.post(
        "/agents/content",
        headers=_auth_headers(),
        json={
            "query": "market trends for ai copilots",
            "format": "linkedin",
            "tone": "professional",
            "length": "medium",
            "top_k": 3,
        },
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Query is not content intent"

    app.dependency_overrides.clear()


def test_content_endpoint_returns_503_when_generation_unavailable() -> None:
    from backend.app.api.routes.agents import get_content_agent_service

    app.dependency_overrides[get_content_agent_service] = lambda: UnavailableContentService()
    client = TestClient(app)

    response = client.post(
        "/agents/content",
        headers=_auth_headers(),
        json={
            "query": "write a founder update",
            "format": "founder_update",
            "tone": "insightful",
            "length": "short",
            "top_k": 3,
        },
    )

    assert response.status_code == 503
    assert response.json()["detail"] == "Content generation unavailable"

    app.dependency_overrides.clear()
