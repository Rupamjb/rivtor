from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel

from backend.app.services.linkedin_service import LinkedInService


router = APIRouter(prefix="/linkedin", tags=["linkedin"])


class LinkedInConnectRequest(BaseModel):
    step: str = "start"
    code: Optional[str] = None
    state: Optional[str] = None
    force_reconnect: bool = False


class LinkedInPublishRequest(BaseModel):
    generation_id: str


def get_linkedin_service() -> LinkedInService:
    return LinkedInService()


def _resolve_user_id(request: Request) -> str:
    user = getattr(request.state, "user", None)
    if isinstance(user, dict):
        return str(user.get("id") or user.get("sub") or "")
    return ""


@router.post("/connect")
async def linkedin_connect(
    payload: LinkedInConnectRequest,
    request: Request,
    service: LinkedInService = Depends(get_linkedin_service),
) -> dict:
    user_id = _resolve_user_id(request)
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthenticated request")

    try:
        return await service.connect(
            user_id=user_id,
            step=payload.step,
            code=payload.code,
            state=payload.state,
            force_reconnect=payload.force_reconnect,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@router.post("/publish")
async def linkedin_publish(
    payload: LinkedInPublishRequest,
    request: Request,
    service: LinkedInService = Depends(get_linkedin_service),
) -> dict:
    user_id = _resolve_user_id(request)
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthenticated request")

    try:
        return await service.publish(
            user_id=user_id,
            generation_id=payload.generation_id,
        )
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    except RuntimeError as exc:
        detail = str(exc)
        if detail == "LinkedIn rate limited":
            raise HTTPException(status_code=429, detail=detail) from exc
        raise HTTPException(status_code=503, detail=detail) from exc
