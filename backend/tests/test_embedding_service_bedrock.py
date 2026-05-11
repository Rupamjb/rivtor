import asyncio
import json
from io import BytesIO

import httpx
from botocore.exceptions import NoCredentialsError

from backend.app.services.embedding_service import EmbeddingService


class FakeBedrockClient:
    def __init__(self, response_payload: dict):
        self._response_payload = response_payload

    def invoke_model(self, **_: dict):
        return {"body": BytesIO(json.dumps(self._response_payload).encode("utf-8"))}


class FailingBedrockClient:
    def invoke_model(self, **_: dict):
        raise NoCredentialsError()


def test_embed_texts_reads_embedding_field() -> None:
    service = EmbeddingService(
        region="us-east-1",
        model_id="amazon.titan-embed-text-v2:0",
        client=FakeBedrockClient({"embedding": [0.1, 0.2, 0.3]}),
    )

    embeddings = asyncio.run(service.embed_texts(["FounderOS memo"]))

    assert len(embeddings) == 1
    assert embeddings[0] == [0.1, 0.2, 0.3]


def test_embed_texts_reads_embeddings_by_type_float() -> None:
    service = EmbeddingService(
        region="us-east-1",
        model_id="amazon.titan-embed-text-v2:0",
        client=FakeBedrockClient({"embeddingsByType": {"float": [0.4, 0.5]}}),
    )

    embeddings = asyncio.run(service.embed_texts(["Roadmap"]))

    assert embeddings == [[0.4, 0.5]]


def test_embed_texts_requires_model_id() -> None:
    service = EmbeddingService(
        region="us-east-1",
        model_id="",
        client=FakeBedrockClient({"embedding": [0.1]}),
    )

    try:
        asyncio.run(service.embed_texts(["hello"]))
    except RuntimeError as exc:
        assert "AWS Bedrock embedding model is not configured" in str(exc)
    else:
        raise AssertionError("Expected missing model ID to raise RuntimeError")


def test_embed_texts_surfaces_bedrock_credentials_error() -> None:
    service = EmbeddingService(
        region="us-east-1",
        model_id="amazon.titan-embed-text-v2:0",
        client=FailingBedrockClient(),
    )

    try:
        asyncio.run(service.embed_texts(["hello"]))
    except RuntimeError as exc:
        assert "AWS Bedrock embedding request failed" in str(exc)
    else:
        raise AssertionError("Expected Bedrock failure to raise RuntimeError")


def test_embed_texts_uses_bearer_token_http_path() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        assert request.headers.get("Authorization") == "Bearer bearer-token"
        payload = json.loads(request.content.decode("utf-8"))
        assert payload["inputText"] == "hello"
        return httpx.Response(200, json={"embedding": [0.11, 0.22]})

    service = EmbeddingService(
        region="us-east-1",
        model_id="amazon.titan-embed-text-v2:0",
        bearer_token="bearer-token",
        http_transport=httpx.MockTransport(handler),
    )

    embeddings = asyncio.run(service.embed_texts(["hello"]))

    assert embeddings == [[0.11, 0.22]]


def test_embed_texts_surfaces_bearer_http_error() -> None:
    def handler(_: httpx.Request) -> httpx.Response:
        return httpx.Response(403, text='{"message":"AccessDeniedException"}')

    service = EmbeddingService(
        region="us-east-1",
        model_id="amazon.titan-embed-text-v2:0",
        bearer_token="bearer-token",
        http_transport=httpx.MockTransport(handler),
    )

    try:
        asyncio.run(service.embed_texts(["hello"]))
    except RuntimeError as exc:
        assert "AccessDeniedException" in str(exc)
    else:
        raise AssertionError("Expected bearer HTTP failure to raise RuntimeError")
