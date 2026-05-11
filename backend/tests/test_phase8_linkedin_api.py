from fastapi.testclient import TestClient
from typing import Optional

from backend.app.main import app


class FakeLinkedInService:
    async def connect(self, *, user_id: str, step: str, code: Optional[str], state: Optional[str], force_reconnect: bool):
        if step == "start":
            return {
                "step": "start",
                "connection_status": "pending",
                "authorization_url": "https://www.linkedin.com/oauth/v2/authorization?state=s1",
                "state": "s1",
                "connected_at": None,
            }
        if step == "status":
            return {
                "step": "status",
                "connection_status": "connected",
                "linkedin_member_urn": "urn:li:person:member-1",
                "connected_at": "2026-05-11T13:00:00Z",
            }
        return {
            "step": "complete",
            "connection_status": "connected",
            "linkedin_member_urn": "urn:li:person:member-1",
            "connected_at": "2026-05-11T13:00:00Z",
        }

    async def publish(self, *, user_id: str, generation_id: str):
        return {
            "generation_id": generation_id,
            "status": "published",
            "channel": "linkedin",
            "linkedin_post_urn": "urn:li:share:post-1",
            "linkedin_post_url": "https://www.linkedin.com/feed/update/urn:li:share:post-1",
            "published_at": "2026-05-11T14:00:00Z",
        }


class BadConnectPayloadService(FakeLinkedInService):
    async def connect(self, *, user_id: str, step: str, code: Optional[str], state: Optional[str], force_reconnect: bool):
        raise ValueError("code and state are required for complete step")


class NotConnectedPublishService(FakeLinkedInService):
    async def publish(self, *, user_id: str, generation_id: str):
        raise ValueError("LinkedIn not connected")


class RateLimitedPublishService(FakeLinkedInService):
    async def publish(self, *, user_id: str, generation_id: str):
        raise RuntimeError("LinkedIn rate limited")


class FailingConnectService(FakeLinkedInService):
    async def connect(self, *, user_id: str, step: str, code: Optional[str], state: Optional[str], force_reconnect: bool):
        raise RuntimeError("LinkedIn app not configured")


def _auth_headers() -> dict[str, str]:
    return {"Authorization": "Bearer mock-dev-token"}


def test_linkedin_connect_requires_bearer_token() -> None:
    client = TestClient(app)

    response = client.post("/linkedin/connect", json={"step": "start"})

    assert response.status_code == 401
    assert response.json()["detail"] == "Missing bearer token"


def test_linkedin_connect_start_returns_authorization_url() -> None:
    from backend.app.api.routes.linkedin import get_linkedin_service

    app.dependency_overrides[get_linkedin_service] = lambda: FakeLinkedInService()
    client = TestClient(app)

    response = client.post("/linkedin/connect", headers=_auth_headers(), json={"step": "start"})

    assert response.status_code == 200
    assert response.json()["connection_status"] == "pending"
    assert "linkedin.com" in response.json()["authorization_url"]
    app.dependency_overrides.clear()


def test_linkedin_connect_complete_returns_400_for_bad_payload() -> None:
    from backend.app.api.routes.linkedin import get_linkedin_service

    app.dependency_overrides[get_linkedin_service] = lambda: BadConnectPayloadService()
    client = TestClient(app)

    response = client.post("/linkedin/connect", headers=_auth_headers(), json={"step": "complete"})

    assert response.status_code == 400
    assert response.json()["detail"] == "code and state are required for complete step"
    app.dependency_overrides.clear()


def test_linkedin_publish_returns_409_when_not_connected() -> None:
    from backend.app.api.routes.linkedin import get_linkedin_service

    app.dependency_overrides[get_linkedin_service] = lambda: NotConnectedPublishService()
    client = TestClient(app)

    response = client.post("/linkedin/publish", headers=_auth_headers(), json={"generation_id": "gen-1"})

    assert response.status_code == 409
    assert response.json()["detail"] == "LinkedIn not connected"
    app.dependency_overrides.clear()


def test_linkedin_publish_returns_429_when_rate_limited() -> None:
    from backend.app.api.routes.linkedin import get_linkedin_service

    app.dependency_overrides[get_linkedin_service] = lambda: RateLimitedPublishService()
    client = TestClient(app)

    response = client.post("/linkedin/publish", headers=_auth_headers(), json={"generation_id": "gen-1"})

    assert response.status_code == 429
    assert response.json()["detail"] == "LinkedIn rate limited"
    app.dependency_overrides.clear()


def test_linkedin_connect_returns_503_when_not_configured() -> None:
    from backend.app.api.routes.linkedin import get_linkedin_service

    app.dependency_overrides[get_linkedin_service] = lambda: FailingConnectService()
    client = TestClient(app)

    response = client.post("/linkedin/connect", headers=_auth_headers(), json={"step": "start"})

    assert response.status_code == 503
    assert response.json()["detail"] == "LinkedIn app not configured"
    app.dependency_overrides.clear()
