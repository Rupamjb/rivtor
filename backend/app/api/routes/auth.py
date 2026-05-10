import httpx
from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel, EmailStr
from typing import Optional

from backend.app.core.config import get_settings


router = APIRouter(prefix="/auth", tags=["auth"])


class AuthRequest(BaseModel):
    email: EmailStr
    password: str


@router.post("/signup")
async def signup(payload: AuthRequest) -> dict[str, str]:
    settings = get_settings()
    if not settings.supabase_url or not settings.supabase_anon_key:
        raise HTTPException(status_code=503, detail="Supabase auth not configured")

    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.post(
            f"{settings.supabase_url}/auth/v1/signup",
            headers={"apikey": settings.supabase_anon_key},
            json={"email": payload.email, "password": payload.password},
        )

    if response.status_code >= 400:
        detail = response.json().get("msg") if response.headers.get("content-type", "").startswith("application/json") else response.text
        raise HTTPException(status_code=response.status_code, detail=detail or "Signup failed")

    data = response.json()
    return {
        "status": "signed_up",
        "user_id": data.get("user", {}).get("id", ""),
        "email": data.get("user", {}).get("email", payload.email),
    }


@router.post("/login")
async def login(payload: AuthRequest) -> dict[str, str]:
    settings = get_settings()
    if not settings.supabase_url or not settings.supabase_anon_key:
        raise HTTPException(status_code=503, detail="Supabase auth not configured")

    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.post(
            f"{settings.supabase_url}/auth/v1/token?grant_type=password",
            headers={"apikey": settings.supabase_anon_key},
            json={"email": payload.email, "password": payload.password},
        )

    if response.status_code >= 400:
        detail = response.json().get("msg") if response.headers.get("content-type", "").startswith("application/json") else response.text
        raise HTTPException(status_code=response.status_code, detail=detail or "Login failed")

    data = response.json()
    return {
        "status": "logged_in",
        "access_token": data.get("access_token", ""),
        "refresh_token": data.get("refresh_token", ""),
    }


@router.post("/logout")
async def logout(authorization: Optional[str] = Header(default=None)) -> dict[str, str]:
    settings = get_settings()
    if not authorization or not settings.supabase_url or not settings.supabase_anon_key:
        return {"status": "logged_out"}

    async with httpx.AsyncClient(timeout=10.0) as client:
        await client.post(
            f"{settings.supabase_url}/auth/v1/logout",
            headers={
                "apikey": settings.supabase_anon_key,
                "Authorization": authorization,
            },
        )

    return {"status": "logged_out"}
