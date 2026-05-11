from datetime import datetime, timezone
from typing import Optional

from backend.app.core.config import get_settings
from backend.app.services.activity_logger import ActivityLogger
from backend.app.services.approvals_repo import ApprovalsRepository
from backend.app.services.generations_repo import GenerationsRepository


class ApprovalService:
    def __init__(
        self,
        *,
        generations_repo: Optional[GenerationsRepository] = None,
        activity_logger: Optional[ActivityLogger] = None,
        approvals_repo: Optional[ApprovalsRepository] = None,
    ) -> None:
        settings = get_settings()
        self._generations_repo = generations_repo or GenerationsRepository(
            supabase_url=settings.supabase_url,
            service_role_key=settings.supabase_service_role_key,
        )
        self._activity_logger = activity_logger or ActivityLogger()
        self._approvals_repo = approvals_repo or ApprovalsRepository(
            supabase_url=settings.supabase_url,
            service_role_key=settings.supabase_service_role_key,
        )

    async def _record_approval(
        self,
        *,
        user_id: str,
        generation_id: str,
        status: str,
        note: str,
        reason: str,
    ) -> None:
        try:
            await self._approvals_repo.create_approval(
                user_id=user_id,
                generation_id=generation_id,
                status=status,
                note=note,
                reason=reason,
            )
        except Exception:
            pass

    @staticmethod
    def _updated_at(row: dict) -> str:
        value = str(row.get("updated_at") or "").strip()
        if value:
            return value
        return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")

    async def _load_generation(self, *, user_id: str, generation_id: str) -> dict:
        try:
            row = await self._generations_repo.get_generation(user_id=user_id, generation_id=generation_id)
        except RuntimeError as exc:
            raise RuntimeError("Approval persistence unavailable") from exc

        if not row:
            raise LookupError("Generation not found")
        return row

    async def _set_status(
        self,
        *,
        user_id: str,
        generation_id: str,
        next_status: str,
    ) -> dict:
        try:
            return await self._generations_repo.update_generation_status(
                user_id=user_id,
                generation_id=generation_id,
                next_status=next_status,
            )
        except RuntimeError as exc:
            if str(exc) == "Generation not found":
                raise LookupError("Generation not found") from exc
            raise RuntimeError("Approval persistence unavailable") from exc

    async def approve(self, *, user_id: str, generation_id: str, note: Optional[str]) -> dict:
        current = await self._load_generation(user_id=user_id, generation_id=generation_id)
        previous_status = str(current.get("status") or "")
        if previous_status != "approval_required":
            raise ValueError("Invalid status transition")

        updated = await self._set_status(user_id=user_id, generation_id=generation_id, next_status="approved")
        agent_type = str(updated.get("agent_type") or current.get("agent_type") or "content")

        await self._record_approval(
            user_id=user_id,
            generation_id=generation_id,
            status="approved",
            note=note or "",
            reason="",
        )

        await self._activity_logger.log(
            user_id=user_id,
            event_type="approval_approved",
            metadata={
                "generation_id": generation_id,
                "agent_type": agent_type,
                "previous_status": previous_status,
                "status": "approved",
                "note": note or "",
            },
        )

        return {
            "generation_id": generation_id,
            "agent_type": agent_type,
            "previous_status": previous_status,
            "status": "approved",
            "approval_required": False,
            "updated_at": self._updated_at(updated),
        }

    async def reject(self, *, user_id: str, generation_id: str, reason: Optional[str]) -> dict:
        current = await self._load_generation(user_id=user_id, generation_id=generation_id)
        previous_status = str(current.get("status") or "")
        if previous_status != "approval_required":
            raise ValueError("Invalid status transition")

        updated = await self._set_status(user_id=user_id, generation_id=generation_id, next_status="rejected")
        agent_type = str(updated.get("agent_type") or current.get("agent_type") or "content")

        await self._record_approval(
            user_id=user_id,
            generation_id=generation_id,
            status="rejected",
            note="",
            reason=reason or "",
        )

        await self._activity_logger.log(
            user_id=user_id,
            event_type="approval_rejected",
            metadata={
                "generation_id": generation_id,
                "agent_type": agent_type,
                "previous_status": previous_status,
                "status": "rejected",
                "reason": reason or "",
            },
        )

        return {
            "generation_id": generation_id,
            "agent_type": agent_type,
            "previous_status": previous_status,
            "status": "rejected",
            "approval_required": True,
            "updated_at": self._updated_at(updated),
        }

    async def publish(self, *, user_id: str, generation_id: str) -> dict:
        current = await self._load_generation(user_id=user_id, generation_id=generation_id)
        previous_status = str(current.get("status") or "")
        if previous_status != "approved":
            raise ValueError("Invalid status transition")

        output_json = current.get("output_json") if isinstance(current, dict) else {}
        if isinstance(output_json, dict):
            draft_format = str(output_json.get("format") or "").strip().lower()
            if draft_format == "linkedin":
                raise ValueError("Use /linkedin/publish for LinkedIn drafts")

        updated = await self._set_status(user_id=user_id, generation_id=generation_id, next_status="published")
        agent_type = str(updated.get("agent_type") or current.get("agent_type") or "content")

        await self._record_approval(
            user_id=user_id,
            generation_id=generation_id,
            status="published",
            note="",
            reason="",
        )

        await self._activity_logger.log(
            user_id=user_id,
            event_type="content_published",
            metadata={
                "generation_id": generation_id,
                "agent_type": agent_type,
                "previous_status": previous_status,
                "status": "published",
            },
        )

        return {
            "generation_id": generation_id,
            "previous_status": previous_status,
            "status": "published",
            "published": True,
            "updated_at": self._updated_at(updated),
        }
