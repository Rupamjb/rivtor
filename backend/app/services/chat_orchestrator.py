from dataclasses import dataclass
from typing import Any, Optional

try:
    from langgraph.graph import END, START, StateGraph
except Exception:  # pragma: no cover
    StateGraph = None
    START = "START"
    END = "END"

from backend.app.core.config import get_settings
from backend.app.services.chat_model_service import ChatModelService
from backend.app.services.chats_repo import ChatsRepository
from backend.app.services.memory_service import MemoryService


@dataclass
class ChatRunResult:
    response_text: str
    citations: list[dict]


class ChatFlowState(dict):
    user_id: str
    query: str
    agent_type: str
    top_k: int
    memory_items: list[dict]
    response_text: str
    citations: list[dict]


class ChatOrchestrator:
    def __init__(
        self,
        *,
        memory_service: Optional[MemoryService] = None,
        chat_model_service: Optional[ChatModelService] = None,
        chats_repo: Optional[ChatsRepository] = None,
    ) -> None:
        settings = get_settings()
        fallback_models = [
            model_id.strip()
            for model_id in settings.bedrock_chat_fallback_models.split(",")
            if model_id.strip()
        ]
        self._memory_service = memory_service or MemoryService()
        self._chat_model_service = chat_model_service or ChatModelService(
            region=settings.aws_region,
            model_id=settings.bedrock_chat_model,
            fallback_model_ids=fallback_models,
            bearer_token=settings.aws_bearer_token_bedrock,
        )
        self._chats_repo = chats_repo or ChatsRepository(
            supabase_url=settings.supabase_url,
            service_role_key=settings.supabase_service_role_key,
        )
        self._graph_app = self._build_graph_app()

    def _build_graph_app(self) -> Any:
        if StateGraph is None:
            return None

        graph = StateGraph(ChatFlowState)
        graph.add_node("retrieve_context", self._graph_retrieve_context)
        graph.add_node("generate_response", self._graph_generate_response)
        graph.add_node("persist_chat", self._graph_persist_chat)
        graph.add_edge(START, "retrieve_context")
        graph.add_edge("retrieve_context", "generate_response")
        graph.add_edge("generate_response", "persist_chat")
        graph.add_edge("persist_chat", END)
        return graph.compile()

    async def _graph_retrieve_context(self, state: ChatFlowState) -> dict:
        memory_items = await self.retrieve_context(
            user_id=state["user_id"],
            query=state["query"],
            top_k=state["top_k"],
        )
        return {"memory_items": memory_items}

    async def _graph_generate_response(self, state: ChatFlowState) -> dict:
        run_result = await self.generate_response(
            query=state["query"],
            agent_type=state["agent_type"],
            memory_items=state.get("memory_items", []),
        )
        return {
            "response_text": run_result.response_text,
            "citations": run_result.citations,
        }

    async def _graph_persist_chat(self, state: ChatFlowState) -> dict:
        await self.persist_chat(
            user_id=state["user_id"],
            query=state["query"],
            response_text=state.get("response_text", ""),
            agent_type=state["agent_type"],
            citations=state.get("citations", []),
        )
        return {}

    @staticmethod
    def _build_conversation_context(history: list[dict]) -> str:
        if not history:
            return "No prior conversation available."

        lines: list[str] = []
        for item in history[-12:]:
            role = str(item.get("role") or "").strip().lower()
            content = str(item.get("content") or "").strip()
            if role not in {"user", "assistant"} or not content:
                continue
            prefix = "User" if role == "user" else "Assistant"
            lines.append(f"{prefix}: {content}")

        return "\n".join(lines) if lines else "No prior conversation available."

    @staticmethod
    def _build_memory_context(memory_items: list[dict]) -> str:
        if not memory_items:
            return "No relevant context available."

        lines = []
        for index, item in enumerate(memory_items, start=1):
            source_label = item.get("source_label") or "Founder Notes"
            file_name = item.get("file_name") or "unknown"
            snippet = (item.get("text") or "").strip().replace("\n", " ")
            lines.append(f"[{index}] {source_label} ({file_name}): {snippet}")
        return "\n".join(lines)

    @staticmethod
    def _build_citations(memory_items: list[dict]) -> list[dict]:
        citations: list[dict] = []
        seen: set[tuple[str, str, str]] = set()

        for item in memory_items:
            source_label = str(item.get("source_label") or "Founder Notes")
            file_name = str(item.get("file_name") or "")
            vector_id = str(item.get("vector_id") or "")
            key = (source_label, file_name, vector_id)
            if key in seen:
                continue
            seen.add(key)

            citations.append(
                {
                    "source_label": source_label,
                    "file_name": file_name,
                    "vector_id": vector_id,
                    "score": item.get("score"),
                    "text_excerpt": str(item.get("text") or "")[:180],
                }
            )
        return citations

    async def retrieve_context(self, *, user_id: str, query: str, top_k: int) -> list[dict]:
        return await self._memory_service.search(user_id=user_id, query=query, top_k=top_k)

    async def generate_response(
        self,
        *,
        query: str,
        agent_type: str,
        memory_items: list[dict],
        history: Optional[list[dict]] = None,
    ) -> ChatRunResult:
        system_prompt = (
            "You are FounderOS, an operational AI copilot for startup founders. "
            "Use retrieved company memory context to ground your answer and keep responses practical, concise, and actionable."
        )
        memory_context = self._build_memory_context(memory_items)
        conversation_context = self._build_conversation_context(history or [])
        response_text = await self._chat_model_service.generate_response(
            system_prompt=system_prompt,
            user_query=f"[{agent_type}] {query}",
            memory_context=memory_context,
            conversation_context=conversation_context,
        )
        citations = self._build_citations(memory_items)
        return ChatRunResult(response_text=response_text, citations=citations)

    async def persist_chat(
        self,
        *,
        user_id: str,
        query: str,
        response_text: str,
        agent_type: str,
        citations: list[dict],
    ) -> dict:
        return await self._chats_repo.create_chat(
            user_id=user_id,
            query=query,
            response=response_text,
            agent_type=agent_type,
            citations=citations,
        )

    async def run_query(
        self,
        *,
        user_id: str,
        query: str,
        agent_type: str,
        top_k: int,
    ) -> ChatRunResult:
        if self._graph_app is None:
            memory_items = await self.retrieve_context(user_id=user_id, query=query, top_k=top_k)
            run_result = await self.generate_response(
                query=query,
                agent_type=agent_type,
                memory_items=memory_items,
            )
            await self.persist_chat(
                user_id=user_id,
                query=query,
                response_text=run_result.response_text,
                agent_type=agent_type,
                citations=run_result.citations,
            )
            return run_result

        result = await self._graph_app.ainvoke(
            {
                "user_id": user_id,
                "query": query,
                "agent_type": agent_type,
                "top_k": top_k,
                "memory_items": [],
                "response_text": "",
                "citations": [],
            }
        )

        return ChatRunResult(
            response_text=str(result.get("response_text") or ""),
            citations=list(result.get("citations") or []),
        )
