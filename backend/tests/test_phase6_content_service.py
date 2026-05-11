import asyncio
from typing import Optional

from backend.app.services.content_agent_service import ContentAgentService


class FakeMemoryService:
    async def search(self, *, user_id: str, query: str, top_k: int) -> list[dict]:
        return [
            {
                "text": "Founder notes mention onboarding milestones and launch CTA strategy.",
                "file_name": "founder-notes.txt",
                "source_label": "Founder Notes",
                "vector_id": "vec-1:0",
                "score": 0.93,
            }
        ]


class FakeGenerationsRepo:
    def __init__(self) -> None:
        self.created: list[dict] = []

    async def list_generations(self, *, user_id: str, limit: int = 20, agent_type: Optional[str] = None) -> list[dict]:
        return [
            {
                "id": "gen-r1",
                "agent_type": "research",
                "status": "completed",
                "content": "Research summary",
                "output_json": {
                    "summary": "Competitors focus on fast onboarding loops.",
                    "signals": ["Weekly founder-led updates perform better"],
                },
                "created_at": "2026-05-11T10:00:00Z",
            }
        ]

    async def create_generation(
        self,
        *,
        user_id: str,
        agent_type: str,
        status: str,
        content: str,
        output_json: dict,
    ) -> dict:
        row = {
            "id": "gen-c1",
            "user_id": user_id,
            "agent_type": agent_type,
            "status": status,
            "content": content,
            "output_json": output_json,
            "created_at": "2026-05-11T12:00:00Z",
        }
        self.created.append(row)
        return row


class EmptyResearchRepo(FakeGenerationsRepo):
    async def list_generations(self, *, user_id: str, limit: int = 20, agent_type: Optional[str] = None) -> list[dict]:
        return []


class FakeActivitiesRepo:
    def __init__(self) -> None:
        self.events: list[dict] = []

    async def create_activity(self, *, user_id: str, event_type: str, metadata: dict) -> dict:
        row = {
            "id": "act-1",
            "user_id": user_id,
            "event_type": event_type,
            "metadata": metadata,
            "created_at": "2026-05-11T12:00:01Z",
        }
        self.events.append(row)
        return row


class FailingActivityLogger:
    async def log(self, *, user_id: str, event_type: str, metadata: dict) -> dict:
        raise RuntimeError("activity logger unavailable")


class JsonChatModelService:
    async def generate_response(self, *, system_prompt: str, user_query: str, memory_context: str) -> str:
        return (
            '{"title":"FounderOS Launch Update",'
            '"draft":"We shipped onboarding improvements and validated founder traction.",'
            '"context_labels":["Founder Notes","Research Summary"]}'
        )


class PlainTextChatModelService:
    async def generate_response(self, *, system_prompt: str, user_query: str, memory_context: str) -> str:
        return "Launch update draft with concise founder narrative."


class MarkdownChatModelService:
    async def generate_response(self, *, system_prompt: str, user_query: str, memory_context: str) -> str:
        return (
            '{"title":"**FounderOS** #Launch",'
            '"draft":"**Big update**\\n\\nWe shipped _memory_ and `voice` workflows.",'
            '"context_labels":["Founder Notes"]}'
        )


class PromptCaptureChatModelService:
    def __init__(self) -> None:
        self.last_system_prompt = ""

    async def generate_response(self, *, system_prompt: str, user_query: str, memory_context: str) -> str:
        self.last_system_prompt = system_prompt
        return '{"title":"Founder Update","draft":"Plain output","context_labels":[]}'


class FakeImageService:
    def __init__(self) -> None:
        self.prompts: list[str] = []

    def is_configured(self) -> bool:
        return True

    async def generate_image_data_url(self, *, prompt: str, size: str = "1024x1024") -> dict:
        self.prompts.append(prompt)
        return {
            "data_url": "data:image/png;base64,ZmFrZS1pbWFnZQ==",
            "mime_type": "image/png",
        }


def test_content_service_generates_approval_required_draft_with_context_labels() -> None:
    generations_repo = FakeGenerationsRepo()
    activities_repo = FakeActivitiesRepo()
    service = ContentAgentService(
        memory_service=FakeMemoryService(),
        generations_repo=generations_repo,
        activities_repo=activities_repo,
        chat_model_service=JsonChatModelService(),
    )

    result = asyncio.run(
        service.run(
            user_id="user-1",
            query="write a linkedin launch post",
            format_type="linkedin",
            tone="professional",
            length="medium",
            top_k=3,
        )
    )

    assert result["agent_type"] == "content"
    assert result["status"] == "approval_required"
    assert result["approval_required"] is True
    assert result["title"] == "FounderOS Launch Update"
    assert "Founder Notes" in result["context_labels"]
    assert "Research Summary" in result["context_labels"]
    assert len(result["sources"]) >= 2

    assert len(generations_repo.created) == 1
    assert generations_repo.created[0]["status"] == "approval_required"
    assert len(activities_repo.events) == 1
    assert activities_repo.events[0]["event_type"] == "content_draft_created"


def test_content_service_rejects_non_content_intent() -> None:
    service = ContentAgentService(
        memory_service=FakeMemoryService(),
        generations_repo=FakeGenerationsRepo(),
        activities_repo=FakeActivitiesRepo(),
        chat_model_service=JsonChatModelService(),
    )

    try:
        asyncio.run(
            service.run(
                user_id="user-1",
                query="market trends for ai copilots",
                format_type="linkedin",
                tone="professional",
                length="medium",
                top_k=3,
            )
        )
    except ValueError as exc:
        assert str(exc) == "Query is not content intent"
    else:
        raise AssertionError("Expected non-content query to raise ValueError")


