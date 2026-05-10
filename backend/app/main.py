from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.api.router import api_router
from backend.app.middleware.auth_guard import AuthGuardMiddleware


app = FastAPI(
    title="FounderOS Backend",
    version="0.1.0",
    description="FastAPI backend for FounderOS MVP",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(AuthGuardMiddleware)


@app.get("/")
def root() -> dict[str, str]:
    return {"service": "founderos-backend", "status": "running"}


@app.get("/healthz")
def healthz() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/readyz")
def readyz() -> dict[str, str]:
    return {"status": "ready"}


app.include_router(api_router)
