from __future__ import annotations

import base64
import json
from typing import Any, Optional
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

import httpx

from backend.app.core.config import get_settings


class AzureImageService:
    def __init__(
        self,
        *,
        endpoint: Optional[str] = None,
        api_key: Optional[str] = None,
        deployment: Optional[str] = None,
        api_version: Optional[str] = None,
        default_size: Optional[str] = None,
        http_transport: Any = None,
    ) -> None:
        settings = get_settings()
        self._endpoint = (endpoint if endpoint is not None else settings.azure_openai_endpoint).strip().rstrip("/")
        self._api_key = (api_key if api_key is not None else settings.azure_openai_api_key).strip()
        self._deployment = (deployment if deployment is not None else settings.azure_openai_image_deployment).strip()
        self._api_version = (api_version if api_version is not None else settings.azure_openai_api_version).strip() or "2025-04-01-preview"
        self._default_size = (default_size if default_size is not None else settings.azure_openai_image_size).strip() or "1024x1024"
        self._timeout_sec = float(max(30, int(settings.azure_openai_image_timeout_sec)))
        self._http_transport = http_transport

    def is_configured(self) -> bool:
        endpoint_has_deployment = "/openai/deployments/" in self._endpoint
        return bool(self._endpoint and self._api_key and (self._deployment or endpoint_has_deployment))

    def _endpoint_url(self, *, api_version: Optional[str] = None) -> str:
        if not self.is_configured():
            raise RuntimeError("Azure image generation not configured")

        parts = urlsplit(self._endpoint)
        path = parts.path.rstrip("/")

        if "/openai/deployments/" in path:
            if not path.endswith("/images/generations"):
                path = f"{path}/images/generations"
        else:
            path = f"{path}/openai/deployments/{self._deployment}/images/generations"

        query = dict(parse_qsl(parts.query, keep_blank_values=False))
        query["api-version"] = api_version or self._api_version
        query_text = urlencode(query)

        return urlunsplit((parts.scheme, parts.netloc, path, query_text, ""))

    @staticmethod
    def _extract_error_text(response: httpx.Response) -> str:
        try:
            payload = response.json()
            if isinstance(payload, dict):
                error = payload.get("error")
                if isinstance(error, dict):
                    message = str(error.get("message") or "").strip()
                    if message:
                        return message
                detail = str(payload.get("detail") or "").strip()
                if detail:
                    return detail
        except Exception:
            pass

        text = response.text.strip()
        if not text:
            return ""
        try:
            parsed = json.loads(text)
            if isinstance(parsed, dict):
                error = parsed.get("error")
                if isinstance(error, dict):
                    message = str(error.get("message") or "").strip()
                    if message:
                        return message
        except Exception:
            pass
        return text[:220]

    def _candidate_versions(self) -> list[str]:
        versions = [self._api_version, "2025-04-01-preview", "2024-02-01"]
        unique: list[str] = []
        for version in versions:
            value = str(version or "").strip()
            if value and value not in unique:
                unique.append(value)
        return unique

    async def _request_generation(self, *, prompt: str, size: str) -> dict:
        payload = {
            "prompt": prompt,
            "n": 1,
            "size": size or self._default_size,
            "quality": "medium",
            "output_format": "png",
        }
        errors: list[str] = []

        for version in self._candidate_versions():
            url = self._endpoint_url(api_version=version)
            headers = {
                "api-key": self._api_key,
                "Content-Type": "application/json",
            }

            try:
                async with httpx.AsyncClient(timeout=self._timeout_sec, transport=self._http_transport) as client:
                    response = await client.post(url, headers=headers, json=payload)
            except httpx.TimeoutException as exc:
                errors.append(f"{version}: timeout")
                continue
            except httpx.HTTPError as exc:
                errors.append(f"{version}: unavailable")
                continue

            if response.status_code < 400:
                data = response.json()
                if isinstance(data, dict):
                    return data
                errors.append(f"{version}: invalid JSON payload")
                continue

            detail = self._extract_error_text(response)
            errors.append(f"{version}: {response.status_code} {detail}".strip())

        if errors:
            raise RuntimeError(f"Azure image generation failed: {errors[0]}")
        raise RuntimeError("Azure image generation unavailable")

    async def _download_image_bytes(self, *, image_url: str) -> dict:
        try:
            async with httpx.AsyncClient(timeout=self._timeout_sec, transport=self._http_transport) as client:
                response = await client.get(image_url)
        except httpx.TimeoutException as exc:
            raise RuntimeError("Azure image download timed out") from exc
        except httpx.HTTPError as exc:
            raise RuntimeError("Azure image download unavailable") from exc

        if response.status_code >= 400 or not response.content:
            raise RuntimeError("Azure image download failed")

        mime_type = str(response.headers.get("Content-Type") or "image/png").split(";")[0].strip() or "image/png"
        return {
            "bytes": bytes(response.content),
            "mime_type": mime_type,
        }

    async def generate_image_bytes(self, *, prompt: str, size: str = "") -> dict:
        data = await self._request_generation(prompt=prompt, size=size)
        items = data.get("data")
        if not isinstance(items, list) or not items:
            raise RuntimeError("Azure image generation failed")

        first = items[0]
        if not isinstance(first, dict):
            raise RuntimeError("Azure image generation failed")

        b64 = str(first.get("b64_json") or "").strip()
        if b64:
            try:
                raw = base64.b64decode(b64)
            except Exception as exc:
                raise RuntimeError("Azure image generation failed") from exc

            if not raw:
                raise RuntimeError("Azure image generation failed")

            return {
                "bytes": raw,
                "mime_type": "image/png",
            }

        image_url = str(first.get("url") or "").strip()
        if image_url:
            return await self._download_image_bytes(image_url=image_url)

        raise RuntimeError("Azure image generation failed: missing image payload")

    async def generate_image_data_url(self, *, prompt: str, size: str = "") -> dict:
        generated = await self.generate_image_bytes(prompt=prompt, size=size)
        raw = generated.get("bytes")
        if not isinstance(raw, (bytes, bytearray)):
            raise RuntimeError("Azure image generation failed")

        encoded = base64.b64encode(bytes(raw)).decode("ascii")
        mime = str(generated.get("mime_type") or "image/png")
        return {
            "data_url": f"data:{mime};base64,{encoded}",
            "mime_type": mime,
        }
