import asyncio

from backend.app.services.memory_service import MemoryService


class FakeEmbeddingService:
    async def embed_texts(self, texts: list[str]) -> list[list[float]]:
        return [[0.1, 0.2, 0.3] for _ in texts]


class FakeChromaStore:
    async def upsert_chunks(
        self,
        *,
        ids: list[str],
        documents: list[str],
        embeddings: list[list[float]],
        metadatas: list[dict],
    ) -> None:
        return None


class FakeDocumentsRepo:
    async def create_document(
        self,
        *,
        user_id: str,
        file_name: str,
        source_label: str,
        extracted_text: str,
        vector_id: str,
    ) -> dict:
        return {
            "id": "doc-1",
            "user_id": user_id,
            "file_name": file_name,
            "source_label": source_label,
            "vector_id": vector_id,
        }


class SpyActivityLogger:
    def __init__(self) -> None:
        self.events: list[dict] = []

    async def log(self, *, user_id: str, event_type: str, metadata: dict) -> dict:
        row = {
            "id": "act-1",
            "user_id": user_id,
            "event_type": event_type,
            "metadata": metadata,
        }
        self.events.append(row)
        return row


class FailingActivityLogger:
    async def log(self, *, user_id: str, event_type: str, metadata: dict) -> dict:
        raise RuntimeError("Failed to persist activity")


def _memory_service(activity_logger) -> MemoryService:
    return MemoryService(
        extractor=lambda _file_name, _bytes: "FounderOS update text",
        chunker=lambda text: [text],
        embedding_service=FakeEmbeddingService(),
        chroma_store=FakeChromaStore(),
        documents_repo=FakeDocumentsRepo(),
        activity_logger=activity_logger,
    )


def test_memory_service_logs_document_uploaded_event() -> None:
    logger = SpyActivityLogger()
    service = _memory_service(logger)

    result = asyncio.run(
        service.upload_document(
            user_id="user-1",
            file_name="founder-notes.txt",
            content_bytes=b"founder notes",
            source_label="Founder Notes",
        )
    )

    assert result["document_id"] == "doc-1"
    assert len(logger.events) == 1
    assert logger.events[0]["event_type"] == "document_uploaded"
    assert logger.events[0]["metadata"]["document_id"] == "doc-1"


def test_memory_service_upload_succeeds_when_activity_logging_fails() -> None:
    service = _memory_service(FailingActivityLogger())

    result = asyncio.run(
        service.upload_document(
            user_id="user-1",
            file_name="founder-notes.txt",
            content_bytes=b"founder notes",
            source_label="Founder Notes",
        )
    )

    assert result["document_id"] == "doc-1"
    assert result["chunks_indexed"] == 1
