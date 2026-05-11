import json
import re
from typing import Optional

from backend.app.services.activity_logger import ActivityLogger
from backend.app.services.azure_image_service import AzureImageService
from backend.app.core.config import get_settings
from backend.app.services.activities_repo import ActivitiesRepository
from backend.app.services.chat_model_service import ChatModelService
from backend.app.services.generations_repo import GenerationsRepository
from backend.app.services.memory_service import MemoryService
from backend.app.services.text_sanitizer import markdown_to_plain_text


CONTENT_KEYWORDS = ("write", "generate", "post", "tweet", "linkedin", "announcement")
VALID_FORMATS = {"linkedin", "founder_update", "launch_post", "x_post", "blog_outline"}
VALID_TONES = {"professional", "bold", "insightful", "casual"}
VALID_LENGTHS = {"short", "medium", "long"}


class ContentAgentService:
    def __init__(
        self,
        *,
        memory_service: Optional[MemoryService] = None,
        generations_repo: Optional[GenerationsRepository] = None,
        activities_repo: Optional[ActivitiesRepository] = None,
        chat_model_service: Optional[ChatModelService] = None,
        activity_logger: Optional[ActivityLogger] = None,
        image_service: Optional[AzureImageService] = None,
    ) -> None:
        settings = get_settings()
        fallback_models = [
            model_id.strip()
            for model_id in settings.bedrock_chat_fallback_models.split(",")
            if model_id.strip()
        ]

        self._memory_service = memory_service or MemoryService()
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
        self._chat_model_service = chat_model_service or ChatModelService(
            region=settings.aws_region,
            model_id=settings.bedrock_chat_model,
            fallback_model_ids=fallback_models,
            bearer_token=settings.aws_bearer_token_bedrock,
        )
        self._image_service = image_service or AzureImageService()

    @staticmethod
    def is_content_intent(query: str) -> bool:
        normalized = query.lower()
        return any(keyword in normalized for keyword in CONTENT_KEYWORDS)

    @staticmethod
    def _normalize_format(format_type: str) -> str:
        value = (format_type or "linkedin").strip().lower()
        return value if value in VALID_FORMATS else "linkedin"

    @staticmethod
    def _normalize_tone(tone: str) -> str:
        value = (tone or "professional").strip().lower()
        return value if value in VALID_TONES else "professional"

    @staticmethod
    def _normalize_length(length: str) -> str:
        value = (length or "medium").strip().lower()
        return value if value in VALID_LENGTHS else "medium"

    @staticmethod
    def _default_title_for_format(format_type: str) -> str:
        if format_type == "founder_update":
            return "Founder Update Draft"
        if format_type == "launch_post":
            return "Launch Post Draft"
        if format_type == "x_post":
            return "X Post Draft"
        if format_type == "blog_outline":
            return "Blog Outline Draft"
        return "LinkedIn Draft"

    @staticmethod
    def _parse_model_output(raw_text: str, *, format_type: str) -> dict:
        text = raw_text.strip()

        if text.startswith("```"):
            text = re.sub(r"^```(?:json)?\s*", "", text)
            text = re.sub(r"\s*```$", "", text)

        try:
            parsed = json.loads(text)
            if isinstance(parsed, dict):
                title = str(parsed.get("title") or "").strip() or ContentAgentService._default_title_for_format(format_type)
                draft = str(parsed.get("draft") or "").strip() or raw_text.strip()
                labels = parsed.get("context_labels")
                context_labels = [str(label) for label in labels] if isinstance(labels, list) else []
                return {
                    "title": title,
                    "draft": draft,
                    "context_labels": context_labels,
                }
        except json.JSONDecodeError:
            pass

        return {
            "title": ContentAgentService._default_title_for_format(format_type),
            "draft": raw_text.strip(),
            "context_labels": [],
        }

    @staticmethod
    def _memory_sources(memory_items: list[dict]) -> list[dict]:
        sources: list[dict] = []
        for item in memory_items:
            sources.append(
                {
                    "source_type": "memory",
                    "source_label": str(item.get("source_label") or "Founder Notes"),
                    "title": str(item.get("file_name") or "Memory source"),
                    "snippet": str(item.get("text") or "").strip(),
                }
            )
        return sources

    @staticmethod
    def _research_sources(research_rows: list[dict]) -> list[dict]:
        sources: list[dict] = []
        for row in research_rows:
            output_json = row.get("output_json") if isinstance(row, dict) else {}
            if not isinstance(output_json, dict):
                continue
            summary = str(output_json.get("summary") or "").strip()
            title = str(output_json.get("query") or "Research Summary")
            sources.append(
                {
                    "source_type": "research",
                    "source_label": "Research Summary",
                    "title": title,
                    "snippet": summary,
                }
            )
        return sources

    @staticmethod
    def _build_image_prompt(*, query: str, title: str, draft: str) -> str:
        return (
            "Create a polished LinkedIn hero image for a startup founder update. "
            "Style: modern, optimistic, product-focused, no logos or text overlays. "
            f"Post title: {title}. "
            f"Post intent: {query}. "
            f"Post draft context: {draft[:400]}"
        )

    @staticmethod
    def _sanitize_structured_content(structured: dict, *, format_type: str) -> dict:
        title = markdown_to_plain_text(str(structured.get("title") or "")).strip()
        draft = markdown_to_plain_text(str(structured.get("draft") or "")).strip()
        if not title:
            title = ContentAgentService._default_title_for_format(format_type)
        if not draft:
            draft = ContentAgentService._default_title_for_format(format_type)
        return {
            "title": title,
            "draft": draft,
            "context_labels": structured.get("context_labels") if isinstance(structured.get("context_labels"), list) else [],
        }

    async def run(
        self,
        *,
        user_id: str,
        query: str,
        format_type: str,
        tone: str,
        length: str,
        generate_image: bool = True,
        top_k: int,
    ) -> dict:
        if not self.is_content_intent(query):
            raise ValueError("Query is not content intent")

        normalized_format = self._normalize_format(format_type)
        normalized_tone = self._normalize_tone(tone)
        normalized_length = self._normalize_length(length)

        memory_items = await self._memory_service.search(user_id=user_id, query=query, top_k=top_k)
        research_rows = await self._generations_repo.list_generations(user_id=user_id, limit=3, agent_type="research")

        memory_sources = self._memory_sources(memory_items)
        research_sources = self._research_sources(research_rows)
        all_sources = [*memory_sources, *research_sources]

        merged_context = []
        for source in all_sources:
            merged_context.append(
                f"[{source['source_type']} | {source['source_label']} | {source['title']}] {source['snippet']}"
            )

        system_prompt = (
            "You are FounderOS Content Agent. Return STRICT JSON with keys: title, draft, context_labels. "
            "Use founder voice and keep the output polished for startup operators. "
            "Return plain text only and do not use Markdown characters like *, **, #, _, or backticks."
        )
        user_prompt = (
            f"Request: {query}\n"
            f"Format: {normalized_format}\n"
            f"Tone: {normalized_tone}\n"
            f"Length: {normalized_length}\n"
            "Generate a publication-ready draft with a clear hook and CTA."
        )

        raw_output = await self._chat_model_service.generate_response(
            system_prompt=system_prompt,
            user_query=user_prompt,
            memory_context="\n".join(merged_context) or "No context available.",
        )

        structured = self._parse_model_output(raw_output, format_type=normalized_format)
        structured = self._sanitize_structured_content(structured, format_type=normalized_format)
        image_data_url = ""
        image_prompt = ""
        image_error = ""
        image_requested = normalized_format == "linkedin" and generate_image
        if image_requested:
            image_prompt = self._build_image_prompt(
                query=query,
                title=structured["title"],
                draft=structured["draft"],
            )
            if not self._image_service.is_configured():
                image_error = "Image generation is not configured."
            else:
                try:
                    image_result = await self._image_service.generate_image_data_url(prompt=image_prompt)
                    image_data_url = str(image_result.get("data_url") or "")
                except Exception as exc:
                    image_data_url = ""
                    image_error = str(exc)
        inferred_labels = []
        if memory_sources:
            inferred_labels.append("Founder Notes")
        if research_sources:
            inferred_labels.append("Research Summary")

        context_labels = []
        for label in [*structured["context_labels"], *inferred_labels]:
            value = str(label).strip()
            if value and value not in context_labels:
                context_labels.append(value)

        output_json = {
            "query": query,
            "format": normalized_format,
            "tone": normalized_tone,
            "length": normalized_length,
            "title": structured["title"],
            "draft": structured["draft"],
            "context_labels": context_labels,
            "sources": all_sources,
            "approval_required": True,
            "image_requested": image_requested,
            "image_prompt": image_prompt,
            "image_data_url": image_data_url,
            "image_error": image_error,
        }

        generation = await self._generations_repo.create_generation(
            user_id=user_id,
            agent_type="content",
            status="approval_required",
            content=structured["draft"],
            output_json=output_json,
        )

        try:
            await self._activity_logger.log(
                user_id=user_id,
                event_type="content_draft_created",
                metadata={
                    "generation_id": generation.get("id", ""),
                    "query": query,
                    "format": normalized_format,
                    "agent_type": "content",
                },
            )
        except Exception:
            pass

        return {
            "generation_id": generation.get("id", ""),
            "agent_type": "content",
            "status": "approval_required",
            "approval_required": True,
            "query": query,
            "format": normalized_format,
            "tone": normalized_tone,
            "length": normalized_length,
            "title": structured["title"],
            "draft": structured["draft"],
            "context_labels": context_labels,
            "sources": all_sources,
            "image_requested": image_requested,
            "image_data_url": image_data_url,
            "image_error": image_error,
            "created_at": generation.get("created_at", ""),
        }
