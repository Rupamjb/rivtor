from fastapi.testclient import TestClient

from backend.app.main import app


class FakeExecutiveAgentService:
    async def run(self, *, user_id: str, query: str, top_k: int) -> dict:
        return {
            "agent_type": "executive",
            "query": query,
            "response": "Here is your executive summary.",
            "citations": [
                {
                    "source_label": "Founder Notes",
                    "file_name": "notes.md",
                    "vector_id": "vec-1:0",
                }
            ],
        }


class UnavailableExecutiveAgentService:
    async def run(self, *, user_id: str, query: str, top_k: int) -> dict:
        raise RuntimeError("Executive generation unavailable")


def _auth_headers() -> dict[str, str]:
    return {"Authorization": "Bearer mock-dev-token"}


def test_executive_endpoint_requires_bearer_token() -> None:
    client = TestClient(app)

    response = client.post("/agents/executive", json={"query": "summarize startup notes"})

    assert response.status_code == 401
    assert response.json()["detail"] == "Missing bearer token"


def test_executive_endpoint_returns_structured_payload() -> None:
    from backend.app.api.routes.agents import get_executive_agent_service

    app.dependency_overrides[get_executive_agent_service] = lambda: FakeExecutiveAgentService()
    client = TestClient(app)

    response = client.post(
        "/agents/executive",
        headers=_auth_headers(),
        json={"query": "summarize startup notes", "top_k": 3},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["agent_type"] == "executive"
    assert body["query"] == "summarize startup notes"
    assert "summary" not in body
    assert isinstance(body["citations"], list)

    app.dependency_overrides.clear()


def test_executive_endpoint_returns_503_when_generation_unavailable() -> None:
    from backend.app.api.routes.agents import get_executive_agent_service

    app.dependency_overrides[get_executive_agent_service] = lambda: UnavailableExecutiveAgentService()
    client = TestClient(app)

    response = client.post(
        "/agents/executive",
        headers=_auth_headers(),
        json={"query": "summarize startup notes", "top_k": 3},
    )

    assert response.status_code == 503
    assert response.json()["detail"] == "Executive generation unavailable"

    app.dependency_overrides.clear()
