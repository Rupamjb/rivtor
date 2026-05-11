import json
import re
from typing import Optional

from backend.app.services.activity_logger import ActivityLogger
from backend.app.core.config import get_settings
from backend.app.services.activities_repo import ActivitiesRepository
from backend.app.services.chat_model_service import ChatModelService
from backend.app.services.generations_repo import GenerationsRepository
from backend.app.services.memory_service import MemoryService
from backend.app.services.web_search_service import WebSearchService


RESEARCH_KEYWORDS = ("trends", "competitors", "research", "market", "startup news")


class ResearchAgentService:
    def __init__(
        self,
        *,
        memory_service: Optional[MemoryService] = None,
        web_search_service: Optional[WebSearchService] = None,
        chat_model_service: Optional[ChatModelService] = None,
        generations_repo: Optional[GenerationsRepository] = None,
        activities_repo: Optional[ActivitiesRepository] = None,
        activity_logger: Optional[ActivityLogger] = None,
    ) -> None:
        settings = get_settings()
        fallback_models = [
            model_id.strip()
            for model_id in settings.bedrock_chat_fallback_models.split(",")
            if model_id.strip()
        ]
        self._memory_service = memory_service or MemoryService()
        self._web_search_service = web_search_service or WebSearchService(
            provider=settings.search_provider,
            tavily_api_key=settings.tavily_api_key,
            serper_api_key=settings.serper_api_key,
        )
        self._chat_model_service = chat_model_service or ChatModelService(
            region=settings.aws_region,
            model_id=settings.bedrock_chat_model,
            fallback_model_ids=fallback_models,
            bearer_token=settings.aws_bearer_token_bedrock,
        )
        self._generations_repo = generations_repo or GenerationsRepository(
            supabase_url=settings.supabase_url,
            service_role_key=settings.supabase_service_role_key,
        )
        self._activity_logger = activity_logger
        if not self._activity_logger:
            self._activity_logger = ActivityLogger(
                activities_repo=activities_repo
                or ActivitiesRepository(
                    supabase_url=settings.supabase_url,
                    service_role_key=settings.supabase_service_role_key,
                )
            )

    @staticmethod
    def is_research_intent(query: str) -> bool:
        normalized = query.lower()
        return any(keyword in normalized for keyword in RESEARCH_KEYWORDS)

    @staticmethod
    def _memory_sources(memory_items: list[dict]) -> list[dict]:
        sources: list[dict] = []
        for item in memory_items:
            snippet = str(item.get("text") or "").strip()
            sources.append(
                {
                    "title": str(item.get("file_name") or "Memory source"),
                    "url": "",
                    "source_type": "memory",
                    "source_label": str(item.get("source_label") or "Founder Notes"),
                    "snippet": snippet,
                }
            )
        return sources

    @staticmethod
    def _parse_model_output(raw_text: str) -> dict:
        text = raw_text.strip()

        if text.startswith("```"):
            text = re.sub(r"^```(?:json)?\s*", "", text)
            text = re.sub(r"\s*```$", "", text)

        try:
            parsed = json.loads(text)
            if isinstance(parsed, dict):
                summary = str(parsed.get("summary") or "").strip()
                signals = parsed.get("signals") if isinstance(parsed.get("signals"), list) else []
                risks = parsed.get("risks") if isinstance(parsed.get("risks"), list) else []
                actions = parsed.get("actions") if isinstance(parsed.get("actions"), list) else []

                return {
                    "summary": summary,
                    "signals": [str(value) for value in signals],
                    "risks": [str(value) for value in risks],
                    "actions": [str(value) for value in actions],
                }
        except json.JSONDecodeError:
            pass

        return {
            "summary": raw_text.strip(),
            "signals": [],
            "risks": [],
            "actions": [],
        }

    async def run(self, *, user_id: str, query: str, top_k: int) -> dict:
        if not self.is_research_intent(query):
            raise ValueError("Query is not research intent")

        memory_items = await self._memory_service.search(user_id=user_id, query=query, top_k=top_k)
        web_items = await self._web_search_service.search(query=query, max_results=5)

        memory_sources = self._memory_sources(memory_items)
        all_sources = [*web_items, *memory_sources]

        memory_context_lines = []
        for item in memory_items:
            memory_context_lines.append(
                f"Memory [{item.get('source_label') or 'Founder Notes'} | {item.get('file_name') or 'unknown'}]: {str(item.get('text') or '').strip()}"
            )
        for item in web_items:
            memory_context_lines.append(
                f"Web [{item.get('source_label') or 'Web'} | {item.get('title') or 'result'} | {item.get('url') or ''}]: {str(item.get('snippet') or '').strip()}"
            )
        merged_context = "\n".join(memory_context_lines).strip()

        system_prompt = (
            "You are FounderOS Research Agent. Return STRICT JSON with keys: summary (string), "
            "signals (array of strings), risks (array of strings), actions (array of strings). "
            "Use concise executive language."
        )
        raw_output = await self._chat_model_service.generate_response(
            system_prompt=system_prompt,
            user_query=query,
            memory_context=merged_context or "No merged context available.",
        )
        structured = self._parse_model_output(raw_output)

        output_json = {
            "query": query,
            "summary": structured["summary"],
            "signals": structured["signals"],
            "risks": structured["risks"],
            "actions": structured["actions"],
            "sources": all_sources,
        }

        generation = await self._generations_repo.create_generation(
            user_id=user_id,
            agent_type="research",
            status="completed",
            content=structured["summary"],
            output_json=output_json,
        )

        try:
            await self._activity_logger.log(
                user_id=user_id,
                event_type="research_completed",
                metadata={
                    "generation_id": generation.get("id", ""),
                    "query": query,
                    "agent_type": "research",
                },
            )
        except Exception:
            pass

        return {
            "generation_id": generation.get("id", ""),
            "agent_type": "research",
            "query": query,
            "summary": structured["summary"],
            "signals": structured["signals"],
            "risks": structured["risks"],
            "actions": structured["actions"],
            "sources": all_sources,
            "created_at": generation.get("created_at", ""),
        }

    @staticmethod
    def _parse_radar_output(raw_text: str) -> dict:
        text = raw_text.strip()
        if text.startswith("```"):
            text = re.sub(r"^```(?:json)?\s*", "", text)
            text = re.sub(r"\s*```$", "", text)

        try:
            parsed = json.loads(text)
            if isinstance(parsed, dict):
                items = parsed.get("items") if isinstance(parsed.get("items"), list) else []
                suggested_action = str(parsed.get("suggested_action") or "").strip()
                return {
                    "items": [str(value).strip() for value in items if str(value).strip()][:6],
                    "suggested_action": suggested_action,
                }
        except json.JSONDecodeError:
            pass

        fallback_items = [line.strip("- ") for line in raw_text.splitlines() if line.strip()][:4]
        return {
            "items": fallback_items,
            "suggested_action": "",
        }

    @staticmethod
    def _radar_items_from_sources(web_items: list[dict], memory_items: list[dict]) -> list[str]:
        items: list[str] = []

        for source in web_items:
            title = str(source.get("title") or "").strip()
            snippet = str(source.get("snippet") or "").strip()
            if title and snippet:
                items.append(f"{title}: {snippet[:110]}")
                continue
            if title:
                items.append(title)

        for item in memory_items[:2]:
            text = str(item.get("text") or "").strip()
            source_label = str(item.get("source_label") or "Founder Notes")
            if text:
                items.append(f"Internal signal ({source_label}): {text[:110]}")

        deduped: list[str] = []
        seen: set[str] = set()
        for value in items:
            key = value.lower()
            if key in seen:
                continue
            seen.add(key)
            deduped.append(value)
        return deduped[:6]

    async def run_startup_radar(self, *, user_id: str, top_k: int) -> dict:
        radar_query = "research latest ai startup funding competitor launches memory trends founder engagement"

        memory_items = await self._memory_service.search(user_id=user_id, query=radar_query, top_k=top_k)
        web_items = await self._web_search_service.search(query=radar_query, max_results=5)
        if not web_items:
            raise RuntimeError("Startup radar unavailable: no live web signals")

        memory_context_lines = []
        for item in memory_items:
            memory_context_lines.append(
                f"Memory [{item.get('source_label') or 'Founder Notes'} | {item.get('file_name') or 'unknown'}]: {str(item.get('text') or '').strip()}"
            )
        for item in web_items:
            memory_context_lines.append(
                f"Web [{item.get('source_label') or 'Web'} | {item.get('title') or 'result'}]: {str(item.get('snippet') or '').strip()}"
            )

        raw_output = await self._chat_model_service.generate_response(
            system_prompt=(
                "You are FounderOS Startup Radar. Return STRICT JSON with keys: "
                "items (array of concise bullet strings) and suggested_action (single sentence)."
            ),
            user_query="Create a real-time startup radar for the founder workspace.",
            memory_context="\n".join(memory_context_lines) or "No radar context available.",
        )
        structured = self._parse_radar_output(raw_output)

        if not structured["items"]:
            structured["items"] = self._radar_items_from_sources(web_items, memory_items)

        if not structured["suggested_action"]:
            first = structured["items"][0] if structured["items"] else "the top startup radar signal"
            structured["suggested_action"] = f"Act on this signal today: {first[:120]}"

        return {
            "title": "Startup Radar",
            "items": structured["items"],
            "suggested_action": structured["suggested_action"],
            "sources": [*web_items, *self._memory_sources(memory_items)],
        }
