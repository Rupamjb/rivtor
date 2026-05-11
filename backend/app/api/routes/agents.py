from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field

from backend.app.services.content_agent_service import ContentAgentService
from backend.app.services.executive_agent_service import ExecutiveAgentService
from backend.app.services.research_agent_service import ResearchAgentService


router = APIRouter(prefix="/agents", tags=["agents"])


class ResearchRequest(BaseModel):
    query: str = Field(min_length=2)
    top_k: int = Field(default=3, ge=1, le=10)


class ContentRequest(BaseModel):
    query: str = Field(min_length=2)
    format: str = Field(default="linkedin")
    tone: str = Field(default="professional")
    length: str = Field(default="medium")
    generate_image: bool = Field(default=True)
    top_k: int = Field(default=3, ge=1, le=10)


class ExecutiveRequest(BaseModel):
    query: str = Field(min_length=2)
    top_k: int = Field(default=3, ge=1, le=10)


class MultiRouteRequest(BaseModel):
    query: str = Field(min_length=2)
    top_k: int = Field(default=3, ge=1, le=10)


def get_research_agent_service() -> ResearchAgentService:
    return ResearchAgentService()


def get_content_agent_service() -> ContentAgentService:
    return ContentAgentService()


def get_executive_agent_service() -> ExecutiveAgentService:
    return ExecutiveAgentService()


def _resolve_user_id(request: Request) -> str:
    user = getattr(request.state, "user", None)
    if isinstance(user, dict):
        return str(user.get("id") or user.get("sub") or "")
    return ""


def _infer_content_format(query: str) -> str:
    normalized = query.lower()
    if "thread" in normalized or "x post" in normalized or "tweet" in normalized:
        return "x_post"
    if "blog" in normalized or "outline" in normalized:
        return "blog_outline"
    if "founder update" in normalized or "investor" in normalized:
        return "founder_update"
    if "launch" in normalized or "announcement" in normalized:
        return "launch_post"
    return "linkedin"


def _route_steps(query: str) -> list[str]:
    normalized = query.lower()
    research_signals = ("research", "trend", "competitor", "market", "funding", "radar", "news")
    content_signals = ("post", "linkedin", "thread", "tweet", "blog", "draft", "publish", "content")

    wants_research = any(token in normalized for token in research_signals)
    wants_content = any(token in normalized for token in content_signals)

    steps: list[str] = []
    if wants_research:
        steps.append("research")
    if wants_content:
        steps.append("content")
    steps.append("executive")
    deduped: list[str] = []
    for step in steps:
        if step not in deduped:
            deduped.append(step)
    return deduped


@router.post("/research")
async def run_research_agent(
    payload: ResearchRequest,
    request: Request,
    service: ResearchAgentService = Depends(get_research_agent_service),
) -> dict:
    user_id = _resolve_user_id(request)
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthenticated request")

    try:
        return await service.run(user_id=user_id, query=payload.query, top_k=payload.top_k)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except RuntimeError as exc:
        detail = str(exc)
        status_code = 503 if detail == "Web search unavailable" else 503
        raise HTTPException(status_code=status_code, detail=detail) from exc


@router.post("/content")
async def run_content_agent(
    payload: ContentRequest,
    request: Request,
    service: ContentAgentService = Depends(get_content_agent_service),
) -> dict:
    user_id = _resolve_user_id(request)
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthenticated request")

    try:
        return await service.run(
            user_id=user_id,
            query=payload.query,
            format_type=payload.format,
            tone=payload.tone,
            length=payload.length,
            generate_image=payload.generate_image,
            top_k=payload.top_k,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except RuntimeError as exc:
        detail = str(exc)
        status_code = 503 if detail == "Content generation unavailable" else 503
        raise HTTPException(status_code=status_code, detail=detail) from exc


@router.post("/executive")
async def run_executive_agent(
    payload: ExecutiveRequest,
    request: Request,
    service: ExecutiveAgentService = Depends(get_executive_agent_service),
) -> dict:
    user_id = _resolve_user_id(request)
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthenticated request")

    try:
        return await service.run(
            user_id=user_id,
            query=payload.query,
            top_k=payload.top_k,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@router.get("/startup-radar")
async def startup_radar(
    request: Request,
    top_k: int = 3,
    service: ResearchAgentService = Depends(get_research_agent_service),
) -> dict:
    user_id = _resolve_user_id(request)
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthenticated request")

    try:
        return await service.run_startup_radar(user_id=user_id, top_k=top_k)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@router.post("/multi-route")
async def run_multi_agent_route(
    payload: MultiRouteRequest,
    request: Request,
    research_service: ResearchAgentService = Depends(get_research_agent_service),
    content_service: ContentAgentService = Depends(get_content_agent_service),
    executive_service: ExecutiveAgentService = Depends(get_executive_agent_service),
) -> dict:
    user_id = _resolve_user_id(request)
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthenticated request")

    steps = _route_steps(payload.query)
    response: dict = {
        "route": steps,
        "research": None,
        "content": None,
        "executive": None,
        "suggested_actions": [],
    }

    try:
        if "research" in steps:
            response["research"] = await research_service.run(
                user_id=user_id,
                query=payload.query if research_service.is_research_intent(payload.query) else f"Research {payload.query}",
                top_k=payload.top_k,
            )

        if "content" in steps:
            content_query = payload.query
            if not content_service.is_content_intent(content_query):
                content_query = f"Generate a founder-ready post based on: {payload.query}"
            response["content"] = await content_service.run(
                user_id=user_id,
                query=content_query,
                format_type=_infer_content_format(payload.query),
                tone="professional",
                length="medium",
                generate_image=_infer_content_format(payload.query) == "linkedin",
                top_k=payload.top_k,
            )

        executive_context_parts = [payload.query]
        if isinstance(response.get("research"), dict):
            executive_context_parts.append(f"Research summary: {response['research'].get('summary', '')}")
        if isinstance(response.get("content"), dict):
            executive_context_parts.append(f"Content draft: {response['content'].get('title', '')}")

        response["executive"] = await executive_service.run(
            user_id=user_id,
            query="\n".join(executive_context_parts).strip(),
            top_k=payload.top_k,
        )

        response["suggested_actions"] = [
            {
                "id": "launch_post",
                "label": "Generate launch post",
                "prompt": "Generate a launch announcement post using my uploaded company context.",
                "reason": "Publish momentum while context is fresh.",
            },
            {
                "id": "research_competitors",
                "label": "Research competitors",
                "prompt": "Research my competitors and summarize key positioning gaps.",
                "reason": "Track market movement before next content cycle.",
            },
            {
                "id": "investor_update",
                "label": "Create investor update",
                "prompt": "Create an investor update using my latest company notes and research context.",
                "reason": "Keep stakeholders aligned on execution.",
            },
        ]
        return response
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
