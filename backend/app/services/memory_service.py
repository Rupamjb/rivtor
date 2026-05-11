from uuid import uuid4
from typing import Optional

from backend.app.services.activity_logger import ActivityLogger
from backend.app.core.config import get_settings
from backend.app.services.chroma_store import ChromaStore
from backend.app.services.chunking import chunk_text
from backend.app.services.documents_repo import DocumentsRepository
from backend.app.services.embedding_service import EmbeddingService
from backend.app.services.founder_profile_service import FounderProfileService
from backend.app.services.text_extraction import extract_text_from_upload


class MemoryService:
    def __init__(
        self,
        *,
        extractor=extract_text_from_upload,
        chunker=chunk_text,
        embedding_service: Optional[EmbeddingService] = None,
        chroma_store: Optional[ChromaStore] = None,
        documents_repo: Optional[DocumentsRepository] = None,
        activity_logger: Optional[ActivityLogger] = None,
        founder_profile_service: Optional[FounderProfileService] = None,
    ) -> None:
        settings = get_settings()
        self._extractor = extractor
        self._chunker = chunker
        self._embedding_service = embedding_service or EmbeddingService(
            region=settings.aws_region,
            model_id=settings.bedrock_embedding_model,
            bearer_token=settings.aws_bearer_token_bedrock,
        )
        self._chroma_store = chroma_store or ChromaStore(
            host=settings.chroma_host,
            port=settings.chroma_port,
            collection_name=settings.chroma_collection,
        )
        self._documents_repo = documents_repo or DocumentsRepository(
            supabase_url=settings.supabase_url,
            service_role_key=settings.supabase_service_role_key,
        )
        self._activity_logger = activity_logger or ActivityLogger()
        self._founder_profile_service = founder_profile_service or FounderProfileService()

    async def upload_document(
        self,
        *,
        user_id: str,
        file_name: str,
        content_bytes: bytes,
        source_label: Optional[str],
    ) -> dict:
        extracted_text = self._extractor(file_name, content_bytes)
        chunks = self._chunker(extracted_text)
        if not chunks:
            raise ValueError("Uploaded file contains no extractable text")

        embeddings = await self._embedding_service.embed_texts(chunks)

        vector_id = f"vec-{uuid4().hex}"
        vector_ids = [f"{vector_id}:{index}" for index in range(len(chunks))]

        metadata = [
            {
                "user_id": user_id,
                "file_name": file_name,
                "source_label": (source_label or "Founder Notes"),
                "vector_id": vector_ids[index],
                "vector_group": vector_id,
                "chunk_index": index,
            }
            for index in range(len(chunks))
        ]

        await self._chroma_store.upsert_chunks(
            ids=vector_ids,
            documents=chunks,
            embeddings=embeddings,
            metadatas=metadata,
        )

        normalized_source = source_label or "Founder Notes"
        document = await self._documents_repo.create_document(
            user_id=user_id,
            file_name=file_name,
            source_label=normalized_source,
            extracted_text=extracted_text,
            vector_id=vector_id,
        )

        result = {
            "document_id": document.get("id", ""),
            "vector_id": vector_id,
            "file_name": file_name,
            "source_label": normalized_source,
            "chunks_indexed": len(chunks),
        }

        try:
            await self._activity_logger.log(
                user_id=user_id,
                event_type="document_uploaded",
                metadata={
                    "document_id": result["document_id"],
                    "vector_id": vector_id,
                    "file_name": file_name,
                    "source_label": normalized_source,
                    "chunks_indexed": len(chunks),
                },
            )
        except Exception:
            pass

        return result

    async def search(self, *, user_id: str, query: str, top_k: int) -> list[dict]:
        embeddings = await self._embedding_service.embed_texts([query])
        if not embeddings:
            return []

        response = await self._chroma_store.query_chunks(
            query_embedding=embeddings[0],
            user_id=user_id,
            top_k=top_k,
        )

        documents = response.get("documents", [[]])
        metadatas = response.get("metadatas", [[]])
        distances = response.get("distances", [[]])

        doc_list = documents[0] if documents else []
        metadata_list = metadatas[0] if metadatas else []
        distance_list = distances[0] if distances else []

        results: list[dict] = []
        for index, text in enumerate(doc_list):
            meta = metadata_list[index] if index < len(metadata_list) else {}
            distance = distance_list[index] if index < len(distance_list) else None
            score = None if distance is None else round(max(0.0, 1.0 - float(distance)), 4)
            results.append(
                {
                    "text": text,
                    "file_name": meta.get("file_name", ""),
                    "source_label": meta.get("source_label", "Founder Notes"),
                    "document_id": meta.get("document_id", ""),
                    "vector_id": meta.get("vector_id", ""),
                    "score": score,
                }
            )

        return results

    async def list_documents(self, *, user_id: str) -> list[dict]:
        return await self._documents_repo.list_documents(user_id=user_id)

    async def founder_intelligence(self, *, user_id: str) -> dict:
        documents = await self._documents_repo.list_documents_for_profile(user_id=user_id, limit=30)
        return self._founder_profile_service.build(documents)
