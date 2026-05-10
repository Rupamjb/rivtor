# Phase 01 Setup (Next.js + FastAPI) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up a production-ready backend foundation for FounderOS that matches a Next.js frontend (already rewritten) without changing frontend code in this phase.

**Architecture:** Frontend is treated as an existing Next.js client. This phase builds a clean FastAPI service with environment/config contracts, modular routing skeletons, health/readiness endpoints, and Docker/Azure deployment baseline. All core product features (auth, memory, agents, approvals) are scaffolded as API boundaries now and implemented in later phases.

**Tech Stack:** FastAPI, Uvicorn, Pydantic Settings, Python 3.11, Supabase (external), ChromaDB (container), Docker Compose, GitHub Actions (Azure-compatible).

---

## Scope for This Phase

### In Scope
- Backend-only setup and scaffolding.
- API contracts and router placeholders for PRD endpoints.
- Docker and CI/CD plumbing for backend + Next frontend compatibility.
- Shared env contract documentation.

### Explicitly Deferred
- No frontend implementation changes in this phase.
- No feature logic for auth/memory/agents/linkedin yet (only scaffolds/contracts).
- No background worker stack (Redis/Celery/K8s), per PRD constraints.

---

## Target File Structure (End of Phase)

```text
backend/
  app/
    main.py
    core/
      config.py
      logging.py
      deps.py
    api/
      router.py
      routes/
        health.py
        auth.py
        memory.py
        agents.py
        chat.py
        linkedin.py
        voice.py
        approvals.py
        activities.py
    models/
      common.py
    services/
      supabase_client.py
      chroma_client.py
      ai_client.py
    schemas/
      health.py
      errors.py
  tests/
    test_health.py
    test_router_mounts.py
  requirements.txt
  Dockerfile
  .dockerignore

docker-compose.yml
.env.example
.github/workflows/deploy.yml
```

---

### Task 1: Bootstrap Backend Project Skeleton

**Files:**
- Create: `backend/app/main.py`
- Create: `backend/app/api/router.py`
- Create: `backend/app/api/routes/health.py`
- Create: `backend/requirements.txt`
- Create: `backend/tests/test_health.py`

- [ ] **Step 1: Write failing health API test**

Create test that expects:
- `GET /healthz` -> `200`
- body contains `{"status": "ok"}`

- [ ] **Step 2: Run test and confirm fail**

Run: `pytest backend/tests/test_health.py -v`

- [ ] **Step 3: Implement minimal FastAPI app + health route**

Add app bootstrap and mount base router.

- [ ] **Step 4: Re-run test and confirm pass**

Run: `pytest backend/tests/test_health.py -v`

- [ ] **Step 5: Commit**

`git commit -m "chore(backend): bootstrap FastAPI app with health endpoint"`

---

### Task 2: Add Environment and Settings Contract

**Files:**
- Create: `backend/app/core/config.py`
- Create: `backend/app/core/deps.py`
- Create: `.env.example`
- Modify: `backend/app/main.py`

- [ ] **Step 1: Write failing settings test**

Add test ensuring settings object loads and required keys exist as fields:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `TAVILY_API_KEY` or `SERPER_API_KEY`

- [ ] **Step 2: Run test and confirm fail**

Run: `pytest backend/tests/test_settings.py -v`

- [ ] **Step 3: Implement settings module using Pydantic Settings**

Use sane defaults only for non-secret local values.

- [ ] **Step 4: Add `.env.example` aligned with backend + Next runtime contract**

Include `NEXT_PUBLIC_API_BASE_URL` for frontend compatibility, but no frontend code changes.

- [ ] **Step 5: Re-run settings tests**

Run: `pytest backend/tests/test_settings.py -v`

- [ ] **Step 6: Commit**

`git commit -m "chore(config): add environment contract and settings loader"`

---

### Task 3: Scaffold PRD API Surface (No Business Logic Yet)

**Files:**
- Create: `backend/app/api/routes/auth.py`
- Create: `backend/app/api/routes/memory.py`
- Create: `backend/app/api/routes/agents.py`
- Create: `backend/app/api/routes/chat.py`
- Create: `backend/app/api/routes/linkedin.py`
- Create: `backend/app/api/routes/voice.py`
- Create: `backend/app/api/routes/approvals.py`
- Create: `backend/app/api/routes/activities.py`
- Modify: `backend/app/api/router.py`
- Create: `backend/tests/test_router_mounts.py`

- [ ] **Step 1: Write failing route-mount tests**

Assert each PRD endpoint path returns at least non-404 placeholder response:
- `/auth/*`, `/memory/*`, `/agents/*`, `/chat/query`, `/linkedin/*`, `/voice/transcribe`, `/approvals/*`, `/activities/feed`.

- [ ] **Step 2: Run tests and confirm fail**

Run: `pytest backend/tests/test_router_mounts.py -v`

