class ChromaStore:
    def __init__(self, *, host: str, port: int, collection_name: str) -> None:
        try:
            import chromadb
        except ModuleNotFoundError as exc:
            raise RuntimeError("chromadb package is not installed") from exc

        self._client = chromadb.HttpClient(host=host, port=port)
        self._collection = self._client.get_or_create_collection(name=collection_name)

    async def upsert_chunks(
        self,
        *,
        ids: list[str],
        documents: list[str],
        embeddings: list[list[float]],
        metadatas: list[dict],
    ) -> None:
        self._collection.upsert(
            ids=ids,
            documents=documents,
            embeddings=embeddings,
            metadatas=metadatas,
        )

    async def query_chunks(
        self,
        *,
        query_embedding: list[float],
        user_id: str,
        top_k: int,
    ) -> dict:
        return self._collection.query(
            query_embeddings=[query_embedding],
            n_results=top_k,
            where={"user_id": user_id},
            include=["documents", "metadatas", "distances"],
        )
