from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile
from pydantic import BaseModel, Field
from typing import Optional

from backend.app.services.memory_service import MemoryService
from backend.app.services.text_extraction import is_supported_memory_file


router = APIRouter(prefix="/memory", tags=["memory"])


class MemorySearchRequest(BaseModel):
    query: str = Field(min_length=2)
    top_k: int = Field(default=5, ge=1, le=10)


def get_memory_service() -> MemoryService:
    return MemoryService()


def _resolve_user_id(request: Request) -> str:
    user = getattr(request.state, "user", None)
    if isinstance(user, dict):
        return str(user.get("id") or user.get("sub") or "")
    return ""


@router.post("/upload")
async def upload_memory(
    request: Request,
    file: UploadFile = File(...),
    source_label: Optional[str] = Form(default=None),
    memory_service: MemoryService = Depends(get_memory_service),
) -> dict:
    file_name = file.filename or "uploaded.txt"
    if not is_supported_memory_file(file_name):
        raise HTTPException(status_code=400, detail="Only PDF and TXT files are supported")

    user_id = _resolve_user_id(request)
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthenticated request")

    content_bytes = await file.read()
    if not content_bytes:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")

    try:
        return await memory_service.upload_document(
            user_id=user_id,
            file_name=file_name,
            content_bytes=content_bytes,
            source_label=source_label,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@router.post("/search")
async def search_memory(
    payload: MemorySearchRequest,
    request: Request,
    memory_service: MemoryService = Depends(get_memory_service),
) -> dict[str, list[dict]]:
    user_id = _resolve_user_id(request)
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthenticated request")

    try:
        items = await memory_service.search(
            user_id=user_id,
            query=payload.query,
            top_k=payload.top_k,
        )
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    return {"items": items}


@router.get("/list")
async def list_memory_documents(
    request: Request,
    memory_service: MemoryService = Depends(get_memory_service),
) -> dict[str, list[dict]]:
    user_id = _resolve_user_id(request)
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthenticated request")

    try:
        items = await memory_service.list_documents(user_id=user_id)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    return {"items": items}


@router.get("/profile")
async def founder_memory_profile(
    request: Request,
    memory_service: MemoryService = Depends(get_memory_service),
) -> dict:
    user_id = _resolve_user_id(request)
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthenticated request")

    try:
        return await memory_service.founder_intelligence(user_id=user_id)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
