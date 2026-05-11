# Phase 06 Content Agent Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a context-aware Content Agent that generates approval-ready startup content drafts (especially LinkedIn) using founder memory and research context.

**Architecture:** Extend the existing `/agents` backend domain with `POST /agents/content`, backed by a `ContentAgentService` that merges `MemoryService` retrieval plus recent research outputs from `generations`, applies template controls (tone/length/format), generates structured draft content via `ChatModelService`, persists to `generations` with approval-required status, and logs `activities` events. Update workspace UI to add content controls, render approval-ready draft cards, and show memory/research context labels in the generated content panel.

**Tech Stack:** FastAPI, Pydantic, existing Bedrock `ChatModelService`, Supabase REST repositories (`generations`, `activities`), Next.js App Router, React, Vitest, Pytest.

---

## Integration Constraints

- Reuse existing Phase 03/04/05 services (`MemoryService`, `GenerationsRepository`, `ActivitiesRepository`, `ChatModelService`) instead of duplicating logic.
- Keep existing auth middleware and bearer-token flow unchanged.
- No new approval engine in this phase; represent approval-required state via generation `status` and metadata only.
- Preserve current workspace visual language and chat shell layout; add content mode as an incremental extension.

---

## Required Contracts (Lock Before Implementation)

### POST /agents/content

Request:
- `query: str` (min length 2)
- `format: "linkedin" | "founder_update" | "launch_post"` (default `linkedin`)
- `tone: "professional" | "bold" | "insightful" | "casual"` (default `professional`)
- `length: "short" | "medium" | "long"` (default `medium`)
- `top_k: int` (default 3, range 1..10)

200 Response:
- `generation_id: str`
- `agent_type: "content"`
- `status: "approval_required"`
- `approval_required: true`
- `query: str`
- `format: str`
- `tone: str`
- `length: str`
- `title: str`
- `draft: str`
- `context_labels: list[str]` (ex: `Founder Notes`, `Research Summary`)
- `sources: list[{source_type: "memory"|"research", source_label: str, title: str, snippet: str}]`
- `created_at: str`

Errors:
- `400` for non-content intent (`{"detail":"Query is not content intent"}`)
- `503` for generation/persistence failures (`{"detail":"Content generation unavailable"}` or specific runtime detail)

---

## File Structure & Responsibilities

- `backend/app/services/content_agent_service.py` - content orchestration with memory + research injection and template controls.
- `backend/app/api/routes/agents.py` - add `POST /agents/content` endpoint alongside existing research endpoint.
- `backend/app/services/generations_repo.py` - extend listing API with optional `agent_type` filtering to fetch recent research context.
- `backend/app/services/activities_repo.py` - reuse for `content_draft_created` event append.
- `backend/tests/test_phase6_content_service.py` - content service unit tests.
- `backend/tests/test_phase6_content_api.py` - endpoint contract tests.
- `frontend/src/lib/content-agent.ts` - typed client for `/agents/content`.
- `frontend/src/legacy/pages/Workspace.tsx` - content controls (format/tone/length), generate action, approval-ready content cards, context labels.
- `frontend/src/tests/content-agent.test.ts` - client tests.
- `frontend/src/tests/Workspace.test.tsx` - UI tests for content controls and approval-ready rendering.

---

### Task 1: Backend Content Service Contract + Failing Tests

**Files:**
- Create: `backend/tests/test_phase6_content_service.py`

- [ ] **Step 1: Write failing tests for content-intent routing keywords (`write`, `generate`, `post`, `tweet`, `linkedin`, `announcement`)**
- [ ] **Step 2: Write failing tests for memory + research context merge and template controls (tone/length/format)**
- [ ] **Step 3: Write failing tests asserting persisted generation status is `approval_required` and activity event is created**
- [ ] **Step 4: Run focused tests to capture RED state**
- [ ] **Step 5: Commit failing tests checkpoint**

Run:
- `python -m pytest backend/tests/test_phase6_content_service.py -q`

Expected:
- RED first (missing service module)

Commit:
- `git commit -m "test: add failing content agent service contract tests"`

---

### Task 2: Implement ContentAgentService + Repository Extensions

**Files:**
- Create: `backend/app/services/content_agent_service.py`
- Modify: `backend/app/services/generations_repo.py`
- Modify: `backend/app/services/__init__.py`

- [ ] **Step 1: Implement `ContentAgentService` constructor wiring existing repositories/services**
- [ ] **Step 2: Implement `is_content_intent(query)` keyword routing guard**
- [ ] **Step 3: Extend `GenerationsRepository.list_generations(...)` with optional `agent_type` filter and use it to pull recent research summaries**
- [ ] **Step 4: Build prompt composer that injects memory snippets + research highlights and template controls (`format`, `tone`, `length`)**
- [ ] **Step 5: Parse model output into normalized content payload (`title`, `draft`, lists), persist generation with `status="approval_required"`, and append `content_draft_created` activity event**
- [ ] **Step 6: Re-run service tests to GREEN and commit**

