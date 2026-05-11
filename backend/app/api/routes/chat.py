import json
import re
from typing import AsyncGenerator

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from backend.app.services.chat_orchestrator import ChatOrchestrator


router = APIRouter(prefix="/chat", tags=["chat"])


class ChatHistoryTurn(BaseModel):
    role: str = Field(pattern="^(user|assistant)$")
    content: str = Field(min_length=1, max_length=4000)


class ChatQueryRequest(BaseModel):
    query: str = Field(min_length=2)
    agent_type: str = Field(default="executive", min_length=2, max_length=32)
    history: list[ChatHistoryTurn] = Field(default_factory=list, max_length=24)
    top_k: int = Field(default=3, ge=1, le=10)


def get_chat_orchestrator() -> ChatOrchestrator:
    return ChatOrchestrator()


def _resolve_user_id(request: Request) -> str:
    user = getattr(request.state, "user", None)
    if isinstance(user, dict):
        return str(user.get("id") or user.get("sub") or "")
    return ""


def _event_chunk(event: dict) -> bytes:
    return (json.dumps(event, separators=(",", ":")) + "\n").encode("utf-8")


def _tokenize_text(text: str) -> list[str]:
    if not text:
        return []
    tokens = re.findall(r"\S+\s*", text)
    return tokens if tokens else [text]


@router.post("/query")
async def chat_query(
    payload: ChatQueryRequest,
    request: Request,
    orchestrator: ChatOrchestrator = Depends(get_chat_orchestrator),
) -> StreamingResponse:
    user_id = _resolve_user_id(request)
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthenticated request")

    async def event_stream() -> AsyncGenerator[bytes, None]:
        try:
            yield _event_chunk({"type": "status", "stage": "retrieving_memory"})
            memory_items = await orchestrator.retrieve_context(
                user_id=user_id,
                query=payload.query,
                top_k=payload.top_k,
            )

            yield _event_chunk({"type": "status", "stage": "generating_response"})
            generated = await orchestrator.generate_response(
                query=payload.query,
                agent_type=payload.agent_type,
                memory_items=memory_items,
                history=[turn.model_dump() for turn in payload.history],
            )

            for token in _tokenize_text(generated.response_text):
                yield _event_chunk({"type": "token", "token": token})

            yield _event_chunk({"type": "status", "stage": "preparing_output"})
            stored = await orchestrator.persist_chat(
                user_id=user_id,
                query=payload.query,
                response_text=generated.response_text,
                agent_type=payload.agent_type,
                citations=generated.citations,
            )

            yield _event_chunk({"type": "citations", "items": generated.citations})
            yield _event_chunk({
                "type": "done",
                "chat_id": stored.get("id", ""),
                "agent_type": payload.agent_type,
            })
        except RuntimeError as exc:
            yield _event_chunk({"type": "error", "detail": str(exc)})
        except Exception:
            yield _event_chunk({"type": "error", "detail": "Chat query failed"})

    return StreamingResponse(event_stream(), media_type="application/x-ndjson")
