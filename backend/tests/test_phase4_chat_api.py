import json
from typing import Optional

from fastapi.testclient import TestClient

from backend.app.api.routes.chat import get_chat_orchestrator
from backend.app.main import app
from backend.app.services.chat_orchestrator import ChatRunResult


class FakeChatOrchestrator:
    def __init__(self) -> None:
        self.received_history: list[dict] = []

    async def retrieve_context(self, *, user_id: str, query: str, top_k: int) -> list[dict]:
        return [
            {
                "text": "Founder notes mention retention metrics.",
                "file_name": "founder-notes.txt",
                "source_label": "Founder Notes",
                "vector_id": "vec-1:0",
                "score": 0.91,
            }
        ]

    async def generate_response(
        self,
        *,
        query: str,
        agent_type: str,
        memory_items: list[dict],
        history: Optional[list[dict]] = None,
    ) -> ChatRunResult:
        self.received_history = list(history or [])
        return ChatRunResult(
            response_text="Streamed answer from FounderOS.",
            citations=[
                {
                    "source_label": "Founder Notes",
                    "file_name": "founder-notes.txt",
                    "vector_id": "vec-1:0",
                    "score": 0.91,
                }
            ],
        )

    async def persist_chat(
        self,
        *,
        user_id: str,
        query: str,
        response_text: str,
        agent_type: str,
        citations: list[dict],
    ) -> dict:
        return {"id": "chat-1"}


class FailingChatOrchestrator(FakeChatOrchestrator):
    async def generate_response(
        self,
        *,
        query: str,
        agent_type: str,
        memory_items: list[dict],
        history: Optional[list[dict]] = None,
    ) -> ChatRunResult:
        raise RuntimeError("generation unavailable")


def _auth_headers() -> dict[str, str]:
    return {"Authorization": "Bearer mock-dev-token"}


def test_chat_query_requires_bearer_token() -> None:
    app.dependency_overrides[get_chat_orchestrator] = lambda: FakeChatOrchestrator()
    client = TestClient(app)

    response = client.post("/chat/query", json={"query": "hello"})

    assert response.status_code == 401
    assert response.json()["detail"] == "Missing bearer token"
    app.dependency_overrides.clear()


def test_chat_query_streams_ndjson_events_with_dependency_override() -> None:
    fake_orchestrator = FakeChatOrchestrator()
    app.dependency_overrides[get_chat_orchestrator] = lambda: fake_orchestrator
    client = TestClient(app)

    response = client.post(
        "/chat/query",
        headers=_auth_headers(),
        json={"query": "Summarize founder notes", "top_k": 3, "agent_type": "executive"},
    )

    assert response.status_code == 200

    events = [json.loads(line) for line in response.text.splitlines() if line.strip()]
    stages = [event.get("stage") for event in events if event.get("type") == "status"]
    assert stages == ["retrieving_memory", "generating_response", "preparing_output"]

    token_events = [event for event in events if event.get("type") == "token"]
    assert token_events
    assert "Streamed" in token_events[0]["token"]

    citations_event = next(event for event in events if event.get("type") == "citations")
    assert citations_event["items"][0]["source_label"] == "Founder Notes"

    done_event = events[-1]
    assert done_event["type"] == "done"
    assert done_event["chat_id"] == "chat-1"
    assert fake_orchestrator.received_history == []
    app.dependency_overrides.clear()


def test_chat_query_passes_history_to_orchestrator() -> None:
    fake_orchestrator = FakeChatOrchestrator()
    app.dependency_overrides[get_chat_orchestrator] = lambda: fake_orchestrator
    client = TestClient(app)

    response = client.post(
        "/chat/query",
        headers=_auth_headers(),
        json={
            "query": "Refine this answer",
            "top_k": 3,
            "agent_type": "executive",
            "history": [
                {"role": "user", "content": "Draft launch priorities"},
                {"role": "assistant", "content": "Focus onboarding and retention."},
            ],
        },
    )

    assert response.status_code == 200
    assert fake_orchestrator.received_history == [
        {"role": "user", "content": "Draft launch priorities"},
        {"role": "assistant", "content": "Focus onboarding and retention."},
    ]

    app.dependency_overrides.clear()


def test_chat_query_streams_error_event_when_generation_fails() -> None:
    app.dependency_overrides[get_chat_orchestrator] = lambda: FailingChatOrchestrator()
    client = TestClient(app)

    response = client.post(
        "/chat/query",
        headers=_auth_headers(),
        json={"query": "Summarize founder notes", "top_k": 3, "agent_type": "executive"},
    )

    assert response.status_code == 200

    events = [json.loads(line) for line in response.text.splitlines() if line.strip()]
    assert events[-1]["type"] == "error"
    assert "generation unavailable" in events[-1]["detail"]
    app.dependency_overrides.clear()
