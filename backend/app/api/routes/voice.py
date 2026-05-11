from fastapi import APIRouter, Depends, File, HTTPException, Request, UploadFile

from backend.app.services.voice_transcription_service import VoiceTranscriptionService


router = APIRouter(prefix="/voice", tags=["voice"])


def get_voice_transcription_service() -> VoiceTranscriptionService:
    return VoiceTranscriptionService()


def _resolve_user_id(request: Request) -> str:
    user = getattr(request.state, "user", None)
    if isinstance(user, dict):
        return str(user.get("id") or user.get("sub") or "")
    return ""


@router.post("/transcribe")
async def transcribe_voice(
    request: Request,
    file: UploadFile = File(...),
    service: VoiceTranscriptionService = Depends(get_voice_transcription_service),
) -> dict:
    user_id = _resolve_user_id(request)
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthenticated request")

    file_name = file.filename or "recording.webm"
    content_type = file.content_type or ""
    content_bytes = await file.read()

    try:
        return await service.transcribe(
            user_id=user_id,
            file_name=file_name,
            content_type=content_type,
            content_bytes=content_bytes,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
