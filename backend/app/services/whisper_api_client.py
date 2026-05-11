from typing import Optional

import httpx


class WhisperApiClient:
    def __init__(
        self,
        *,
        api_key: str,
        base_url: str,
        model: str,
        client: Optional[httpx.AsyncClient] = None,
    ) -> None:
        self._api_key = api_key.strip()
        self._base_url = base_url.rstrip("/")
        self._model = model.strip() or "whisper-1"
        self._client = client

    @property
    def model(self) -> str:
        return self._model

    def _validate_config(self) -> None:
        if not self._api_key or not self._base_url:
            raise RuntimeError("Whisper not configured")
        if not self._base_url.startswith("http"):
            raise RuntimeError("Whisper not configured")

    async def transcribe_audio(
        self,
        *,
        file_name: str,
        content_bytes: bytes,
        content_type: str,
        model: Optional[str] = None,
    ) -> dict:
        self._validate_config()

        resolved_model = (model or self._model).strip() or self._model
        headers = {
            "Authorization": f"Bearer {self._api_key}",
        }
        files = {
            "file": (file_name, content_bytes, content_type),
        }
        data = {
            "model": resolved_model,
            "response_format": "verbose_json",
        }

        try:
            if self._client is not None:
                response = await self._client.post(
                    f"{self._base_url}/audio/transcriptions",
                    headers=headers,
                    files=files,
                    data=data,
                )
            else:
                async with httpx.AsyncClient(timeout=30.0) as client:
                    response = await client.post(
                        f"{self._base_url}/audio/transcriptions",
                        headers=headers,
                        files=files,
                        data=data,
                    )
        except httpx.HTTPError as exc:
            raise RuntimeError("Whisper unavailable") from exc

        if response.status_code >= 500:
            raise RuntimeError("Whisper unavailable")
        if response.status_code >= 400:
            detail = "Whisper unavailable"
            try:
                payload = response.json()
                if isinstance(payload, dict):
                    error_payload = payload.get("error")
                    if isinstance(error_payload, dict):
                        message = error_payload.get("message")
                        if isinstance(message, str) and message.strip():
                            detail = message.strip()
                    message = payload.get("message")
                    if isinstance(message, str) and message.strip():
                        detail = message.strip()
            except Exception:
                detail = "Whisper unavailable"
            raise RuntimeError(detail)

        payload = response.json()
        transcript = str(payload.get("text") or "").strip()
        language = payload.get("language")

        return {
            "text": transcript,
            "language": str(language).strip() if isinstance(language, str) else None,
            "model": resolved_model,
            "provider": "whisper",
        }
