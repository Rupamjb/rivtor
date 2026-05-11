import asyncio

from backend.app.services.activity_logger import ActivityLogger


class FakeActivitiesRepo:
    def __init__(self) -> None:
        self.calls: list[dict] = []

    async def create_activity(self, *, user_id: str, event_type: str, metadata: dict) -> dict:
        row = {
            "id": "act-1",
            "user_id": user_id,
            "event_type": event_type,
            "metadata": metadata,
            "created_at": "2026-05-11T15:00:00Z",
        }
        self.calls.append(row)
        return row


class FailingActivitiesRepo:
    async def create_activity(self, *, user_id: str, event_type: str, metadata: dict) -> dict:
        raise RuntimeError("Failed to persist activity")


def test_activity_logger_records_event_when_repo_succeeds() -> None:
    repo = FakeActivitiesRepo()
    logger = ActivityLogger(activities_repo=repo)

    result = asyncio.run(
        logger.log(
            user_id="user-1",
            event_type="content_draft_created",
            metadata={"generation_id": "gen-1"},
        )
    )

    assert result is not None
    assert result["event_type"] == "content_draft_created"
    assert len(repo.calls) == 1


def test_activity_logger_is_best_effort_when_repo_fails() -> None:
    logger = ActivityLogger(activities_repo=FailingActivitiesRepo())

    result = asyncio.run(
        logger.log(
            user_id="user-1",
            event_type="approval_approved",
            metadata={"generation_id": "gen-1"},
        )
    )

    assert result is None
