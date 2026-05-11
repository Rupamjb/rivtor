from fastapi.testclient import TestClient

from backend.app.main import app


class FakeVoiceService:
    async def transcribe(
        self,
        *,
        user_id: str,
        file_name: str,
        content_type: str,
        content_bytes: bytes,
    ) -> dict:
        return {
            "transcript": "Ship the launch notes today.",
            "provider": "whisper",
            "model": "whisper-1",
            "language": "en",
        }


class ValidationFailingVoiceService:
    async def transcribe(
        self,
        *,
        user_id: str,
        file_name: str,
        content_type: str,
        content_bytes: bytes,
    ) -> dict:
        raise ValueError("Transcription returned empty text")


class RuntimeFailingVoiceService:
    async def transcribe(
        self,
        *,
        user_id: str,
        file_name: str,
        content_type: str,
        content_bytes: bytes,
    ) -> dict:
        raise RuntimeError("Whisper unavailable")


def _auth_headers() -> dict[str, str]:
    return {"Authorization": "Bearer mock-dev-token"}


def test_voice_transcribe_endpoint_requires_bearer_token() -> None:
    client = TestClient(app)

    response = client.post(
        "/voice/transcribe",
        files={"file": ("note.webm", b"audio", "audio/webm")},
    )

    assert response.status_code == 401
    assert response.json()["detail"] == "Missing bearer token"


def test_voice_transcribe_returns_transcript_payload() -> None:
    from backend.app.api.routes.voice import get_voice_transcription_service

    app.dependency_overrides[get_voice_transcription_service] = lambda: FakeVoiceService()
    client = TestClient(app)

    response = client.post(
        "/voice/transcribe",
        headers=_auth_headers(),
        files={"file": ("note.webm", b"audio", "audio/webm")},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["transcript"] == "Ship the launch notes today."
    assert body["provider"] == "whisper"
    assert body["model"] == "whisper-1"

    app.dependency_overrides.clear()


def test_voice_transcribe_returns_400_for_validation_errors() -> None:
    from backend.app.api.routes.voice import get_voice_transcription_service

    app.dependency_overrides[get_voice_transcription_service] = lambda: ValidationFailingVoiceService()
    client = TestClient(app)

    response = client.post(
        "/voice/transcribe",
        headers=_auth_headers(),
        files={"file": ("note.webm", b"audio", "audio/webm")},
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Transcription returned empty text"

    app.dependency_overrides.clear()


def test_voice_transcribe_returns_503_for_provider_failures() -> None:
    from backend.app.api.routes.voice import get_voice_transcription_service

    app.dependency_overrides[get_voice_transcription_service] = lambda: RuntimeFailingVoiceService()
    client = TestClient(app)

    response = client.post(
        "/voice/transcribe",
        headers=_auth_headers(),
        files={"file": ("note.webm", b"audio", "audio/webm")},
    )

    assert response.status_code == 503
    assert response.json()["detail"] == "Whisper unavailable"

    app.dependency_overrides.clear()
