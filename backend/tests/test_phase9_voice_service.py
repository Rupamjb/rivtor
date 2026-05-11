from typing import Optional

import pytest

from backend.app.services.voice_transcription_service import VoiceTranscriptionService


class FakeWhisperClient:
    def __init__(
        self,
        *,
        transcript: str = "We should prioritize retention wins this week.",
        fail: Optional[str] = None,
        provider: str = "whisper",
        model: str = "whisper-1",
    ) -> None:
        self._transcript = transcript
        self._fail = fail
        self._provider = provider
        self._model = model

    async def transcribe_audio(
        self,
        *,
        file_name: str,
        content_bytes: bytes,
        content_type: str,
        model: str,
    ) -> dict:
        if self._fail:
            raise RuntimeError(self._fail)
        return {
            "text": self._transcript,
            "language": "en",
            "model": self._model,
            "provider": self._provider,
        }


class FakeActivityLogger:
    def __init__(self) -> None:
        self.entries: list[dict] = []

    async def log(self, *, user_id: str, event_type: str, metadata: dict) -> dict:
        entry = {
            "user_id": user_id,
            "event_type": event_type,
            "metadata": metadata,
        }
        self.entries.append(entry)
        return entry


@pytest.mark.asyncio
async def test_transcribe_rejects_unsupported_file_type() -> None:
    service = VoiceTranscriptionService(
        whisper_client=FakeWhisperClient(),
        activity_logger=FakeActivityLogger(),
    )

    with pytest.raises(ValueError) as exc:
        await service.transcribe(
            user_id="user-1",
            file_name="recording.ogg",
            content_type="audio/ogg",
            content_bytes=b"audio",
        )

    assert str(exc.value) == "Unsupported audio format"


@pytest.mark.asyncio
async def test_transcribe_rejects_empty_upload() -> None:
    service = VoiceTranscriptionService(
        whisper_client=FakeWhisperClient(),
        activity_logger=FakeActivityLogger(),
    )

    with pytest.raises(ValueError) as exc:
        await service.transcribe(
            user_id="user-1",
            file_name="recording.webm",
            content_type="audio/webm",
            content_bytes=b"",
        )

    assert str(exc.value) == "Uploaded audio is empty"


@pytest.mark.asyncio
async def test_transcribe_rejects_empty_transcript() -> None:
    service = VoiceTranscriptionService(
        whisper_client=FakeWhisperClient(transcript="   "),
        activity_logger=FakeActivityLogger(),
    )

    with pytest.raises(ValueError) as exc:
        await service.transcribe(
            user_id="user-1",
            file_name="recording.webm",
            content_type="audio/webm",
            content_bytes=b"audio",
        )

    assert str(exc.value) == "Transcription returned empty text"


@pytest.mark.asyncio
async def test_transcribe_logs_activity_and_returns_contract_payload() -> None:
    logger = FakeActivityLogger()
    service = VoiceTranscriptionService(
        whisper_client=FakeWhisperClient(),
        activity_logger=logger,
        whisper_model="whisper-1",
        max_upload_bytes=10_000_000,
    )

    payload = await service.transcribe(
        user_id="user-1",
        file_name="founder-note.webm",
        content_type="audio/webm",
        content_bytes=b"audio-bytes",
    )

    assert payload["transcript"] == "We should prioritize retention wins this week."
    assert payload["provider"] == "whisper"
    assert payload["model"] == "whisper-1"
    assert payload["language"] == "en"
    assert len(logger.entries) == 1
    assert logger.entries[0]["event_type"] == "voice_transcribed"
    assert logger.entries[0]["metadata"]["audio_bytes"] == len(b"audio-bytes")


@pytest.mark.asyncio
async def test_transcribe_uses_provider_returned_by_client() -> None:
    logger = FakeActivityLogger()
    service = VoiceTranscriptionService(
        whisper_client=FakeWhisperClient(provider="whisper_local", model="base"),
        activity_logger=logger,
    )

    payload = await service.transcribe(
        user_id="user-1",
        file_name="founder-note.webm",
        content_type="audio/webm",
        content_bytes=b"audio-bytes",
    )

    assert payload["provider"] == "whisper_local"
    assert payload["model"] == "base"
    assert logger.entries[0]["metadata"]["provider"] == "whisper_local"


@pytest.mark.asyncio
async def test_transcribe_raises_runtime_error_when_provider_unavailable() -> None:
    service = VoiceTranscriptionService(
        whisper_client=FakeWhisperClient(fail="Whisper unavailable"),
        activity_logger=FakeActivityLogger(),
    )

    with pytest.raises(RuntimeError) as exc:
        await service.transcribe(
            user_id="user-1",
            file_name="founder-note.webm",
            content_type="audio/webm",
            content_bytes=b"audio",
        )

    assert str(exc.value) == "Whisper unavailable"
