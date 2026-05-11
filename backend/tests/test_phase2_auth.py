from fastapi.testclient import TestClient

from backend.app.main import app


client = TestClient(app)


def test_health_endpoint_is_public() -> None:
    response = client.get("/healthz")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_protected_endpoint_requires_bearer_token() -> None:
    response = client.get("/activities/feed")
    assert response.status_code == 401
    assert response.json()["detail"] == "Missing bearer token"


def test_linkedin_endpoint_requires_bearer_token() -> None:
    response = client.post("/linkedin/connect", json={"step": "start"})
    assert response.status_code == 401
    assert response.json()["detail"] == "Missing bearer token"


def test_voice_endpoint_requires_bearer_token() -> None:
    response = client.post(
        "/voice/transcribe",
        files={"file": ("recording.webm", b"audio", "audio/webm")},
    )
    assert response.status_code == 401
    assert response.json()["detail"] == "Missing bearer token"


def test_cors_preflight_on_protected_endpoint_does_not_require_bearer_token() -> None:
    response = client.options(
        "/activities/feed",
        headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "GET",
        },
    )
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "http://localhost:3000"


def test_protected_endpoint_accepts_mock_bearer_token() -> None:
    response = client.get(
        "/activities/feed",
        headers={"Authorization": "Bearer mock-dev-token"},
    )
    assert response.status_code == 200
    assert response.json() == {"items": []}


def test_auth_signup_returns_clear_not_configured_error() -> None:
    response = client.post(
        "/auth/signup",
        json={"email": "founder@example.com", "password": "super-secret"},
    )
    assert response.status_code == 503
    assert response.json()["detail"] == "Supabase auth not configured"


def test_auth_login_returns_clear_not_configured_error() -> None:
    response = client.post(
        "/auth/login",
        json={"email": "founder@example.com", "password": "super-secret"},
    )
    assert response.status_code == 503
    assert response.json()["detail"] == "Supabase auth not configured"
