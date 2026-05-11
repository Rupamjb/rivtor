from fastapi.testclient import TestClient

from backend.app.main import app


class FakeResearchAgentService:
    async def run(self, *, user_id: str, query: str, top_k: int) -> dict:
        return {
            "generation_id": "gen-1",
            "agent_type": "research",
            "query": query,
            "summary": "Competitor momentum is rising around onboarding optimization.",
            "signals": ["Competitors publish weekly onboarding insights"],
            "risks": ["Rising CAC in crowded channels"],
            "actions": ["Run a founder note + market scan every Monday"],
            "sources": [
                {
                    "title": "AI startup market update",
                    "url": "https://example.com/market",
                    "source_type": "web",
                    "source_label": "Tavily",
                    "snippet": "Investors prioritize retention and onboarding metrics.",
                }
            ],
            "created_at": "2026-05-11T12:00:00Z",
        }


class NonResearchIntentService:
    async def run(self, *, user_id: str, query: str, top_k: int) -> dict:
        raise ValueError("Query is not research intent")


class UnavailableResearchService:
    async def run(self, *, user_id: str, query: str, top_k: int) -> dict:
        raise RuntimeError("Web search unavailable")


def _auth_headers() -> dict[str, str]:
    return {"Authorization": "Bearer mock-dev-token"}


def test_research_endpoint_requires_bearer_token() -> None:
    client = TestClient(app)

    response = client.post("/agents/research", json={"query": "competitor trends"})

    assert response.status_code == 401
    assert response.json()["detail"] == "Missing bearer token"


def test_research_endpoint_returns_structured_summary_with_dependency_override() -> None:
    from backend.app.api.routes.agents import get_research_agent_service

    app.dependency_overrides[get_research_agent_service] = lambda: FakeResearchAgentService()
    client = TestClient(app)

    response = client.post(
        "/agents/research",
        headers=_auth_headers(),
        json={"query": "startup competitor trends in AI copilots", "top_k": 3},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["agent_type"] == "research"
    assert body["generation_id"] == "gen-1"
    assert isinstance(body["signals"], list)
    assert body["sources"][0]["source_type"] in {"web", "memory"}

    app.dependency_overrides.clear()


def test_research_endpoint_returns_400_for_non_research_intent() -> None:
    from backend.app.api.routes.agents import get_research_agent_service

    app.dependency_overrides[get_research_agent_service] = lambda: NonResearchIntentService()
    client = TestClient(app)

    response = client.post(
        "/agents/research",
        headers=_auth_headers(),
        json={"query": "write a linkedin post", "top_k": 3},
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Query is not research intent"

    app.dependency_overrides.clear()


def test_research_endpoint_returns_503_when_web_search_unavailable() -> None:
    from backend.app.api.routes.agents import get_research_agent_service

    app.dependency_overrides[get_research_agent_service] = lambda: UnavailableResearchService()
    client = TestClient(app)

    response = client.post(
        "/agents/research",
        headers=_auth_headers(),
        json={"query": "market research on onboarding", "top_k": 3},
    )

    assert response.status_code == 503
    assert response.json()["detail"] == "Web search unavailable"

    app.dependency_overrides.clear()
