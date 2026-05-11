from typing import Optional

import httpx


class WebSearchService:
    def __init__(
        self,
        *,
        provider: str,
        tavily_api_key: str,
        serper_api_key: str,
        client: Optional[httpx.AsyncClient] = None,
    ) -> None:
        self._provider = (provider or "tavily").strip().lower()
        self._tavily_api_key = tavily_api_key.strip()
        self._serper_api_key = serper_api_key.strip()
        self._client = client

    async def _search_tavily(self, *, query: str, max_results: int) -> list[dict]:
        if not self._tavily_api_key:
            raise RuntimeError("Tavily key missing")

        payload = {
            "api_key": self._tavily_api_key,
            "query": query,
            "max_results": max_results,
            "search_depth": "basic",
        }

        if self._client is not None:
            response = await self._client.post("https://api.tavily.com/search", json=payload)
        else:
            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.post("https://api.tavily.com/search", json=payload)

        if response.status_code >= 500:
            raise RuntimeError("Tavily search failed")
        if response.status_code >= 400:
            raise RuntimeError("Tavily search failed")

        data = response.json()
        items = data.get("results", []) if isinstance(data, dict) else []
        normalized: list[dict] = []
        for item in items:
            if not isinstance(item, dict):
                continue
            normalized.append(
                {
                    "title": str(item.get("title") or "Web result"),
                    "url": str(item.get("url") or ""),
                    "snippet": str(item.get("content") or "").strip(),
                    "source_label": "Tavily",
                    "source_type": "web",
                }
            )
        return normalized

    async def _search_serper(self, *, query: str, max_results: int) -> list[dict]:
        if not self._serper_api_key:
            raise RuntimeError("Serper key missing")

        headers = {
            "X-API-KEY": self._serper_api_key,
            "Content-Type": "application/json",
        }
        payload = {
            "q": query,
            "num": max_results,
        }

        if self._client is not None:
            response = await self._client.post("https://google.serper.dev/search", headers=headers, json=payload)
        else:
            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.post("https://google.serper.dev/search", headers=headers, json=payload)

        if response.status_code >= 500:
            raise RuntimeError("Serper search failed")
        if response.status_code >= 400:
            raise RuntimeError("Serper search failed")

        data = response.json()
        organic = data.get("organic", []) if isinstance(data, dict) else []
        normalized: list[dict] = []
        for item in organic:
            if not isinstance(item, dict):
                continue
            normalized.append(
                {
                    "title": str(item.get("title") or "Web result"),
                    "url": str(item.get("link") or ""),
                    "snippet": str(item.get("snippet") or "").strip(),
                    "source_label": "Serper",
                    "source_type": "web",
                }
            )
        return normalized

    async def search(self, *, query: str, max_results: int = 5) -> list[dict]:
        query_text = query.strip()
        if not query_text:
            return []

        capped_results = max(1, min(max_results, 10))
        providers = ["tavily", "serper"] if self._provider != "serper" else ["serper", "tavily"]

        errors: list[str] = []
        for provider in providers:
            try:
                if provider == "tavily":
                    return await self._search_tavily(query=query_text, max_results=capped_results)
                return await self._search_serper(query=query_text, max_results=capped_results)
            except RuntimeError as exc:
                errors.append(f"{provider}: {exc}")
                continue

        raise RuntimeError("Web search unavailable")