- [ ] **Step 3: Implement route placeholders and central router mount**

Return `501 Not Implemented` or `200 mock` consistently with typed response envelope.

- [ ] **Step 4: Re-run tests and confirm pass**

Run: `pytest backend/tests/test_router_mounts.py -v`

- [ ] **Step 5: Commit**

`git commit -m "chore(api): scaffold FounderOS MVP endpoint surface"`

---

### Task 4: Add Service Adapters (Supabase, Chroma, OpenAI)

**Files:**
- Create: `backend/app/services/supabase_client.py`
- Create: `backend/app/services/chroma_client.py`
- Create: `backend/app/services/ai_client.py`
- Create: `backend/app/models/common.py`
- Create: `backend/app/schemas/errors.py`

- [ ] **Step 1: Define typed adapter interfaces**

Create lightweight client wrappers with lazy init and explicit error mapping.

- [ ] **Step 2: Add smoke tests with dependency injection/mocks**

No real external calls yet; verify import/init and failure handling.

- [ ] **Step 3: Standardize API error envelope**

Ensure consistent shape for future frontend consumption.

- [ ] **Step 4: Run adapter tests**

Run: `pytest backend/tests -v -k "adapter or client or health or router"`

- [ ] **Step 5: Commit**

`git commit -m "chore(services): add external client adapters and error envelope"`

---

### Task 5: Dockerize Backend and Compose with Existing Next Frontend

**Files:**
- Create: `backend/Dockerfile`
- Create: `backend/.dockerignore`
- Create: `docker-compose.yml`
- Modify: `.env.example`

- [ ] **Step 1: Create backend image definition**

Use `python:3.11-slim`, install requirements, run uvicorn on `0.0.0.0:8000`.

- [ ] **Step 2: Compose services for local MVP stack**

Compose should include:
- `frontend` (assumed Next app)
- `backend`
- `chroma`

- [ ] **Step 3: Validate compose syntax**

Run: `docker compose config`

- [ ] **Step 4: Verify backend health in compose**

Run: `docker compose up -d backend chroma`
Then: `curl http://localhost:8000/healthz`

- [ ] **Step 5: Commit**

`git commit -m "chore(infra): add backend Dockerfile and compose baseline"`

---

### Task 6: Azure-Compatible CI/CD Scaffold

**Files:**
- Create: `.github/workflows/deploy.yml`
- Modify: `README.md` (deployment variables section)

- [ ] **Step 1: Add GitHub Actions workflow scaffold**

Pipeline stages:
- build image(s)
- push to ACR
- deploy to Azure Container Apps

- [ ] **Step 2: Document required secrets/variables**

At minimum:
- `AZURE_CREDENTIALS`
- `ACR_LOGIN_SERVER`
- `ACR_USERNAME`
- `ACR_PASSWORD`
- app/environment variables names

- [ ] **Step 3: Validate workflow syntax locally (lightweight)**

Run YAML lint if configured, otherwise manual validation pass.

- [ ] **Step 4: Commit**

`git commit -m "chore(ci): add Azure deploy workflow scaffold"`

---

### Task 7: End-of-Phase Verification Gate

**Files:**
- Modify: none (verification + doc updates)

- [ ] **Step 1: Run backend unit tests**

Run: `pytest backend/tests -v`

- [ ] **Step 2: Run backend syntax check**

Run: `python -m compileall backend/app`

- [ ] **Step 3: Run backend locally**

Run: `uvicorn backend.app.main:app --reload --port 8000`

- [ ] **Step 4: Verify contracts**

Manual checks:
- health endpoint reachable
- all PRD route groups mounted
- `.env.example` covers required keys

- [ ] **Step 5: Tag phase completion commit**

`git commit -m "docs: complete Phase 01 backend setup verification"`

---

## Frontend Gaps (Deferred to Later Phases)

Frontend is assumed migrated to Next.js, but these are pending integration gaps for Phase 2+:

1. Wire Next auth pages (`/auth/login`, `/auth/signup`) to backend auth contracts.
2. Add protected app route handling in Next (middleware/layout guard).
3. Connect chat UI and context panel to `/chat/query` and `/memory/*`.
4. Add agent selector wiring for `/agents/research|content|executive`.
5. Add approval card actions wired to `/approvals/*` and `/linkedin/publish`.
6. Add activity feed polling/subscription from `/activities/feed`.
7. Add voice recorder upload flow to `/voice/transcribe`.

No frontend code changes are required in this phase.

---

## Exit Criteria (Phase 01 Done)

- FastAPI app boots reliably and exposes `/healthz`.
- PRD endpoint groups exist and are mounted (placeholder behavior acceptable).
- Environment contract is documented and loadable.
- Docker compose validates and runs backend + chroma.
- Azure deploy workflow scaffold exists.
- Frontend remains unchanged in this phase; integration gaps are documented for follow-up.
