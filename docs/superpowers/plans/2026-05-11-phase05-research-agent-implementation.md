# Phase 05 Research Agent Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a web-aware Research Agent workflow that combines search findings with Company Brain context and returns structured research summaries in the existing FounderOS workspace.

**Architecture:** Add a backend research orchestration service behind `POST /agents/research` that (1) routes only research-intent queries, (2) retrieves memory context from existing `MemoryService`, (3) calls Tavily/Serper provider adapters, (4) generates a structured summary using the existing Bedrock chat model stack, and (5) persists output to `generations` plus `activities`. On frontend, extend the current workspace composer with an agent selector and render Research output cards with source/citation badges and suggested follow-up actions.

**Tech Stack:** FastAPI, Pydantic, httpx, existing Bedrock `ChatModelService`, Supabase REST API, Next.js App Router, React, Vitest, Pytest.

---

## Integration Constraints

- Preserve existing auth guard and bearer-token flow.
- Reuse existing chat/memory services instead of duplicating embeddings/retrieval code.
- Keep current workspace visual language and streaming UX intact; research mode is additive, not a redesign.
- MVP only: one synchronous research endpoint (`POST /agents/research`), no autonomous browsing loops.

---

## Required Contracts (Lock Before Implementation)

### POST /agents/research

Request:
- `query: str` (min length 2)
- `top_k: int` (default 3, range 1..10)

200 Response:
- `generation_id: str`
- `agent_type: "research"`
- `query: str`
- `summary: str`
- `signals: list[str]`
- `risks: list[str]`
- `actions: list[str]`
- `sources: list[{title: str, url: str, source_type: "web"|"memory", source_label: str, snippet: str}]`
- `created_at: str`

Errors:
- `400` for non-research intent (`{"detail":"Query is not research intent"}`)
- `503` when both providers fail/timeout (`{"detail":"Web search unavailable"}`)

---

## File Structure & Responsibilities

- `supabase/migrations/20260511110000_phase05_generations_activities.sql` - create `public.generations` and `public.activities` with indexes and RLS.
- `backend/app/services/generations_repo.py` - persist structured research outputs.
- `backend/app/services/activities_repo.py` - append and list activity events.
- `backend/app/services/web_search_service.py` - Tavily/Serper provider adapter with fallback behavior.
- `backend/app/services/research_agent_service.py` - intent routing + memory merge + web search + model generation + persistence orchestration.
- `backend/app/api/routes/agents.py` - `POST /agents/research` endpoint.
- `backend/app/api/routes/activities.py` - replace static stub with repository-backed feed response.
- `backend/app/api/router.py` - register new agents route.
- `backend/app/core/config.py` - add search provider config (`tavily_api_key`, `serper_api_key`, `search_provider`).
- `frontend/src/lib/research-agent.ts` - typed client for `/agents/research`.
- `frontend/src/legacy/pages/Workspace.tsx` - add agent selector, research card rendering, and suggested actions.
- `backend/tests/test_phase5_research_service.py` - service unit tests.
- `backend/tests/test_phase5_research_api.py` - endpoint contract tests.
- `backend/tests/test_phase5_activities_api.py` - activity feed integration tests.
- `frontend/src/tests/research-agent.test.ts` - client tests.
- `frontend/src/tests/Workspace.test.tsx` - UI tests for research mode and cards.

---

### Task 1: Database + Config Foundations for Research Outputs

**Files:**
- Create: `supabase/migrations/20260511110000_phase05_generations_activities.sql`
- Modify: `backend/app/core/config.py`
- Modify: `.env.example`

- [ ] **Step 1: Write failing schema expectation notes/tests for `generations` + `activities` fields used by API contracts**
- [ ] **Step 2: Add migration creating `public.generations` and `public.activities` with explicit contract fields (`generations.output_json jsonb`, `activities.event_type text`, `activities.metadata jsonb`) plus `user_id` FK and `created_at`**
- [ ] **Step 3: Add indexes + RLS policies following existing `documents`/`chats` ownership patterns**
- [ ] **Step 4: Add backend config fields for `search_provider` and reuse existing `TAVILY_API_KEY`/`SERPER_API_KEY` env vars from `.env.example`; do not require repo-tracked `.env` edits**
- [ ] **Step 5: Re-run auth baseline test and commit**

Run:
- `python -m pytest backend/tests/test_phase2_auth.py -q`

Expected:
- PASS; auth behavior unchanged

Commit:
- `git commit -m "feat: add generations and activities schema for research workflow"`

---

### Task 2: Backend Research Services (Search + Orchestration + Persistence)

**Files:**
- Create: `backend/app/services/generations_repo.py`
- Create: `backend/app/services/activities_repo.py`
- Create: `backend/app/services/web_search_service.py`
- Create: `backend/app/services/research_agent_service.py`
- Modify: `backend/app/services/__init__.py`
- Test: `backend/tests/test_phase5_research_service.py`

- [ ] **Step 1: Write failing service tests for research-intent routing, provider fallback, memory merge, and persistence side-effects**

```python
async def test_research_service_merges_memory_and_web_findings():
    result = await service.run(user_id="u1", query="startup competitor trends")
    assert result.summary
    assert result.sources
```

