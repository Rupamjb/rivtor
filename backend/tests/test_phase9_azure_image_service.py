import asyncio
import base64

import httpx

from backend.app.services.azure_image_service import AzureImageService


def test_endpoint_url_uses_base_resource_endpoint() -> None:
    service = AzureImageService(
        endpoint="https://example-resource.cognitiveservices.azure.com",
        api_key="key",
        deployment="gpt-image-2",
        api_version="2025-04-21",
    )

    assert service._endpoint_url() == (
        "https://example-resource.cognitiveservices.azure.com/openai/deployments/"
        "gpt-image-2/images/generations?api-version=2025-04-21"
    )


def test_endpoint_url_normalizes_when_full_images_url_provided() -> None:
    service = AzureImageService(
        endpoint="https://example-resource.cognitiveservices.azure.com/openai/deployments/gpt-image-2/images/generations?api-version=2024-02-01",
        api_key="key",
        deployment="gpt-image-2",
        api_version="2025-04-21",
    )

    assert service._endpoint_url() == (
        "https://example-resource.cognitiveservices.azure.com/openai/deployments/"
        "gpt-image-2/images/generations?api-version=2025-04-21"
    )


def test_generate_image_bytes_falls_back_to_supported_api_version() -> None:
    calls: list[str] = []

    async def handler(request: httpx.Request) -> httpx.Response:
        calls.append(str(request.url))
        if "api-version=2025-04-21" in str(request.url):
            return httpx.Response(404, json={"error": {"message": "Resource not found"}})
        return httpx.Response(
            200,
            json={
                "data": [
                    {
                        "b64_json": base64.b64encode(b"img-bytes").decode("ascii"),
                    }
                ]
            },
        )

    service = AzureImageService(
        endpoint="https://example-resource.cognitiveservices.azure.com",
        api_key="key",
        deployment="gpt-image-2",
        api_version="2025-04-21",
        http_transport=httpx.MockTransport(handler),
    )

    result = asyncio.run(service.generate_image_bytes(prompt="founder launch visual"))

    assert result["bytes"] == b"img-bytes"
    assert len(calls) == 2


def test_generate_image_bytes_supports_url_based_response_payload() -> None:
    async def handler(request: httpx.Request) -> httpx.Response:
        url = str(request.url)
        if url.endswith("/images/generations?api-version=2025-04-01-preview"):
            return httpx.Response(
                200,
                json={
                    "data": [
                        {
                            "url": "https://cdn.example.com/image.png",
                        }
                    ]
                },
            )
        if url == "https://cdn.example.com/image.png":
            return httpx.Response(200, content=b"png-bytes", headers={"Content-Type": "image/png"})
        return httpx.Response(404, json={"error": {"message": "not found"}})

    service = AzureImageService(
        endpoint="https://example-resource.cognitiveservices.azure.com",
        api_key="key",
        deployment="gpt-image-2",
        api_version="2025-04-01-preview",
        http_transport=httpx.MockTransport(handler),
    )

    result = asyncio.run(service.generate_image_bytes(prompt="founder launch visual"))

    assert result["bytes"] == b"png-bytes"
    assert result["mime_type"] == "image/png"
