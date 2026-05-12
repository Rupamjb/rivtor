class ChromaStore:
    def __init__(
        self,
        *,
        collection_name: str,
        api_key: str = "",
        tenant: str = "",
        database: str = "",
        cloud_host: str = "api.trychroma.com",
        cloud_port: int = 8000,
        cloud_ssl: bool = True,
    ) -> None:
        try:
            import chromadb
        except ModuleNotFoundError as exc:
            raise RuntimeError("chromadb package is not installed") from exc

        normalized_api_key = api_key.strip()
        normalized_tenant = tenant.strip()
        normalized_database = database.strip()

        if not normalized_api_key:
            raise RuntimeError("Chroma Cloud API key is required. Set CHROMA_API_KEY.")

        cloud_kwargs = {
            "api_key": normalized_api_key,
            "cloud_host": cloud_host,
            "cloud_port": cloud_port,
            "enable_ssl": cloud_ssl,
        }

        if normalized_tenant and normalized_database:
            try:
                self._client = chromadb.CloudClient(
                    tenant=normalized_tenant,
                    database=normalized_database,
                    **cloud_kwargs,
                )
            except Exception as exc:
                message = str(exc)
                if "Could not connect to tenant" in message or "Could not connect to database" in message:
                    self._client = chromadb.CloudClient(**cloud_kwargs)
                else:
                    raise
        else:
            self._client = chromadb.CloudClient(**cloud_kwargs)
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
