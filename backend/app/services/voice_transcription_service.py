from typing import Optional

from backend.app.core.config import get_settings
from backend.app.services.activity_logger import ActivityLogger
from backend.app.services.local_whisper_client import LocalWhisperClient
from backend.app.services.whisper_api_client import WhisperApiClient


ALLOWED_AUDIO_EXTENSIONS = {".webm", ".wav", ".mp3", ".m4a"}
ALLOWED_AUDIO_MIME_TYPES = {
    "audio/webm",
    "audio/wav",
    "audio/mpeg",
    "audio/mp4",
    "audio/x-m4a",
}


class VoiceTranscriptionService:
    def __init__(
        self,
        *,
        whisper_client: Optional[WhisperApiClient] = None,
        activity_logger: Optional[ActivityLogger] = None,
        whisper_model: Optional[str] = None,
        max_upload_bytes: Optional[int] = None,
    ) -> None:
        settings = get_settings()
        self._whisper_model = (whisper_model or settings.whisper_model or "whisper-1").strip() or "whisper-1"
        self._max_upload_bytes = max_upload_bytes or max(1, settings.voice_max_upload_mb) * 1024 * 1024
        if whisper_client is not None:
            self._whisper_client = whisper_client
        else:
            provider = (settings.whisper_provider or "openai").strip().lower()
            if provider == "local":
                self._whisper_model = (settings.whisper_local_model or "base").strip() or "base"
                self._whisper_client = LocalWhisperClient(
                    model=self._whisper_model,
                    device=settings.whisper_local_device,
                    compute_type=settings.whisper_local_compute_type,
                    language=settings.whisper_local_language,
                )
            else:
                self._whisper_client = WhisperApiClient(
                    api_key=settings.whisper_api_key,
                    base_url=settings.whisper_api_base_url,
                    model=self._whisper_model,
                )
        self._activity_logger = activity_logger or ActivityLogger()

    @staticmethod
    def _is_supported_audio(*, file_name: str, content_type: str) -> bool:
        normalized_name = file_name.lower().strip()
        normalized_type = content_type.lower().strip()

        has_allowed_extension = any(normalized_name.endswith(extension) for extension in ALLOWED_AUDIO_EXTENSIONS)
        has_allowed_mime = normalized_type in ALLOWED_AUDIO_MIME_TYPES
        return has_allowed_extension or has_allowed_mime

    async def transcribe(
        self,
        *,
        user_id: str,
        file_name: str,
        content_type: str,
        content_bytes: bytes,
    ) -> dict:
        if not self._is_supported_audio(file_name=file_name, content_type=content_type):
            raise ValueError("Unsupported audio format")
        if not content_bytes:
            raise ValueError("Uploaded audio is empty")
        if len(content_bytes) > self._max_upload_bytes:
            raise ValueError("Uploaded audio exceeds max upload size")

        payload = await self._whisper_client.transcribe_audio(
            file_name=file_name,
            content_bytes=content_bytes,
            content_type=content_type or "application/octet-stream",
            model=self._whisper_model,
        )
        transcript = str(payload.get("text") or "").strip()
        if not transcript:
            raise ValueError("Transcription returned empty text")

        language = payload.get("language")
        language_value = str(language).strip() if isinstance(language, str) and language.strip() else None
        provider = str(payload.get("provider") or "whisper").strip() or "whisper"
        model_name = str(payload.get("model") or self._whisper_model).strip() or self._whisper_model

        try:
            await self._activity_logger.log(
                user_id=user_id,
                event_type="voice_transcribed",
                metadata={
                    "mime_type": content_type or "application/octet-stream",
                    "audio_bytes": len(content_bytes),
                    "transcript_chars": len(transcript),
                    "provider": provider,
                },
            )
        except Exception:
            pass

        return {
            "transcript": transcript,
            "provider": provider,
            "model": model_name,
            "language": language_value,
        }
