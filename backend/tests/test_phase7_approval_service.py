import asyncio
from typing import Optional

from backend.app.services.approval_service import ApprovalService


class FakeGenerationsRepo:
    def __init__(self) -> None:
        self.rows: dict[str, dict] = {
            "gen-pending": {
                "id": "gen-pending",
                "user_id": "user-1",
                "agent_type": "content",
                "status": "approval_required",
                "output_json": {},
                "created_at": "2026-05-11T12:00:00Z",
            },
            "gen-approved": {
                "id": "gen-approved",
                "user_id": "user-1",
                "agent_type": "content",
                "status": "approved",
                "output_json": {},
                "created_at": "2026-05-11T12:05:00Z",
            },
            "gen-approved-linkedin": {
                "id": "gen-approved-linkedin",
                "user_id": "user-1",
                "agent_type": "content",
                "status": "approved",
                "output_json": {"format": "linkedin"},
                "created_at": "2026-05-11T12:06:00Z",
            },
        }

    async def get_generation(self, *, user_id: str, generation_id: str) -> Optional[dict]:
        row = self.rows.get(generation_id)
        if not row:
            return None
        if row.get("user_id") != user_id:
            return None
        return dict(row)

    async def update_generation_status(self, *, user_id: str, generation_id: str, next_status: str) -> dict:
        row = self.rows.get(generation_id)
        if not row or row.get("user_id") != user_id:
            raise RuntimeError("Generation not found")
        row["status"] = next_status
        row["updated_at"] = "2026-05-11T12:10:00Z"
        return dict(row)


class FakeActivityLogger:
    def __init__(self) -> None:
        self.events: list[dict] = []

    async def log(self, *, user_id: str, event_type: str, metadata: dict) -> dict:
        row = {
            "id": f"act-{len(self.events) + 1}",
            "user_id": user_id,
            "event_type": event_type,
            "metadata": metadata,
            "created_at": "2026-05-11T12:11:00Z",
        }
        self.events.append(row)
        return row


class FakeApprovalsRepo:
    def __init__(self) -> None:
        self.records: list[dict] = []

    async def create_approval(
        self,
        *,
        user_id: str,
        generation_id: str,
        status: str,
        note: str,
        reason: str,
    ) -> dict:
        row = {
            "id": f"apr-{len(self.records) + 1}",
            "user_id": user_id,
            "generation_id": generation_id,
            "status": status,
            "note": note,
            "reason": reason,
            "approved_at": "2026-05-11T12:10:00Z",
            "created_at": "2026-05-11T12:10:00Z",
        }
        self.records.append(row)
        return row


def test_approve_transition_updates_status_and_logs_event() -> None:
    activity_logger = FakeActivityLogger()
    approvals_repo = FakeApprovalsRepo()
    service = ApprovalService(
        generations_repo=FakeGenerationsRepo(),
        activity_logger=activity_logger,
        approvals_repo=approvals_repo,
    )

    result = asyncio.run(service.approve(user_id="user-1", generation_id="gen-pending", note="ship it"))

    assert result["generation_id"] == "gen-pending"
    assert result["previous_status"] == "approval_required"
    assert result["status"] == "approved"
    assert result["approval_required"] is False
    assert len(activity_logger.events) == 1
    assert activity_logger.events[0]["event_type"] == "approval_approved"
    assert len(approvals_repo.records) == 1
    assert approvals_repo.records[0]["status"] == "approved"


def test_reject_transition_updates_status_and_logs_event() -> None:
    activity_logger = FakeActivityLogger()
    approvals_repo = FakeApprovalsRepo()
    service = ApprovalService(
        generations_repo=FakeGenerationsRepo(),
        activity_logger=activity_logger,
        approvals_repo=approvals_repo,
    )

    result = asyncio.run(service.reject(user_id="user-1", generation_id="gen-pending", reason="needs edits"))

    assert result["generation_id"] == "gen-pending"
    assert result["previous_status"] == "approval_required"
    assert result["status"] == "rejected"
    assert result["approval_required"] is True
    assert len(activity_logger.events) == 1
    assert activity_logger.events[0]["event_type"] == "approval_rejected"
    assert len(approvals_repo.records) == 1
    assert approvals_repo.records[0]["status"] == "rejected"


def test_publish_requires_approved_status() -> None:
    service = ApprovalService(generations_repo=FakeGenerationsRepo(), activity_logger=FakeActivityLogger())

    try:
        asyncio.run(service.publish(user_id="user-1", generation_id="gen-pending"))
    except ValueError as exc:
        assert str(exc) == "Invalid status transition"
    else:
        raise AssertionError("Expected invalid transition error")


def test_publish_transition_updates_status_and_logs_event() -> None:
    activity_logger = FakeActivityLogger()
    approvals_repo = FakeApprovalsRepo()
    service = ApprovalService(
        generations_repo=FakeGenerationsRepo(),
        activity_logger=activity_logger,
        approvals_repo=approvals_repo,
    )

    result = asyncio.run(service.publish(user_id="user-1", generation_id="gen-approved"))

    assert result["generation_id"] == "gen-approved"
    assert result["previous_status"] == "approved"
    assert result["status"] == "published"
    assert result["published"] is True
    assert len(activity_logger.events) == 1
    assert activity_logger.events[0]["event_type"] == "content_published"
    assert len(approvals_repo.records) == 1
    assert approvals_repo.records[0]["status"] == "published"


def test_publish_rejects_linkedin_format_with_guardrail_message() -> None:
    service = ApprovalService(generations_repo=FakeGenerationsRepo(), activity_logger=FakeActivityLogger())

    try:
        asyncio.run(service.publish(user_id="user-1", generation_id="gen-approved-linkedin"))
    except ValueError as exc:
        assert str(exc) == "Use /linkedin/publish for LinkedIn drafts"
    else:
        raise AssertionError("Expected LinkedIn guardrail to reject publish")


def test_approval_service_returns_not_found_when_generation_missing() -> None:
    service = ApprovalService(generations_repo=FakeGenerationsRepo(), activity_logger=FakeActivityLogger())

    try:
        asyncio.run(service.approve(user_id="user-1", generation_id="missing-gen", note=None))
    except LookupError as exc:
        assert str(exc) == "Generation not found"
    else:
        raise AssertionError("Expected not found error")
