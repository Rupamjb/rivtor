from typing import Optional

from backend.app.services.chat_orchestrator import ChatOrchestrator


class ExecutiveAgentService:
    def __init__(self, *, chat_orchestrator: Optional[ChatOrchestrator] = None) -> None:
        self._chat_orchestrator = chat_orchestrator or ChatOrchestrator()

    async def run(self, *, user_id: str, query: str, top_k: int) -> dict:
        result = await self._chat_orchestrator.run_query(
            user_id=user_id,
            query=query,
            agent_type="executive",
            top_k=top_k,
        )

        return {
            "agent_type": "executive",
            "query": query,
            "response": result.response_text,
            "citations": result.citations,
        }
