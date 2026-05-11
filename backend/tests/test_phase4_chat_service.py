import asyncio

from backend.app.services.chat_orchestrator import ChatOrchestrator


class FakeMemoryService:
    async def search(self, *, user_id: str, query: str, top_k: int) -> list[dict]:
        return [
            {
                "text": "Founder notes mention onboarding milestones and launch sequencing.",
                "file_name": "founder-notes.txt",
                "source_label": "Founder Notes",
                "vector_id": "vec-1:0",
                "score": 0.92,
            },
            {
                "text": "Roadmap suggests ship checklist before external campaign.",
                "file_name": "roadmap.txt",
                "source_label": "Product Roadmap",
                "vector_id": "vec-2:0",
                "score": 0.87,
            },
        ]


class EmptyMemoryService:
    async def search(self, *, user_id: str, query: str, top_k: int) -> list[dict]:
        return []


class FakeChatModelService:
    def __init__(self) -> None:
        self.calls: list[dict] = []

    async def generate_response(
        self,
        *,
        system_prompt: str,
        user_query: str,
        memory_context: str,
        conversation_context: str = "",
    ) -> str:
        self.calls.append(
            {
                "system_prompt": system_prompt,
                "user_query": user_query,
                "memory_context": memory_context,
                "conversation_context": conversation_context,
            }
        )
        return "Here is a practical summary grounded in your uploaded notes."


class FakeChatsRepo:
    def __init__(self) -> None:
        self.persisted: list[dict] = []

    async def create_chat(
        self,
        *,
        user_id: str,
        query: str,
        response: str,
        agent_type: str,
        citations: list[dict],
    ) -> dict:
        payload = {
            "id": "chat-1",
            "user_id": user_id,
            "query": query,
            "response": response,
            "agent_type": agent_type,
            "citations": citations,
        }
        self.persisted.append(payload)
        return payload


def test_run_query_injects_memory_context_and_persists_chat() -> None:
    memory_service = FakeMemoryService()
    model_service = FakeChatModelService()
    chats_repo = FakeChatsRepo()
    orchestrator = ChatOrchestrator(
        memory_service=memory_service,
        chat_model_service=model_service,
        chats_repo=chats_repo,
    )

    result = asyncio.run(
        orchestrator.run_query(
            user_id="user-1",
            query="Summarize launch priorities",
            agent_type="executive",
            top_k=3,
        )
    )

    assert "practical summary" in result.response_text
    assert len(result.citations) == 2
    assert result.citations[0]["source_label"] == "Founder Notes"
    assert "onboarding milestones" in model_service.calls[0]["memory_context"]

    assert len(chats_repo.persisted) == 1
    assert chats_repo.persisted[0]["query"] == "Summarize launch priorities"
    assert chats_repo.persisted[0]["agent_type"] == "executive"


def test_run_query_handles_empty_memory_without_citations() -> None:
    model_service = FakeChatModelService()
    chats_repo = FakeChatsRepo()
    orchestrator = ChatOrchestrator(
        memory_service=EmptyMemoryService(),
        chat_model_service=model_service,
        chats_repo=chats_repo,
    )

    result = asyncio.run(
        orchestrator.run_query(
            user_id="user-1",
            query="Draft an investor note",
            agent_type="content",
            top_k=3,
        )
    )

    assert result.citations == []
    assert "No relevant context" in model_service.calls[0]["memory_context"]
    assert chats_repo.persisted[0]["citations"] == []


def test_generate_response_includes_recent_chat_history_context() -> None:
    model_service = FakeChatModelService()
    orchestrator = ChatOrchestrator(
        memory_service=EmptyMemoryService(),
        chat_model_service=model_service,
        chats_repo=FakeChatsRepo(),
    )

    result = asyncio.run(
        orchestrator.generate_response(
            query="Refine this response",
            agent_type="executive",
            memory_items=[],
            history=[
                {"role": "user", "content": "Draft launch priorities"},
                {"role": "assistant", "content": "Prioritize onboarding and retention."},
            ],
        )
    )

    assert "practical summary" in result.response_text
    assert "Draft launch priorities" in model_service.calls[0]["conversation_context"]
    assert "Prioritize onboarding and retention." in model_service.calls[0]["conversation_context"]
