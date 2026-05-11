import asyncio
import json

import httpx

from backend.app.services.web_search_service import WebSearchService


def test_web_search_service_falls_back_to_serper_when_tavily_fails() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        url = str(request.url)
        if "api.tavily.com/search" in url:
            return httpx.Response(503, json={"detail": "unavailable"})
        if "google.serper.dev/search" in url:
            return httpx.Response(
                200,
                json={
                    "organic": [
                        {
                            "title": "Competitor report",
                            "link": "https://example.com/competitor",
                            "snippet": "Competitors increase onboarding spend.",
                        }
                    ]
                },
            )
        return httpx.Response(404, json={})

    service = WebSearchService(
        provider="tavily",
        tavily_api_key="t-key",
        serper_api_key="s-key",
        client=httpx.AsyncClient(transport=httpx.MockTransport(handler)),
    )

    try:
        results = asyncio.run(service.search(query="competitor trends", max_results=3))
    finally:
        asyncio.run(service._client.aclose())

    assert len(results) == 1
    assert results[0]["source_label"] == "Serper"


def test_web_search_service_raises_when_both_providers_fail() -> None:
    def handler(_: httpx.Request) -> httpx.Response:
        return httpx.Response(503, json={"detail": "down"})

    service = WebSearchService(
        provider="serper",
        tavily_api_key="t-key",
        serper_api_key="s-key",
        client=httpx.AsyncClient(transport=httpx.MockTransport(handler)),
    )

    try:
        try:
            asyncio.run(service.search(query="market trends", max_results=3))
        except RuntimeError as exc:
            assert str(exc) == "Web search unavailable"
        else:
            raise AssertionError("Expected both-provider failure")
    finally:
        asyncio.run(service._client.aclose())
