from fastapi.testclient import TestClient

from backend.app.main import app


class FakeActivitiesRepo:
    async def list_activities(self, *, user_id: str, limit: int = 20) -> list[dict]:
        return [
            {
                "id": "act-1",
                "event_type": "research_completed",
                "metadata": {"generation_id": "gen-1"},
                "created_at": "2026-05-11T12:00:00Z",
            },
            {
                "id": "act-2",
                "event_type": "content_draft_created",
                "metadata": {"generation_id": "gen-2"},
                "created_at": "2026-05-11T11:59:00Z",
            }
        ]


class FailingActivitiesRepo:
    async def list_activities(self, *, user_id: str, limit: int = 20) -> list[dict]:
        raise RuntimeError("Failed to list activities")


def _auth_headers() -> dict[str, str]:
    return {"Authorization": "Bearer mock-dev-token"}


def test_activities_feed_returns_persisted_items_when_repo_is_available() -> None:
    from backend.app.api.routes.activities import get_activities_repo

    app.dependency_overrides[get_activities_repo] = lambda: FakeActivitiesRepo()
    client = TestClient(app)

    response = client.get("/activities/feed", headers=_auth_headers())

    assert response.status_code == 200
    body = response.json()
    assert len(body["items"]) == 2
    assert body["items"][0]["event_type"] == "research_completed"
    assert set(body["items"][0].keys()) == {"id", "event_type", "metadata", "created_at"}
    assert body["items"][0]["created_at"] > body["items"][1]["created_at"]

    app.dependency_overrides.clear()


def test_activities_feed_returns_empty_list_when_repo_fails() -> None:
    from backend.app.api.routes.activities import get_activities_repo

    app.dependency_overrides[get_activities_repo] = lambda: FailingActivitiesRepo()
    client = TestClient(app)

    response = client.get("/activities/feed", headers=_auth_headers())

    assert response.status_code == 200
    assert response.json() == {"items": []}

    app.dependency_overrides.clear()
