import asyncio
from datetime import datetime, timedelta, timezone

from backend.app.services.linkedin_service import LinkedInService


class FakeGenerationsRepo:
    def __init__(
        self,
        *,
        status: str = "approved",
        format_type: str = "linkedin",
        image_prompt: str = "",
        image_data_url: str = "",
        content: str = "FounderOS launch update draft",
    ) -> None:
        self.status = status
        self.format_type = format_type
        self.image_prompt = image_prompt
        self.image_data_url = image_data_url
        self.content = content
        self.updated_to = None

    async def get_generation(self, *, user_id: str, generation_id: str):
        return {
            "id": generation_id,
            "user_id": user_id,
            "agent_type": "content",
            "status": self.status,
            "content": self.content,
            "output_json": {
                "format": self.format_type,
                "image_prompt": self.image_prompt,
                "image_data_url": self.image_data_url,
            },
            "created_at": "2026-05-11T12:00:00Z",
        }

    async def update_generation_status(self, *, user_id: str, generation_id: str, next_status: str):
        self.updated_to = next_status
        return {
            "id": generation_id,
            "user_id": user_id,
            "status": next_status,
            "agent_type": "content",
            "output_json": {"format": self.format_type},
        }


class FakeConnectionsRepo:
    def __init__(self) -> None:
        self.row = None

    async def get_connection(self, *, user_id: str):
        return self.row

    async def upsert_pending_connection(self, *, user_id: str, oauth_state: str, expires_at: str):
        self.row = {
            "user_id": user_id,
            "connection_status": "pending",
            "oauth_state": oauth_state,
            "oauth_state_expires_at": expires_at,
            "access_token": "",
            "linkedin_member_urn": None,
            "connected_at": None,
        }
        return self.row

    async def mark_connected(self, *, user_id: str, access_token: str, linkedin_member_urn: str):
        self.row = {
            "user_id": user_id,
            "connection_status": "connected",
            "oauth_state": None,
            "oauth_state_expires_at": None,
            "access_token": access_token,
            "linkedin_member_urn": linkedin_member_urn,
            "connected_at": "2026-05-11T13:00:00Z",
        }
        return self.row


class FakePublicationsRepo:
    def __init__(self) -> None:
        self.rows = []

    async def create_publication_attempt(self, **kwargs):
        self.rows.append(kwargs)
        return {"id": "pub-1", **kwargs}


class FakeLinkedInApiClient:
    def __init__(self) -> None:
        self.last_image_content_type = ""
        self.last_image_size = 0
        self.last_content = ""

    def validate_config(self) -> None:
        return None

    async def build_authorization_url(self, *, state: str):
        return f"https://www.linkedin.com/oauth/v2/authorization?state={state}"

    async def exchange_code_for_token(self, *, code: str):
        return {"access_token": "li-token", "expires_in": 3600}

    async def fetch_member_urn(self, *, access_token: str):
        return "urn:li:person:member-1"

    async def publish_post(
        self,
        *,
        access_token: str,
        author_urn: str,
        content: str,
        image_bytes: bytes = b"",
        image_content_type: str = "",
    ):
        self.last_image_content_type = image_content_type
        self.last_image_size = len(image_bytes)
        self.last_content = content
        return {
            "linkedin_post_urn": "urn:li:share:post-1",
            "linkedin_post_url": "https://www.linkedin.com/feed/update/urn:li:share:post-1",
        }


class FailingLinkedInApiClient(FakeLinkedInApiClient):
    async def publish_post(
        self,
        *,
        access_token: str,
        author_urn: str,
        content: str,
        image_bytes: bytes = b"",
        image_content_type: str = "",
    ):
        raise RuntimeError("LinkedIn provider unavailable")


class FakeImageService:
    def __init__(self) -> None:
        self.prompts: list[str] = []

    def is_configured(self) -> bool:
        return True

    async def generate_image_bytes(self, *, prompt: str, size: str = "1024x1024") -> dict:
        self.prompts.append(prompt)
        return {
            "bytes": b"fake-png-bytes",
            "mime_type": "image/png",
        }


class FakeActivityLogger:
    def __init__(self) -> None:
        self.events = []

    async def log(self, *, user_id: str, event_type: str, metadata: dict):
        self.events.append({"event_type": event_type, "metadata": metadata})
        return {"id": f"act-{len(self.events)}", "event_type": event_type, "metadata": metadata}


