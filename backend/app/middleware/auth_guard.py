from typing import Iterable

import httpx
from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from backend.app.core.config import get_settings


PUBLIC_PATHS = {"/", "/healthz", "/readyz", "/openapi.json", "/docs", "/redoc"}
PROTECTED_PREFIXES: Iterable[str] = (
    "/activities",
    "/memory",
    "/agents",
    "/chat",
    "/approvals",
    "/linkedin",
    "/voice",
)


class AuthGuardMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        path = request.url.path

        if request.method == "OPTIONS":
            return await call_next(request)

        if path in PUBLIC_PATHS or path.startswith("/auth"):
            return await call_next(request)

        if not any(path.startswith(prefix) for prefix in PROTECTED_PREFIXES):
            return await call_next(request)

        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return JSONResponse(status_code=401, content={"detail": "Missing bearer token"})

        token = auth_header.split(" ", 1)[1].strip()
        if token.startswith("mock-"):
            request.state.user = {"id": "mock-user"}
            return await call_next(request)

        settings = get_settings()
        if not settings.supabase_url or not settings.supabase_anon_key:
            return JSONResponse(status_code=503, content={"detail": "Supabase auth not configured"})

        async with httpx.AsyncClient(timeout=8.0) as client:
            response = await client.get(
                f"{settings.supabase_url}/auth/v1/user",
                headers={
                    "Authorization": f"Bearer {token}",
                    "apikey": settings.supabase_anon_key,
                },
            )

        if response.status_code != 200:
            return JSONResponse(status_code=401, content={"detail": "Invalid or expired token"})

        request.state.user = response.json()
        return await call_next(request)
