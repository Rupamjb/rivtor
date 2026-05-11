import asyncio
import json
from typing import Any

import httpx
from botocore.exceptions import BotoCoreError, ClientError, NoCredentialsError


class EmbeddingService:
    def __init__(
        self,
        *,
        region: str,
        model_id: str,
        client: Any = None,
        bearer_token: str = "",
        http_transport: Any = None,
    ) -> None:
        self._region = region
        self._model_id = model_id
        self._bearer_token = bearer_token.strip()
        self._http_transport = http_transport
        self._client = client

        if self._client is not None or self._bearer_token:
            return

        try:
            import boto3
        except ModuleNotFoundError as exc:
            raise RuntimeError("boto3 package is not installed") from exc

        self._client = boto3.client("bedrock-runtime", region_name=self._region)

    @staticmethod
    def _extract_embedding(response_body: dict) -> list[float]:
        embedding = response_body.get("embedding")
        if embedding is None:
            embeddings_by_type = response_body.get("embeddingsByType", {})
            embedding = embeddings_by_type.get("float")

        if not isinstance(embedding, list) or not embedding:
            raise RuntimeError("AWS Bedrock returned an invalid embedding payload")

        return [float(value) for value in embedding]

    async def _embed_with_bearer_token(self, texts: list[str]) -> list[list[float]]:
        headers = {
            "Authorization": f"Bearer {self._bearer_token}",
            "Content-Type": "application/json",
        }
        endpoint = f"https://bedrock-runtime.{self._region}.amazonaws.com/model/{self._model_id}/invoke"

        embeddings: list[list[float]] = []
        async with httpx.AsyncClient(timeout=30.0, transport=self._http_transport) as client:
            for text in texts:
                try:
                    response = await client.post(
                        endpoint,
                        headers=headers,
                        json={
                            "inputText": text,
                            "embeddingTypes": ["float"],
                        },
                    )
                except httpx.HTTPError as exc:
                    raise RuntimeError(f"AWS Bedrock embedding request failed: {exc}") from exc

                if response.status_code >= 400:
                    detail = response.text.strip() or f"HTTP {response.status_code}"
                    raise RuntimeError(f"AWS Bedrock embedding request failed: {detail}")

                embeddings.append(self._extract_embedding(response.json()))

        return embeddings

    async def _embed_with_boto(self, texts: list[str]) -> list[list[float]]:
        if self._client is None:
            raise RuntimeError("AWS Bedrock client is not configured")

        embeddings: list[list[float]] = []
        for text in texts:
            payload = {
                "inputText": text,
                "embeddingTypes": ["float"],
            }
            try:
                response = await asyncio.to_thread(
                    self._client.invoke_model,
                    modelId=self._model_id,
                    contentType="application/json",
                    accept="application/json",
                    body=json.dumps(payload),
                )
            except (NoCredentialsError, ClientError, BotoCoreError) as exc:
                raise RuntimeError(f"AWS Bedrock embedding request failed: {exc}") from exc

            body_stream = response.get("body")
            response_body = json.loads(body_stream.read()) if body_stream else {}
            embeddings.append(self._extract_embedding(response_body))

        return embeddings

    async def embed_texts(self, texts: list[str]) -> list[list[float]]:
        if not texts:
            return []
        if not self._model_id:
            raise RuntimeError("AWS Bedrock embedding model is not configured")
        if self._bearer_token:
            return await self._embed_with_bearer_token(texts)

        return await self._embed_with_boto(texts)
