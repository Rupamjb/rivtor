import asyncio
import json

import httpx

from backend.app.services.chat_model_service import ChatModelService


def test_chat_model_service_uses_fallback_model_when_primary_fails() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        path = str(request.url)
        if "/model/moonshotai.kimi-k2.5/converse" in path:
            return httpx.Response(403, text='{"message":"Access denied"}')
        if "/model/minimax.minimax-m2.5/converse" in path:
            return httpx.Response(
                200,
                json={
                    "output": {
                        "message": {
                            "content": [{"text": "Fallback response text"}],
                        }
                    }
                },
            )
        return httpx.Response(404, text='{"message":"Unknown model"}')

    service = ChatModelService(
        region="us-east-1",
        model_id="moonshotai.kimi-k2.5",
        fallback_model_ids=["minimax.minimax-m2.5"],
        bearer_token="bedrock-token",
        http_transport=httpx.MockTransport(handler),
    )

    result = asyncio.run(
        service.generate_response(
            system_prompt="You are FounderOS",
            user_query="Summarize founder notes",
            memory_context="[1] Founder Notes: sample",
        )
    )

    assert result == "Fallback response text"


def test_chat_model_service_raises_when_all_models_fail() -> None:
    def handler(_: httpx.Request) -> httpx.Response:
        return httpx.Response(403, text='{"message":"Access denied"}')

    service = ChatModelService(
        region="us-east-1",
        model_id="moonshotai.kimi-k2.5",
        fallback_model_ids=["minimax.minimax-m2.5", "deepseek.v3.2"],
        bearer_token="bedrock-token",
        http_transport=httpx.MockTransport(handler),
    )

    try:
        asyncio.run(
            service.generate_response(
                system_prompt="You are FounderOS",
                user_query="test",
                memory_context="none",
            )
        )
    except RuntimeError as exc:
        message = str(exc)
        assert "All Bedrock chat models failed" in message
        assert "moonshotai.kimi-k2.5" in message
        assert "minimax.minimax-m2.5" in message
        assert "deepseek.v3.2" in message
    else:
        raise AssertionError("Expected all model fallbacks to fail")
