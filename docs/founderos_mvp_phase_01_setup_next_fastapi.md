# Phase 01 — Setup (Next.js + FastAPI)

## Goal

Create a runnable baseline with Next.js frontend, FastAPI backend, Supabase connectivity placeholders, and Docker/Azure CI foundations.

## In Scope (MVP)

- Next.js 15 app shell in `frontend/`.
- FastAPI service in `backend/` with health endpoints.
- Shared environment variable contracts (`.env.example`).
- Dockerfiles + `docker-compose.yml` for local stack.
- GitHub Actions deploy pipeline to Azure Container Apps.

## Tasks

### Frontend
- Ensure `npm run dev/build/start` uses Next.js.
- Keep global styling aligned with landing tokens from `frontend/src/index.css`.
- Add a clean MVP base page in App Router for future workspace screens.

### Backend
- Keep FastAPI app bootstrapped with `/healthz`.
- Prepare package structure for upcoming auth, memory, agent, approvals routers.

### Infra/DevOps
- Verify compose services: `frontend`, `backend`, `chroma`.
- Keep Supabase external (managed service).
- Keep Azure workflow image build/push/deploy wired.

## Exit Criteria

- `frontend` builds with Next.
- `backend` compiles and starts with uvicorn.
- `docker compose config` is valid.
- Architecture and deployment docs reflect Next.js + FastAPI.
