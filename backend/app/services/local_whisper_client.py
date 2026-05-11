import os
import tempfile
from typing import Optional


class LocalWhisperClient:
    def __init__(
        self,
        *,
        model: str,
        device: str = "cpu",
        compute_type: str = "int8",
        language: str = "en",
    ) -> None:
        self._model_name = model.strip() or "base"
        self._device = device.strip() or "cpu"
        self._compute_type = compute_type.strip() or "int8"
        self._language = language.strip()
        self._model = None

    @property
    def model(self) -> str:
        return self._model_name

    def _get_model(self):
        if self._model is not None:
            return self._model

        try:
            from faster_whisper import WhisperModel
        except Exception as exc:
            raise RuntimeError("Local Whisper dependency is not installed") from exc

        try:
            self._model = WhisperModel(
                self._model_name,
                device=self._device,
                compute_type=self._compute_type,
            )
        except Exception as exc:
            raise RuntimeError("Local Whisper model unavailable") from exc

        return self._model

    async def transcribe_audio(
        self,
        *,
        file_name: str,
        content_bytes: bytes,
        content_type: str,
        model: Optional[str] = None,
    ) -> dict:
        del content_type
        if model and model.strip() and model.strip() != self._model_name:
            self._model_name = model.strip()
            self._model = None

        whisper_model = self._get_model()
        suffix = os.path.splitext(file_name)[1] or ".webm"
        temp_path = ""

        try:
            with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
                temp_file.write(content_bytes)
                temp_path = temp_file.name

            segments, info = whisper_model.transcribe(
                temp_path,
                vad_filter=False,
                language=self._language or None,
            )
            transcript = " ".join(segment.text.strip() for segment in segments if segment.text.strip()).strip()
            language = getattr(info, "language", None)

            if not transcript and self._language:
                segments, info = whisper_model.transcribe(
                    temp_path,
                    vad_filter=False,
                    language=None,
                )
                transcript = " ".join(segment.text.strip() for segment in segments if segment.text.strip()).strip()
                language = getattr(info, "language", None)
        except RuntimeError:
            raise
        except Exception as exc:
            raise RuntimeError("Local Whisper transcription failed") from exc
        finally:
            if temp_path:
                try:
                    os.remove(temp_path)
                except OSError:
                    pass

        return {
            "text": transcript,
            "language": str(language).strip() if isinstance(language, str) else None,
            "model": self._model_name,
            "provider": "whisper_local",
        }
