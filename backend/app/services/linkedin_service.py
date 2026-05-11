import base64
from datetime import datetime, timedelta, timezone
from typing import Optional
from uuid import uuid4

from backend.app.core.config import get_settings
from backend.app.services.activity_logger import ActivityLogger
from backend.app.services.azure_image_service import AzureImageService
from backend.app.services.generations_repo import GenerationsRepository
from backend.app.services.linkedin_api_client import LinkedInApiClient
from backend.app.services.linkedin_connections_repo import LinkedInConnectionsRepository
from backend.app.services.linkedin_publications_repo import LinkedInPublicationsRepository
from backend.app.services.text_sanitizer import markdown_to_plain_text


class LinkedInService:
    def __init__(
        self,
        *,
        linkedin_api_client: Optional[LinkedInApiClient] = None,
        connections_repo: Optional[LinkedInConnectionsRepository] = None,
        publications_repo: Optional[LinkedInPublicationsRepository] = None,
        generations_repo: Optional[GenerationsRepository] = None,
        activity_logger: Optional[ActivityLogger] = None,
        image_service: Optional[AzureImageService] = None,
        redirect_uri: Optional[str] = None,
    ) -> None:
        settings = get_settings()
        self._linkedin_api_client = linkedin_api_client or LinkedInApiClient(
            client_id=settings.linkedin_client_id,
            client_secret=settings.linkedin_client_secret,
            redirect_uri=redirect_uri or settings.linkedin_redirect_uri,
            scope=settings.linkedin_scope,
        )
        self._connections_repo = connections_repo or LinkedInConnectionsRepository(
            supabase_url=settings.supabase_url,
            service_role_key=settings.supabase_service_role_key,
        )
        self._publications_repo = publications_repo or LinkedInPublicationsRepository(
            supabase_url=settings.supabase_url,
            service_role_key=settings.supabase_service_role_key,
        )
        self._generations_repo = generations_repo or GenerationsRepository(
            supabase_url=settings.supabase_url,
            service_role_key=settings.supabase_service_role_key,
        )
        self._activity_logger = activity_logger or ActivityLogger()
        self._image_service = image_service or AzureImageService()

    @staticmethod
    def _iso_now() -> str:
        return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")

    @staticmethod
    def _is_expired(iso_value: str) -> bool:
        if not iso_value:
            return True
        try:
            timestamp = datetime.fromisoformat(iso_value.replace("Z", "+00:00"))
        except ValueError:
            return True
        return timestamp <= datetime.now(timezone.utc)

    @staticmethod
    def _decode_image_data_url(data_url: str) -> tuple[bytes, str]:
        value = str(data_url or "").strip()
        if not value.startswith("data:") or "," not in value:
            return b"", ""

        header, payload = value.split(",", 1)
        mime_type = "image/png"
        if ";" in header:
            mime_type = header[5:].split(";", 1)[0] or "image/png"

        try:
            raw = base64.b64decode(payload)
        except Exception:
            return b"", ""

        if not raw:
            return b"", ""
        return raw, mime_type

    async def connect(
        self,
        *,
        user_id: str,
        step: str,
        code: Optional[str],
        state: Optional[str],
        force_reconnect: bool,
    ) -> dict:
        normalized_step = (step or "start").strip().lower()
        if normalized_step not in {"start", "complete", "status"}:
            raise ValueError("Invalid connect step")

        if normalized_step in {"start", "complete"}:
            self._linkedin_api_client.validate_config()

        if normalized_step == "status":
            row = await self._connections_repo.get_connection(user_id=user_id)
            if not row:
                return {
                    "step": "status",
                    "connection_status": "disconnected",
                    "linkedin_member_urn": None,
                    "connected_at": None,
                }
            return {
                "step": "status",
                "connection_status": str(row.get("connection_status") or "disconnected"),
                "linkedin_member_urn": row.get("linkedin_member_urn"),
                "connected_at": row.get("connected_at"),
            }

        if normalized_step == "start":
            row = await self._connections_repo.get_connection(user_id=user_id)
            status = str(row.get("connection_status") or "") if isinstance(row, dict) else ""
            if status == "connected" and not force_reconnect:
                return {
                    "step": "start",
                    "connection_status": "connected",
                    "authorization_url": None,
                    "state": None,
                    "connected_at": row.get("connected_at"),
                }

            oauth_state = uuid4().hex
            expires_at = (datetime.now(timezone.utc) + timedelta(minutes=15)).isoformat().replace("+00:00", "Z")
            authorization_url = await self._linkedin_api_client.build_authorization_url(state=oauth_state)

            await self._connections_repo.upsert_pending_connection(
                user_id=user_id,
                oauth_state=oauth_state,
                expires_at=expires_at,
            )

            return {
                "step": "start",
                "connection_status": "pending",
                "authorization_url": authorization_url,
                "state": oauth_state,
                "connected_at": None,
            }

        if not code or not state:
            raise ValueError("code and state are required for complete step")

        row = await self._connections_repo.get_connection(user_id=user_id)
        if not row:
            raise ValueError("No pending LinkedIn authorization")

        existing_status = str(row.get("connection_status") or "")
        if existing_status == "connected" and not row.get("oauth_state"):
            return {
                "step": "complete",
                "connection_status": "connected",
                "linkedin_member_urn": row.get("linkedin_member_urn") or "",
                "connected_at": row.get("connected_at") or self._iso_now(),
            }

        expected_state = str(row.get("oauth_state") or "")
        if expected_state != state:
            raise ValueError("OAuth state mismatch")

        expires_at = str(row.get("oauth_state_expires_at") or "")
        if self._is_expired(expires_at):
            raise ValueError("OAuth state expired")

        token_payload = await self._linkedin_api_client.exchange_code_for_token(code=code)
        access_token = str(token_payload.get("access_token") or "")
        access_token_expires_at = str(token_payload.get("access_token_expires_at") or "")
        if not access_token or not access_token_expires_at:
            raise RuntimeError("LinkedIn authorization failed")

        linkedin_member_urn = await self._linkedin_api_client.fetch_member_urn(access_token=access_token)

        connected_row = await self._connections_repo.mark_connected(
            user_id=user_id,
            access_token=access_token,
            access_token_expires_at=access_token_expires_at,
            linkedin_member_urn=linkedin_member_urn,
        )

        await self._activity_logger.log(
            user_id=user_id,
            event_type="linkedin_connected",
            metadata={
                "linkedin_member_urn": linkedin_member_urn,
            },
        )

        return {
            "step": "complete",
            "connection_status": "connected",
            "linkedin_member_urn": linkedin_member_urn,
            "connected_at": connected_row.get("connected_at") or self._iso_now(),
        }

    async def publish(self, *, user_id: str, generation_id: str) -> dict:
        generation = await self._generations_repo.get_generation(user_id=user_id, generation_id=generation_id)
        if not generation:
            raise LookupError("Generation not found")

        if str(generation.get("agent_type") or "") != "content":
            raise ValueError("Only content generations can be published")

        if str(generation.get("status") or "") != "approved":
            raise ValueError("Invalid status transition")

        output_json = generation.get("output_json") if isinstance(generation, dict) else {}
        if not isinstance(output_json, dict):
            output_json = {}
        format_type = str(output_json.get("format") or "linkedin").strip().lower()
        if format_type != "linkedin":
            raise ValueError("LinkedIn publish supports linkedin format only")

        self._linkedin_api_client.validate_config()

        connection = await self._connections_repo.get_connection(user_id=user_id)
        if not connection:
            raise ValueError("LinkedIn not connected")

        if str(connection.get("connection_status") or "") != "connected":
            raise ValueError("LinkedIn not connected")

        access_token = str(connection.get("access_token") or "").strip()
        author_urn = str(connection.get("linkedin_member_urn") or "").strip()
        if not access_token or not author_urn:
            raise ValueError("LinkedIn not connected")

        post_text = markdown_to_plain_text(str(generation.get("content") or output_json.get("draft") or "")).strip()
        if not post_text:
            raise ValueError("Generation content is empty")

        image_bytes = b""
        image_content_type = ""
        image_data_url = str(output_json.get("image_data_url") or "").strip()
        if image_data_url:
            image_bytes, image_content_type = self._decode_image_data_url(image_data_url)

        image_prompt = str(output_json.get("image_prompt") or "").strip()
        if not image_bytes and image_prompt and self._image_service.is_configured():
            try:
                generated_image = await self._image_service.generate_image_bytes(prompt=image_prompt)
                raw = generated_image.get("bytes")
                if isinstance(raw, (bytes, bytearray)) and raw:
                    image_bytes = bytes(raw)
                    image_content_type = str(generated_image.get("mime_type") or "image/png")
            except Exception:
                image_bytes = b""
                image_content_type = ""

        try:
            post_result = await self._linkedin_api_client.publish_post(
                access_token=access_token,
                author_urn=author_urn,
                content=post_text,
                image_bytes=image_bytes,
                image_content_type=image_content_type,
            )
        except RuntimeError as exc:
            error_text = str(exc)
            await self._publications_repo.create_publication_attempt(
                user_id=user_id,
                generation_id=generation_id,
                status="failed",
                error_message=error_text,
            )
            await self._activity_logger.log(
                user_id=user_id,
                event_type="linkedin_publish_failed",
                metadata={
                    "generation_id": generation_id,
                    "error": error_text,
                },
            )
            if error_text == "LinkedIn rate limited":
                raise RuntimeError("LinkedIn rate limited") from exc
            raise RuntimeError("LinkedIn publish unavailable") from exc

        linkedin_post_urn = str(post_result.get("linkedin_post_urn") or "").strip()
        linkedin_post_url = post_result.get("linkedin_post_url")

        await self._publications_repo.create_publication_attempt(
            user_id=user_id,
            generation_id=generation_id,
            status="published",
            linkedin_post_urn=linkedin_post_urn,
            linkedin_post_url=linkedin_post_url,
        )

        await self._generations_repo.update_generation_status(
            user_id=user_id,
            generation_id=generation_id,
            next_status="published",
        )

        published_at = self._iso_now()
        await self._activity_logger.log(
            user_id=user_id,
            event_type="content_published",
            metadata={
                "generation_id": generation_id,
                "channel": "linkedin",
                "linkedin_post_urn": linkedin_post_urn,
                "linkedin_post_url": linkedin_post_url,
                "status": "published",
                "published_at": published_at,
            },
        )

        return {
            "generation_id": generation_id,
            "status": "published",
            "channel": "linkedin",
            "linkedin_post_urn": linkedin_post_urn,
            "linkedin_post_url": linkedin_post_url,
            "published_at": published_at,
        }
