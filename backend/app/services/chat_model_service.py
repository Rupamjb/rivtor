import asyncio
import json
from typing import Any, List, Optional

import httpx
from botocore.exceptions import BotoCoreError, ClientError, NoCredentialsError


class ChatModelService:
    def __init__(
        self,
        *,
        region: str,
        model_id: str,
        fallback_model_ids: Optional[List[str]] = None,
        bearer_token: str = "",
        client: Any = None,
        http_transport: Any = None,
    ) -> None:
        self._region = region
        requested_models = [model_id, *(fallback_model_ids or [])]
        normalized_models: list[str] = []
        for entry in requested_models:
            value = str(entry).strip()
            if value and value not in normalized_models:
                normalized_models.append(value)
        self._model_ids = normalized_models
        self._bearer_token = bearer_token.strip()
        self._client = client
        self._http_transport = http_transport

        if self._bearer_token or self._client is not None:
            return

        try:
            import boto3
        except ModuleNotFoundError as exc:
            raise RuntimeError("boto3 package is not installed") from exc

        self._client = boto3.client("bedrock-runtime", region_name=self._region)

    @staticmethod
    def _extract_text(payload: dict) -> str:
        output = payload.get("output", {})
        message = output.get("message", {}) if isinstance(output, dict) else {}
        content = message.get("content", []) if isinstance(message, dict) else []
        if isinstance(content, list):
            texts = [item.get("text", "") for item in content if isinstance(item, dict)]
            joined = "".join(texts).strip()
            if joined:
                return joined

        text = payload.get("completion")
        if isinstance(text, str) and text.strip():
            return text.strip()

        raise RuntimeError("AWS Bedrock returned an invalid chat payload")

    async def _generate_with_bearer(self, *, model_id: str, message_text: str) -> str:
        endpoint = f"https://bedrock-runtime.{self._region}.amazonaws.com/model/{model_id}/converse"
        headers = {
            "Authorization": f"Bearer {self._bearer_token}",
            "Content-Type": "application/json",
        }
        request_body = {
            "messages": [
                {
                    "role": "user",
                    "content": [{"text": message_text}],
                }
            ],
            "inferenceConfig": {
                "maxTokens": 900,
                "temperature": 0.2,
                "topP": 0.9,
            },
        }

        try:
            async with httpx.AsyncClient(timeout=45.0, transport=self._http_transport) as client:
                response = await client.post(endpoint, headers=headers, json=request_body)
        except httpx.HTTPError as exc:
            raise RuntimeError(f"AWS Bedrock chat request failed: {exc}") from exc

        if response.status_code >= 400:
            detail = response.text.strip() or f"HTTP {response.status_code}"
            raise RuntimeError(f"AWS Bedrock chat request failed: {detail}")

        return self._extract_text(response.json())

    async def _generate_with_boto(self, *, model_id: str, message_text: str) -> str:
        if self._client is None:
            raise RuntimeError("AWS Bedrock client is not configured")

        request_body = {
            "messages": [
                {
                    "role": "user",
                    "content": [{"text": message_text}],
                }
            ],
            "inferenceConfig": {
                "maxTokens": 900,
                "temperature": 0.2,
                "topP": 0.9,
            },
        }

        try:
            response = await asyncio.to_thread(
                self._client.converse,
                modelId=model_id,
                messages=request_body["messages"],
                inferenceConfig=request_body["inferenceConfig"],
            )
        except (NoCredentialsError, ClientError, BotoCoreError) as exc:
            raise RuntimeError(f"AWS Bedrock chat request failed: {exc}") from exc

        if not isinstance(response, dict):
            raise RuntimeError("AWS Bedrock returned an invalid chat payload")

        return self._extract_text(response)

    async def generate_response(
        self,
        *,
        system_prompt: str,
        user_query: str,
        memory_context: str,
        conversation_context: str = "No prior conversation available.",
    ) -> str:
        if not self._model_ids:
            raise RuntimeError("AWS Bedrock chat model is not configured")

        message_text = (
            f"{system_prompt}\n\n"
            f"Conversation history:\n{conversation_context or 'No prior conversation available.'}\n\n"
            f"User request:\n{user_query}\n\n"
            f"Retrieved memory context:\n{memory_context or 'No relevant context available.'}\n\n"
            "Answer clearly and reference the provided context when relevant."
        )

        errors: list[str] = []
        for model_id in self._model_ids:
            try:
                if self._bearer_token:
                    return await self._generate_with_bearer(model_id=model_id, message_text=message_text)
                return await self._generate_with_boto(model_id=model_id, message_text=message_text)
            except RuntimeError as exc:
                errors.append(f"{model_id}: {exc}")

        detail = "; ".join(errors) if errors else "No configured models"
        raise RuntimeError(f"All Bedrock chat models failed: {detail}")