- [ ] **Step 2: Implement `WebSearchService` with configured primary provider and deterministic fallback on timeout/5xx/missing-key; raise `RuntimeError("Web search unavailable")` when both fail**
- [ ] **Step 3: Implement `ResearchAgentService` that validates research intent keywords (`trends`, `competitors`, `research`, `market`, `startup news`)**
- [ ] **Step 4: Reuse `MemoryService.search` and existing `ChatModelService` to produce structured summary sections (`summary`, `signals`, `risks`, `actions`)**
- [ ] **Step 5: Persist output to `generations` and append completion event to `activities`, then run tests and commit**

Run:
- `python -m pytest backend/tests/test_phase5_research_service.py -q`

Expected:
- RED first: missing research service modules
- GREEN after implementation

Commit:
- `git commit -m "feat: add research agent service with web and memory orchestration"`

---

### Task 3: Backend API Endpoints (`/agents/research` + activity feed integration)

**Files:**
- Create: `backend/app/api/routes/agents.py`
- Modify: `backend/app/api/routes/activities.py`
- Modify: `backend/app/api/router.py`
- Test: `backend/tests/test_phase5_research_api.py`
- Test: `backend/tests/test_phase5_activities_api.py`

- [ ] **Step 1: Write failing API tests using dependency overrides (`FakeResearchAgentService`, `FakeActivitiesRepo`) to avoid live provider calls**
- [ ] **Step 2: Implement `POST /agents/research` using the locked response schema; return 400 for non-research intent and 503 for provider-unavailable failures**
- [ ] **Step 3: Implement repository-backed `GET /activities/feed` returning latest events for authenticated user**
- [ ] **Step 4: Register routes and verify protected-prefix behavior remains correct**
- [ ] **Step 5: Re-run API tests and commit**

Run:
- `python -m pytest backend/tests/test_phase5_research_api.py -q`
- `python -m pytest backend/tests/test_phase5_activities_api.py -q`
- `python -m pytest backend/tests/test_phase2_auth.py -q`

Expected:
- PASS; endpoint contracts deterministic under overrides

Commit:
- `git commit -m "feat: expose research agent endpoint and persisted activity feed"`

---

### Task 4: Frontend Research Mode Integration in Workspace

**Files:**
- Create: `frontend/src/lib/research-agent.ts`
- Modify: `frontend/src/legacy/pages/Workspace.tsx`
- Test: `frontend/src/tests/research-agent.test.ts`
- Modify: `frontend/src/tests/Workspace.test.tsx`

- [ ] **Step 1: Write failing frontend tests for agent selector, research request handling, research card rendering, and suggested actions after upload**

```ts
it("renders research card with source badges", async () => {
  render(<Workspace />)
  // select Research mode, submit prompt, assert card sections
})
```

- [ ] **Step 2: Implement typed client for `POST /agents/research` including auth headers and error parsing**
- [ ] **Step 3: Add agent selector in prompt area (`Executive`, `Content`, `Research`) and route `Research` submissions to new endpoint**
- [ ] **Step 4: Render research output cards (summary/signals/risks/actions) with source context badges and suggested next actions when documents are uploaded**
- [ ] **Step 5: Re-run focused frontend tests and commit**

Run:
- `npm --prefix frontend test -- --run src/tests/research-agent.test.ts src/tests/Workspace.test.tsx`

Expected:
- RED first: missing research client/selector behavior
- GREEN after implementation

Commit:
- `git commit -m "feat: add workspace research mode with structured result cards"`

---

### Task 5: Full Verification Gate (Seamless System Integration)

**Files:**
- Modify: tests only as needed for regressions

- [ ] **Step 1: Backend full suite verification**
- [ ] **Step 2: Frontend full suite + build verification**
- [ ] **Step 3: Runtime smoke checks for research endpoint and activity feed using real auth token**

Run:
- `python -m pytest backend/tests -q`
- `npm --prefix frontend test`
- `npm --prefix frontend run build`
- `docker compose up --build -d backend chroma frontend`
- `curl -s -o NUL -w "%{http_code}" http://localhost:8000/healthz`
- `curl -s -o NUL -w "%{http_code}" http://localhost:3000/workspace`
- `python -c "import os,httpx; token=os.environ['FOUNDEROS_E2E_ACCESS_TOKEN']; base='http://localhost:8000'; headers={'Authorization':f'Bearer {token}'}; r=httpx.post(base+'/agents/research',headers=headers,json={'query':'startup competitor trends in AI copilots'},timeout=90.0); print(r.status_code); print(r.text[:700]); a=httpx.get(base+'/activities/feed',headers=headers,timeout=30.0); print(a.status_code); print(a.text[:500])"`

Expected:
- All tests PASS
- `POST /agents/research` returns structured research object with source metadata
- `GET /activities/feed` includes recent research completion event

Commit:
- `git commit -m "test: verify research agent workflow end-to-end"`

---

## Success Checklist

- `POST /agents/research` exists and returns structured research summaries.
- Research intent routing is enforced by keyword logic.
- Web search findings are merged with memory context when available.
- Outputs are persisted in `generations` and activity events in `activities`.
- Workspace includes `Research` mode, source context badges, and upload-driven suggested actions.
- Existing chat streaming and memory upload flows remain functional.

## Execution Guidance

- Implement with @test-driven-development throughout backend and frontend tasks.
- Before completion claims, run @verification-before-completion commands and report concrete evidence.
