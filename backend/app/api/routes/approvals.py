from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field

from backend.app.services.approval_service import ApprovalService


router = APIRouter(prefix="/approvals", tags=["approvals"])


class ApproveRequest(BaseModel):
    generation_id: str = Field(min_length=2)
    note: Optional[str] = None


class RejectRequest(BaseModel):
    generation_id: str = Field(min_length=2)
    reason: Optional[str] = None


class PublishRequest(BaseModel):
    generation_id: str = Field(min_length=2)


def get_approval_service() -> ApprovalService:
    return ApprovalService()


def _resolve_user_id(request: Request) -> str:
    user = getattr(request.state, "user", None)
    if isinstance(user, dict):
        return str(user.get("id") or user.get("sub") or "")
    return ""


@router.post("/approve")
async def approve_generation(
    payload: ApproveRequest,
    request: Request,
    service: ApprovalService = Depends(get_approval_service),
) -> dict:
    user_id = _resolve_user_id(request)
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthenticated request")

    try:
        return await service.approve(
            user_id=user_id,
            generation_id=payload.generation_id,
            note=payload.note,
        )
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@router.post("/reject")
async def reject_generation(
    payload: RejectRequest,
    request: Request,
    service: ApprovalService = Depends(get_approval_service),
) -> dict:
    user_id = _resolve_user_id(request)
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthenticated request")

    try:
        return await service.reject(
            user_id=user_id,
            generation_id=payload.generation_id,
            reason=payload.reason,
        )
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@router.post("/publish")
async def publish_generation(
    payload: PublishRequest,
    request: Request,
    service: ApprovalService = Depends(get_approval_service),
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
        raise HTTPException(status_code=503, detail=str(exc)) from exc