def test_linkedin_connect_start_returns_pending_state_with_authorization_url() -> None:
    service = LinkedInService(
        linkedin_api_client=FakeLinkedInApiClient(),
        connections_repo=FakeConnectionsRepo(),
        publications_repo=FakePublicationsRepo(),
        generations_repo=FakeGenerationsRepo(),
        activity_logger=FakeActivityLogger(),
        redirect_uri="http://localhost:3000/integrations/linkedin/callback",
    )

    result = asyncio.run(service.connect(user_id="user-1", step="start", code=None, state=None, force_reconnect=False))

    assert result["step"] == "start"
    assert result["connection_status"] == "pending"
    assert "linkedin.com" in result["authorization_url"]
    assert bool(result["state"]) is True


def test_linkedin_connect_complete_rejects_state_mismatch() -> None:
    connections_repo = FakeConnectionsRepo()
    expires_at = (datetime.now(timezone.utc) + timedelta(minutes=10)).isoformat().replace("+00:00", "Z")
    connections_repo.row = {
        "user_id": "user-1",
        "connection_status": "pending",
        "oauth_state": "expected-state",
        "oauth_state_expires_at": expires_at,
        "access_token": "",
        "linkedin_member_urn": None,
        "connected_at": None,
    }
    service = LinkedInService(
        linkedin_api_client=FakeLinkedInApiClient(),
        connections_repo=connections_repo,
        publications_repo=FakePublicationsRepo(),
        generations_repo=FakeGenerationsRepo(),
        activity_logger=FakeActivityLogger(),
        redirect_uri="http://localhost:3000/integrations/linkedin/callback",
    )

    try:
        asyncio.run(service.connect(user_id="user-1", step="complete", code="oauth-code", state="bad-state", force_reconnect=False))
    except ValueError as exc:
        assert str(exc) == "OAuth state mismatch"
    else:
        raise AssertionError("Expected OAuth state mismatch")


def test_linkedin_publish_requires_approved_status() -> None:
    service = LinkedInService(
        linkedin_api_client=FakeLinkedInApiClient(),
        connections_repo=FakeConnectionsRepo(),
        publications_repo=FakePublicationsRepo(),
        generations_repo=FakeGenerationsRepo(status="approval_required", format_type="linkedin"),
        activity_logger=FakeActivityLogger(),
        redirect_uri="http://localhost:3000/integrations/linkedin/callback",
    )

    try:
        asyncio.run(service.publish(user_id="user-1", generation_id="gen-1"))
    except ValueError as exc:
        assert str(exc) == "Invalid status transition"
    else:
        raise AssertionError("Expected invalid transition error")


def test_linkedin_publish_rejects_non_linkedin_format() -> None:
    service = LinkedInService(
        linkedin_api_client=FakeLinkedInApiClient(),
        connections_repo=FakeConnectionsRepo(),
        publications_repo=FakePublicationsRepo(),
        generations_repo=FakeGenerationsRepo(status="approved", format_type="founder_update"),
        activity_logger=FakeActivityLogger(),
        redirect_uri="http://localhost:3000/integrations/linkedin/callback",
    )

    try:
        asyncio.run(service.publish(user_id="user-1", generation_id="gen-1"))
    except ValueError as exc:
        assert str(exc) == "LinkedIn publish supports linkedin format only"
    else:
        raise AssertionError("Expected format guard error")


def test_linkedin_publish_updates_generation_and_logs_events() -> None:
    connections_repo = FakeConnectionsRepo()
    connections_repo.row = {
        "user_id": "user-1",
        "connection_status": "connected",
        "access_token": "li-token",
        "linkedin_member_urn": "urn:li:person:member-1",
        "connected_at": "2026-05-11T13:00:00Z",
    }
    generations_repo = FakeGenerationsRepo(status="approved", format_type="linkedin")
    publications_repo = FakePublicationsRepo()
    activity_logger = FakeActivityLogger()
    service = LinkedInService(
        linkedin_api_client=FakeLinkedInApiClient(),
        connections_repo=connections_repo,
        publications_repo=publications_repo,
        generations_repo=generations_repo,
        activity_logger=activity_logger,
        redirect_uri="http://localhost:3000/integrations/linkedin/callback",
    )

    result = asyncio.run(service.publish(user_id="user-1", generation_id="gen-1"))

    assert result["status"] == "published"
    assert result["channel"] == "linkedin"
    assert generations_repo.updated_to == "published"
    assert publications_repo.rows[0]["status"] == "published"
    assert any(event["event_type"] == "content_published" for event in activity_logger.events)


