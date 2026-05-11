import asyncio

from backend.app.services.research_agent_service import ResearchAgentService


class FakeMemoryService:
    async def search(self, *, user_id: str, query: str, top_k: int) -> list[dict]:
        return [
            {
                "text": "Founder notes highlight retention risk for week two onboarding.",
                "file_name": "founder-notes.txt",
                "source_label": "Founder Notes",
                "vector_id": "vec-1:0",
                "score": 0.93,
            }
        ]


class FakeWebSearchService:
    async def search(self, *, query: str, max_results: int) -> list[dict]:
        return [
            {
                "title": "AI startup market update",
                "url": "https://example.com/market",
                "snippet": "Investors prioritize retention and onboarding metrics in 2026.",
                "source_label": "Tavily",
                "source_type": "web",
            }
        ]


class FailingWebSearchService:
    async def search(self, *, query: str, max_results: int) -> list[dict]:
        raise RuntimeError("Web search unavailable")


class FakeChatModelService:
    async def generate_response(self, *, system_prompt: str, user_query: str, memory_context: str) -> str:
        return (
            '{"summary":"Market momentum is positive.",' 
            '"signals":["Competitors are emphasizing onboarding"],' 
            '"risks":["Retention drop in week two"],' 
            '"actions":["Run onboarding messaging test"]}'
        )


class PlainTextChatModelService:
    async def generate_response(self, *, system_prompt: str, user_query: str, memory_context: str) -> str:
        return "Retention trends are mixed. Focus on onboarding experiments."


class FakeGenerationsRepo:
    def __init__(self) -> None:
        self.rows: list[dict] = []

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
            "id": "gen-1",
            "user_id": user_id,
            "agent_type": agent_type,
            "status": status,
            "content": content,
            "output_json": output_json,
            "created_at": "2026-05-11T12:00:00Z",
        }
        self.rows.append(row)
        return row


class FakeActivitiesRepo:
    def __init__(self) -> None:
        self.rows: list[dict] = []

    async def create_activity(self, *, user_id: str, event_type: str, metadata: dict) -> dict:
        row = {
            "id": "act-1",
            "user_id": user_id,
            "event_type": event_type,
            "metadata": metadata,
            "created_at": "2026-05-11T12:00:01Z",
        }
        self.rows.append(row)
        return row


class FailingActivityLogger:
    async def log(self, *, user_id: str, event_type: str, metadata: dict) -> dict:
        raise RuntimeError("activity logger unavailable")


def test_research_service_merges_web_and_memory_sources_and_persists() -> None:
    generations_repo = FakeGenerationsRepo()
    activities_repo = FakeActivitiesRepo()
    service = ResearchAgentService(
        memory_service=FakeMemoryService(),
        web_search_service=FakeWebSearchService(),
        chat_model_service=FakeChatModelService(),
        generations_repo=generations_repo,
        activities_repo=activities_repo,
    )

    result = asyncio.run(
        service.run(
            user_id="user-1",
            query="startup competitor trends in AI copilots",
            top_k=3,
        )
    )

    assert result["generation_id"] == "gen-1"
    assert result["agent_type"] == "research"
    assert result["summary"] == "Market momentum is positive."
    assert result["signals"] == ["Competitors are emphasizing onboarding"]
    assert any(source["source_type"] == "web" for source in result["sources"])
    assert any(source["source_type"] == "memory" for source in result["sources"])

    assert len(generations_repo.rows) == 1
    assert generations_repo.rows[0]["agent_type"] == "research"
    assert len(activities_repo.rows) == 1
    assert activities_repo.rows[0]["event_type"] == "research_completed"


def test_research_service_rejects_non_research_intent() -> None:
    service = ResearchAgentService(
        memory_service=FakeMemoryService(),
        web_search_service=FakeWebSearchService(),
        chat_model_service=FakeChatModelService(),
        generations_repo=FakeGenerationsRepo(),
        activities_repo=FakeActivitiesRepo(),
    )

    try:
        asyncio.run(service.run(user_id="user-1", query="write linkedin post", top_k=3))
    except ValueError as exc:
        assert str(exc) == "Query is not research intent"
    else:
        raise AssertionError("Expected non-research query to raise ValueError")


def test_research_service_raises_when_web_unavailable() -> None:
    service = ResearchAgentService(
        memory_service=FakeMemoryService(),
        web_search_service=FailingWebSearchService(),
        chat_model_service=FakeChatModelService(),
        generations_repo=FakeGenerationsRepo(),
        activities_repo=FakeActivitiesRepo(),
    )

    try:
        asyncio.run(service.run(user_id="user-1", query="market research for onboarding", top_k=3))
    except RuntimeError as exc:
        assert str(exc) == "Web search unavailable"
    else:
        raise AssertionError("Expected web search failure to raise RuntimeError")


def test_research_service_handles_non_json_model_output() -> None:
    service = ResearchAgentService(
        memory_service=FakeMemoryService(),
        web_search_service=FakeWebSearchService(),
        chat_model_service=PlainTextChatModelService(),
        generations_repo=FakeGenerationsRepo(),
        activities_repo=FakeActivitiesRepo(),
    )

    result = asyncio.run(
        service.run(
            user_id="user-1",
            query="competitor trends and market outlook",
            top_k=3,
        )
    )

    assert result["summary"].startswith("Retention trends")
    assert result["signals"] == []
    assert result["risks"] == []
    assert result["actions"] == []


def test_research_service_still_returns_result_when_activity_logging_fails() -> None:
    service = ResearchAgentService(
        memory_service=FakeMemoryService(),
        web_search_service=FakeWebSearchService(),
        chat_model_service=FakeChatModelService(),
        generations_repo=FakeGenerationsRepo(),
        activity_logger=FailingActivityLogger(),
    )

    result = asyncio.run(
        service.run(
            user_id="user-1",
            query="startup competitor trends in AI copilots",
            top_k=3,
        )
    )

    assert result["agent_type"] == "research"
    assert result["summary"] == "Market momentum is positive."
