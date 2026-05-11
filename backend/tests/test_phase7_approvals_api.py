from fastapi.testclient import TestClient
from typing import Optional

from backend.app.main import app


class FakeApprovalService:
    async def approve(self, *, user_id: str, generation_id: str, note: Optional[str]) -> dict:
        return {
            "generation_id": generation_id,
            "agent_type": "content",
            "previous_status": "approval_required",
            "status": "approved",
            "approval_required": False,
            "updated_at": "2026-05-11T13:00:00Z",
        }

    async def reject(self, *, user_id: str, generation_id: str, reason: Optional[str]) -> dict:
        return {
            "generation_id": generation_id,
            "agent_type": "content",
            "previous_status": "approval_required",
            "status": "rejected",
            "approval_required": True,
            "updated_at": "2026-05-11T13:05:00Z",
        }

    async def publish(self, *, user_id: str, generation_id: str) -> dict:
        return {
            "generation_id": generation_id,
            "previous_status": "approved",
            "status": "published",
            "published": True,
            "updated_at": "2026-05-11T13:10:00Z",
        }


class NotFoundApprovalService(FakeApprovalService):
    async def approve(self, *, user_id: str, generation_id: str, note: Optional[str]) -> dict:
        raise LookupError("Generation not found")


class ConflictApprovalService(FakeApprovalService):
    async def publish(self, *, user_id: str, generation_id: str) -> dict:
        raise ValueError("Invalid status transition")


class FailingApprovalService(FakeApprovalService):
    async def reject(self, *, user_id: str, generation_id: str, reason: Optional[str]) -> dict:
        raise RuntimeError("Approval persistence unavailable")


class LinkedInGuardApprovalService(FakeApprovalService):
    async def publish(self, *, user_id: str, generation_id: str) -> dict:
        raise ValueError("Use /linkedin/publish for LinkedIn drafts")


def _auth_headers() -> dict[str, str]:
    return {"Authorization": "Bearer mock-dev-token"}


def test_approvals_endpoints_require_bearer_token() -> None:
    client = TestClient(app)

    response = client.post("/approvals/approve", json={"generation_id": "gen-1"})

    assert response.status_code == 401
    assert response.json()["detail"] == "Missing bearer token"


def test_approve_endpoint_returns_approved_payload() -> None:
    from backend.app.api.routes.approvals import get_approval_service

    app.dependency_overrides[get_approval_service] = lambda: FakeApprovalService()
    client = TestClient(app)

    response = client.post(
        "/approvals/approve",
        headers=_auth_headers(),
        json={"generation_id": "gen-c1", "note": "ready"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["generation_id"] == "gen-c1"
    assert body["status"] == "approved"
    assert body["approval_required"] is False

    app.dependency_overrides.clear()


def test_reject_endpoint_returns_rejected_payload() -> None:
    from backend.app.api.routes.approvals import get_approval_service

    app.dependency_overrides[get_approval_service] = lambda: FakeApprovalService()
    client = TestClient(app)

    response = client.post(
        "/approvals/reject",
        headers=_auth_headers(),
        json={"generation_id": "gen-c1", "reason": "Needs edits"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "rejected"
    assert body["approval_required"] is True

    app.dependency_overrides.clear()


def test_publish_endpoint_returns_published_payload() -> None:
    from backend.app.api.routes.approvals import get_approval_service

    app.dependency_overrides[get_approval_service] = lambda: FakeApprovalService()
    client = TestClient(app)

    response = client.post(
        "/approvals/publish",
        headers=_auth_headers(),
        json={"generation_id": "gen-c1"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "published"
    assert body["published"] is True

    app.dependency_overrides.clear()


def test_approve_endpoint_returns_404_for_missing_generation() -> None:
    from backend.app.api.routes.approvals import get_approval_service

    app.dependency_overrides[get_approval_service] = lambda: NotFoundApprovalService()
    client = TestClient(app)

    response = client.post(
        "/approvals/approve",
        headers=_auth_headers(),
        json={"generation_id": "missing-gen"},
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Generation not found"

    app.dependency_overrides.clear()


def test_publish_endpoint_returns_409_for_invalid_transition() -> None:
    from backend.app.api.routes.approvals import get_approval_service

    app.dependency_overrides[get_approval_service] = lambda: ConflictApprovalService()
    client = TestClient(app)

    response = client.post(
        "/approvals/publish",
        headers=_auth_headers(),
        json={"generation_id": "gen-c1"},
    )

    assert response.status_code == 409
    assert response.json()["detail"] == "Invalid status transition"

    app.dependency_overrides.clear()


def test_reject_endpoint_returns_503_when_persistence_unavailable() -> None:
    from backend.app.api.routes.approvals import get_approval_service

    app.dependency_overrides[get_approval_service] = lambda: FailingApprovalService()
    client = TestClient(app)

    response = client.post(
        "/approvals/reject",
        headers=_auth_headers(),
        json={"generation_id": "gen-c1"},
    )

    assert response.status_code == 503
    assert response.json()["detail"] == "Approval persistence unavailable"

    app.dependency_overrides.clear()


def test_publish_endpoint_returns_409_for_linkedin_guardrail() -> None:
    from backend.app.api.routes.approvals import get_approval_service

    app.dependency_overrides[get_approval_service] = lambda: LinkedInGuardApprovalService()
    client = TestClient(app)

    response = client.post(
        "/approvals/publish",
        headers=_auth_headers(),
        json={"generation_id": "gen-c1"},
    )

    assert response.status_code == 409
    assert response.json()["detail"] == "Use /linkedin/publish for LinkedIn drafts"

    app.dependency_overrides.clear()