def test_content_service_handles_plain_text_model_output() -> None:
    service = ContentAgentService(
        memory_service=FakeMemoryService(),
        generations_repo=EmptyResearchRepo(),
        activities_repo=FakeActivitiesRepo(),
        chat_model_service=PlainTextChatModelService(),
    )

    result = asyncio.run(
        service.run(
            user_id="user-1",
            query="generate founder update draft",
            format_type="founder_update",
            tone="insightful",
            length="short",
            top_k=3,
        )
    )

    assert result["title"] == "Founder Update Draft"
    assert result["draft"].startswith("Launch update")
    assert result["context_labels"] == ["Founder Notes"]


def test_content_service_still_returns_draft_when_activity_logging_fails() -> None:
    service = ContentAgentService(
        memory_service=FakeMemoryService(),
        generations_repo=FakeGenerationsRepo(),
        chat_model_service=JsonChatModelService(),
        activity_logger=FailingActivityLogger(),
    )

    result = asyncio.run(
        service.run(
            user_id="user-1",
            query="write a linkedin launch post",
            format_type="linkedin",
            tone="professional",
            length="medium",
            top_k=3,
        )
    )

    assert result["agent_type"] == "content"
    assert result["status"] == "approval_required"


def test_content_service_supports_x_post_format() -> None:
    service = ContentAgentService(
        memory_service=FakeMemoryService(),
        generations_repo=EmptyResearchRepo(),
        activities_repo=FakeActivitiesRepo(),
        chat_model_service=PlainTextChatModelService(),
    )

    result = asyncio.run(
        service.run(
            user_id="user-1",
            query="write a tweet for our launch",
            format_type="x_post",
            tone="bold",
            length="short",
            top_k=3,
        )
    )

    assert result["format"] == "x_post"
    assert result["title"] == "X Post Draft"


def test_content_service_supports_blog_outline_format() -> None:
    service = ContentAgentService(
        memory_service=FakeMemoryService(),
        generations_repo=EmptyResearchRepo(),
        activities_repo=FakeActivitiesRepo(),
        chat_model_service=PlainTextChatModelService(),
    )

    result = asyncio.run(
        service.run(
            user_id="user-1",
            query="generate a blog outline about founder-led growth",
            format_type="blog_outline",
            tone="insightful",
            length="medium",
            top_k=3,
        )
    )

    assert result["format"] == "blog_outline"
    assert result["title"] == "Blog Outline Draft"


def test_content_service_generates_linkedin_image_preview_when_image_service_configured() -> None:
    generations_repo = FakeGenerationsRepo()
    image_service = FakeImageService()
    service = ContentAgentService(
        memory_service=FakeMemoryService(),
        generations_repo=generations_repo,
        activities_repo=FakeActivitiesRepo(),
        chat_model_service=JsonChatModelService(),
        image_service=image_service,
    )

    result = asyncio.run(
        service.run(
            user_id="user-1",
            query="write a linkedin launch post",
            format_type="linkedin",
            tone="professional",
            length="medium",
            top_k=3,
        )
    )

    assert result["image_data_url"].startswith("data:image/png;base64,")
    assert len(image_service.prompts) == 1
    assert generations_repo.created[0]["output_json"]["image_prompt"] != ""


def test_content_service_skips_image_generation_when_disabled() -> None:
    generations_repo = FakeGenerationsRepo()
    image_service = FakeImageService()
    service = ContentAgentService(
        memory_service=FakeMemoryService(),
        generations_repo=generations_repo,
        activities_repo=FakeActivitiesRepo(),
        chat_model_service=JsonChatModelService(),
        image_service=image_service,
    )

    result = asyncio.run(
        service.run(
            user_id="user-1",
            query="write a linkedin launch post",
            format_type="linkedin",
            tone="professional",
            length="medium",
            top_k=3,
            generate_image=False,
        )
    )

    assert result.get("image_data_url", "") == ""
    assert result.get("image_requested") is False
    assert result.get("image_error", "") == ""
    assert len(image_service.prompts) == 0


def test_content_service_sanitizes_markdown_from_model_output() -> None:
    generations_repo = FakeGenerationsRepo()
    service = ContentAgentService(
        memory_service=FakeMemoryService(),
        generations_repo=generations_repo,
        activities_repo=FakeActivitiesRepo(),
        chat_model_service=MarkdownChatModelService(),
    )

    result = asyncio.run(
        service.run(
            user_id="user-1",
            query="write a linkedin launch post",
            format_type="linkedin",
            tone="professional",
            length="medium",
            top_k=3,
        )
    )

    assert result["title"] == "FounderOS Launch"
    assert result["draft"] == "Big update\n\nWe shipped memory and voice workflows."
    assert generations_repo.created[0]["output_json"]["title"] == "FounderOS Launch"
    assert generations_repo.created[0]["output_json"]["draft"] == "Big update\n\nWe shipped memory and voice workflows."


def test_content_service_prompt_forces_plain_text_output() -> None:
    chat_model = PromptCaptureChatModelService()
    service = ContentAgentService(
        memory_service=FakeMemoryService(),
        generations_repo=FakeGenerationsRepo(),
        activities_repo=FakeActivitiesRepo(),
        chat_model_service=chat_model,
    )

    asyncio.run(
        service.run(
            user_id="user-1",
            query="write a linkedin launch post",
            format_type="linkedin",
            tone="professional",
            length="medium",
            top_k=3,
        )
    )

    assert "Return plain text only" in chat_model.last_system_prompt