Run:
- `python -m pytest backend/tests/test_phase6_content_service.py -q`

Expected:
- GREEN

Commit:
- `git commit -m "feat: add content agent service with memory and research context injection"`

---

### Task 3: Add `/agents/content` API Endpoint + API Tests

**Files:**
- Modify: `backend/app/api/routes/agents.py`
- Create: `backend/tests/test_phase6_content_api.py`

- [ ] **Step 1: Write failing API tests using dependency override (`FakeContentAgentService`) to avoid live model calls**
- [ ] **Step 2: Add `ContentRequest` model with `query`, `format`, `tone`, `length`, `top_k`**
- [ ] **Step 3: Implement `POST /agents/content` returning locked response schema**
- [ ] **Step 4: Map `ValueError` to 400 (`Query is not content intent`) and `RuntimeError` to 503**
- [ ] **Step 5: Re-run content API tests + existing auth/research regression tests and commit**

Run:
- `python -m pytest backend/tests/test_phase6_content_api.py -q`
- `python -m pytest backend/tests/test_phase5_research_api.py -q`
- `python -m pytest backend/tests/test_phase2_auth.py -q`

Expected:
- PASS

Commit:
- `git commit -m "feat: expose content agent endpoint with template controls"`

---

### Task 4: Frontend Content Controls + Approval-Ready Cards

**Files:**
- Create: `frontend/src/lib/content-agent.ts`
- Create: `frontend/src/tests/content-agent.test.ts`
- Modify: `frontend/src/legacy/pages/Workspace.tsx`
- Modify: `frontend/src/tests/Workspace.test.tsx`

- [ ] **Step 1: Write failing client tests for `/agents/content` request payload and error parsing**
- [ ] **Step 2: Write failing workspace tests for content controls (`format`, `tone`, `length`) and approval-ready card rendering**
- [ ] **Step 3: Implement `runContentAgent(...)` client helper**
- [ ] **Step 4: Add content control inputs in workspace composer and route submissions when agent mode is `content`**
- [ ] **Step 5: Render generated content cards with title, draft body, context labels, and approval actions (`Approve`, `Request edits`, `Queue publish`)**
- [ ] **Step 6: Show explicit contextual labels proving memory/research usage in generated content panel**
- [ ] **Step 7: Re-run focused frontend tests to GREEN and commit**

Run:
- `npm --prefix frontend test -- --run src/tests/content-agent.test.ts src/tests/Workspace.test.tsx`

Expected:
- GREEN

Commit:
- `git commit -m "feat: add workspace content generation controls and approval-ready draft cards"`

---

### Task 5: Full Verification Gate (Seamless Integration)

**Files:**
- Modify: tests only if regression fixes are needed

- [ ] **Step 1: Run full backend suite**
- [ ] **Step 2: Run full frontend suite + build**
- [ ] **Step 3: Run compose + runtime smoke for content generation and activity feed**

Run:
- `python -m pytest backend/tests -q`
- `npm --prefix frontend test`
- `npm --prefix frontend run build`
- `docker compose up --build -d backend chroma frontend`
- `curl -s -o NUL -w "%{http_code}" http://localhost:8000/healthz`
- `curl -s -o NUL -w "%{http_code}" http://localhost:3000/workspace`
- `python -c "import os,httpx; token=os.environ['FOUNDEROS_E2E_ACCESS_TOKEN']; base='http://localhost:8000'; headers={'Authorization':f'Bearer {token}'}; r=httpx.post(base+'/agents/content',headers=headers,json={'query':'write a linkedin launch post for our onboarding milestone','format':'linkedin','tone':'professional','length':'medium','top_k':3},timeout=90.0); print(r.status_code); print(r.text[:900]); a=httpx.get(base+'/activities/feed',headers=headers,timeout=30.0); print(a.status_code); print(a.text[:500])"`

Expected:
- All tests PASS
- `POST /agents/content` returns approval-ready structured draft payload with context labels
- `GET /activities/feed` includes `content_draft_created` event

Commit:
- `git commit -m "test: verify content agent generation flow end-to-end"`

---

## Success Checklist

- `POST /agents/content` exists and supports template controls (`tone`, `length`, `format`).
- Generated content explicitly references founder memory and/or research context labels.
- Drafts persist in `generations` with `status = approval_required`.
- Workspace displays approval-ready content cards with metadata and actions.
- Existing research/chat/memory flows continue working without regressions.

## Execution Guidance

- Implement using @test-driven-development workflow.
- Before completion claims, enforce @verification-before-completion with command evidence.