def test_linkedin_publish_logs_failure_and_keeps_generation_not_published() -> None:
    connections_repo = FakeConnectionsRepo()
    connections_repo.row = {
        "user_id": "user-1",
        "connection_status": "connected",
        "access_token": "li-token",
        "linkedin_member_urn": "urn:li:person:member-1",
        "connected_at": "2026-05-11T13:00:00Z",
    }
    generations_repo = FakeGenerationsRepo(status="approved", format_type="linkedin")
    publications_repo = FakePublicationsRepo()
    activity_logger = FakeActivityLogger()
    service = LinkedInService(
        linkedin_api_client=FailingLinkedInApiClient(),
        connections_repo=connections_repo,
        publications_repo=publications_repo,
        generations_repo=generations_repo,
        activity_logger=activity_logger,
        redirect_uri="http://localhost:3000/integrations/linkedin/callback",
    )

    try:
        asyncio.run(service.publish(user_id="user-1", generation_id="gen-1"))
    except RuntimeError as exc:
        assert str(exc) == "LinkedIn publish unavailable"
    else:
        raise AssertionError("Expected publish failure")

    assert generations_repo.updated_to is None
    assert publications_repo.rows[0]["status"] == "failed"
    assert any(event["event_type"] == "linkedin_publish_failed" for event in activity_logger.events)


def test_linkedin_publish_attaches_generated_image_when_prompt_available() -> None:
    connections_repo = FakeConnectionsRepo()
    connections_repo.row = {
        "user_id": "user-1",
        "connection_status": "connected",
        "access_token": "li-token",
        "linkedin_member_urn": "urn:li:person:member-1",
        "connected_at": "2026-05-11T13:00:00Z",
    }
    generations_repo = FakeGenerationsRepo(status="approved", format_type="linkedin", image_prompt="A startup product hero scene")
    publications_repo = FakePublicationsRepo()
    activity_logger = FakeActivityLogger()
    linkedin_client = FakeLinkedInApiClient()
    image_service = FakeImageService()
    service = LinkedInService(
        linkedin_api_client=linkedin_client,
        connections_repo=connections_repo,
        publications_repo=publications_repo,
        generations_repo=generations_repo,
        activity_logger=activity_logger,
        image_service=image_service,
        redirect_uri="http://localhost:3000/integrations/linkedin/callback",
    )

    result = asyncio.run(service.publish(user_id="user-1", generation_id="gen-1"))

    assert result["status"] == "published"
    assert len(image_service.prompts) == 1
    assert linkedin_client.last_image_size > 0
    assert linkedin_client.last_image_content_type == "image/png"


def test_linkedin_publish_uses_existing_generated_preview_image_when_available() -> None:
    connections_repo = FakeConnectionsRepo()
    connections_repo.row = {
        "user_id": "user-1",
        "connection_status": "connected",
        "access_token": "li-token",
        "linkedin_member_urn": "urn:li:person:member-1",
        "connected_at": "2026-05-11T13:00:00Z",
    }
    generations_repo = FakeGenerationsRepo(
        status="approved",
        format_type="linkedin",
        image_prompt="A startup product hero scene",
        image_data_url="data:image/png;base64,ZmFrZS1wcmV2aWV3LWltYWdl",
    )
    publications_repo = FakePublicationsRepo()
    activity_logger = FakeActivityLogger()
    linkedin_client = FakeLinkedInApiClient()
    image_service = FakeImageService()
    service = LinkedInService(
        linkedin_api_client=linkedin_client,
        connections_repo=connections_repo,
        publications_repo=publications_repo,
        generations_repo=generations_repo,
        activity_logger=activity_logger,
        image_service=image_service,
        redirect_uri="http://localhost:3000/integrations/linkedin/callback",
    )

    result = asyncio.run(service.publish(user_id="user-1", generation_id="gen-1"))

    assert result["status"] == "published"
    assert len(image_service.prompts) == 0
    assert linkedin_client.last_image_size > 0
    assert linkedin_client.last_image_content_type == "image/png"


def test_linkedin_publish_sanitizes_markdown_before_publishing() -> None:
    connections_repo = FakeConnectionsRepo()
    connections_repo.row = {
        "user_id": "user-1",
        "connection_status": "connected",
        "access_token": "li-token",
        "linkedin_member_urn": "urn:li:person:member-1",
        "connected_at": "2026-05-11T13:00:00Z",
    }
    generations_repo = FakeGenerationsRepo(
        status="approved",
        format_type="linkedin",
        content="**Launch update**\n\nWe shipped _memory_ and `voice` workflows.",
    )
    publications_repo = FakePublicationsRepo()
    activity_logger = FakeActivityLogger()
    linkedin_client = FakeLinkedInApiClient()
    service = LinkedInService(
        linkedin_api_client=linkedin_client,
        connections_repo=connections_repo,
        publications_repo=publications_repo,
        generations_repo=generations_repo,
        activity_logger=activity_logger,
        redirect_uri="http://localhost:3000/integrations/linkedin/callback",
    )

    result = asyncio.run(service.publish(user_id="user-1", generation_id="gen-1"))

    assert result["status"] == "published"
    assert linkedin_client.last_content == "Launch update\n\nWe shipped memory and voice workflows."
