import asyncio
from unittest.mock import AsyncMock, patch

import httpx

from backend.app.services.generations_repo import GenerationsRepository


def _repo() -> GenerationsRepository:
    return GenerationsRepository(supabase_url="https://supabase.local", service_role_key="service-key")


def test_get_generation_returns_none_when_not_found() -> None:
    repo = _repo()
    mock_client = AsyncMock()
    mock_client.get = AsyncMock(return_value=httpx.Response(200, json=[]))

    with patch("backend.app.services.generations_repo.httpx.AsyncClient") as client_cls:
        client_cls.return_value.__aenter__.return_value = mock_client
        result = asyncio.run(repo.get_generation(user_id="user-1", generation_id="missing"))

    assert result is None


def test_update_generation_status_returns_normalized_row() -> None:
    repo = _repo()
    mock_client = AsyncMock()
    mock_client.patch = AsyncMock(
        return_value=httpx.Response(
            200,
            json=[
                {
                    "id": "gen-1",
                    "agent_type": "content",
                    "status": "approved",
                    "output_json": "{\"query\":\"launch post\"}",
                    "created_at": "2026-05-11T12:00:00Z",
                    "updated_at": "2026-05-11T12:10:00Z",
                }
            ],
        )
    )

    with patch("backend.app.services.generations_repo.httpx.AsyncClient") as client_cls:
        client_cls.return_value.__aenter__.return_value = mock_client
        result = asyncio.run(
            repo.update_generation_status(
                user_id="user-1",
                generation_id="gen-1",
                next_status="approved",
            )
        )

    assert result["status"] == "approved"
    assert result["output_json"]["query"] == "launch post"


def test_update_generation_status_raises_when_supabase_returns_error() -> None:
    repo = _repo()
    mock_client = AsyncMock()
    mock_client.patch = AsyncMock(return_value=httpx.Response(500, json={"error": "down"}))

    with patch("backend.app.services.generations_repo.httpx.AsyncClient") as client_cls:
        client_cls.return_value.__aenter__.return_value = mock_client
        try:
            asyncio.run(
                repo.update_generation_status(
                    user_id="user-1",
                    generation_id="gen-1",
                    next_status="approved",
                )
            )
        except RuntimeError as exc:
            assert str(exc) == "Failed to update generation status"
        else:
            raise AssertionError("Expected update failure")
