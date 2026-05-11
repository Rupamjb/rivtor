# Phase 07 Approval System + Activity Feed Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enforce human approval before publish actions and surface a live, persisted timeline for document, generation, approval, and publish events in Workspace.

**Architecture:** Add an approval workflow layer over existing `generations` rows (status transitions as the source of truth), expose explicit approval APIs (`approve`, `reject`), and enforce publish gating on the publish action path (use existing publish endpoint if present, otherwise add a minimal `POST /approvals/publish` endpoint in this phase). Introduce a shared `ActivityLogger` helper used by memory upload, research generation, content generation, and approval transitions. Replace Workspace mock approval/activity blocks with backend-connected state while keeping partial mock fallback for transport-level failures only.

**Tech Stack:** FastAPI, Pydantic, Supabase REST (`generations`, `activities`), existing Bedrock-backed services, Next.js/React, Vitest, Pytest.

---

## Integration Constraints

- Reuse existing Phase 03/04/05/06 architecture (`MemoryService`, `GenerationsRepository`, `ActivitiesRepository`, `ContentAgentService`, `ResearchAgentService`) and avoid parallel workflow engines.
- Keep auth behavior unchanged (same `AuthGuardMiddleware`, same bearer token path, no route-level auth redesign).
- Preserve current Workspace visual language (`rv-*`, chat shell layout, prompt-bar uploads).
- Keep save-draft action MVP-light: UI-level state is acceptable where backend editorial revision storage is out of scope.
- Activity logging must be best-effort (failures should not block primary user actions such as content generation or approvals).
- For activity feed UX, treat `200 {"items": []}` as a valid empty timeline; use mock fallback only on network/HTTP failure.

---

## Required Contracts (Lock Before Implementation)

### Status Model (for `generations.status`)

Allowed values after Phase 07:
- `completed` (existing research outputs)
- `approval_required` (existing content draft default)
- `approved`
- `rejected`
- `published`

Transition rules:
- `approval_required -> approved`
- `approval_required -> rejected`
- `approved -> published`
- all other transitions return `409` (`Invalid status transition`)

### POST /approvals/approve

Request:
- `generation_id: str`
- `note: str | null` (optional reviewer note)

200 Response:
- `generation_id: str`
- `agent_type: "content"`
- `previous_status: "approval_required"`
- `status: "approved"`
- `approval_required: false`
- `updated_at: str` (ISO timestamp from service)

Errors:
- `404` when generation not found for authenticated user
- `409` when transition is invalid
- `503` when persistence is unavailable

### POST /approvals/reject

Request:
- `generation_id: str`
- `reason: str | null` (optional rejection rationale)

200 Response:
- `generation_id: str`
- `agent_type: "content"`
- `previous_status: "approval_required"`
- `status: "rejected"`
- `approval_required: true`
- `updated_at: str`

Errors:
- `404` when generation not found
- `409` when transition is invalid
- `503` when persistence is unavailable

### Publish Guard Contract (enforce "publish only after approval")

If a publish endpoint already exists in the system, apply this contract there.
If no publish endpoint exists yet, add minimal `POST /approvals/publish` in Phase 07.

Request:
- `generation_id: str`

200 Response:
- `generation_id: str`
- `previous_status: "approved"`
- `status: "published"`
- `published: true`
- `updated_at: str`

Errors:
- `404` when generation not found
- `409` when generation is not approved
- `503` when persistence is unavailable

### GET /activities/feed

Request query:
- `limit: int` (default 20, max 100)

200 Response:
- `items: list[{id, event_type, metadata, created_at}]`

Expected event types now visible in UI:
- `document_uploaded`
- `research_completed`
- `content_draft_created`
- `approval_approved`
- `approval_rejected`
- `content_published`

---

## File Structure & Responsibilities

- `supabase/migrations/20260511183000_phase07_generation_status_approval_guardrails.sql` - status check constraint/index updates for fast queueing and contract safety.
- `backend/app/services/activity_logger.py` - centralized best-effort activity logging helper.
- `backend/app/services/approval_service.py` - approval/publish orchestration and transition enforcement.
- `backend/app/services/generations_repo.py` - add `get_generation(...)` and `update_generation_status(...)` primitives.
- `backend/app/services/memory_service.py` - emit `document_uploaded` via `ActivityLogger` after successful ingestion.
- `backend/app/services/research_agent_service.py` - replace direct repo call with `ActivityLogger`.
- `backend/app/services/content_agent_service.py` - replace direct repo call with `ActivityLogger`.
- `backend/app/services/__init__.py` - export approval/activity helper services.
- `backend/app/api/routes/approvals.py` - new approval endpoints (`approve`, `reject`) and optional `publish` endpoint when no existing publish route exists.
- `backend/app/api/router.py` - register approvals router.
- `backend/tests/test_phase7_approval_service.py` - transition + event side-effect tests.
- `backend/tests/test_phase7_approvals_api.py` - endpoint contract tests.
- `backend/tests/test_phase7_activity_logger.py` - helper behavior (best-effort/no-throw) tests.
- `backend/tests/test_phase3_memory.py` - assert upload path logs document activity.
- `frontend/src/lib/approvals.ts` - typed client for approval and publish actions.
- `frontend/src/lib/activities-feed.ts` - typed client for timeline endpoint.
- `frontend/src/legacy/pages/Workspace.tsx` - wire card actions + dynamic activity feed panel + fallback behavior.
- `frontend/src/tests/approvals.test.ts` - approval client tests.
- `frontend/src/tests/activities-feed.test.ts` - activities client tests.
- `frontend/src/tests/Workspace.test.tsx` - action flow and activity timeline rendering tests.

---

### Task 1: Lock Backend Contracts With Failing Tests First

**Files:**
- Create: `backend/tests/test_phase7_approval_service.py`
- Create: `backend/tests/test_phase7_approvals_api.py`
- Create: `backend/tests/test_phase7_activity_logger.py`

- [ ] **Step 1: Write failing service tests for valid transitions (`approval_required->approved`, `approval_required->rejected`, `approved->published`)**

```python
def test_approve_transition_updates_status_and_logs_event():
    result = asyncio.run(service.approve(user_id="u1", generation_id="gen-1", note="ship it"))
    assert result["status"] == "approved"
```

- [ ] **Step 2: Write failing service tests for invalid transitions returning conflict-style errors**
- [ ] **Step 3: Write failing API tests for `/approvals/approve`, `/approvals/reject`, `/approvals/publish` using dependency overrides**
- [ ] **Step 4: Write failing tests for `ActivityLogger` best-effort behavior when repo throws**
- [ ] **Step 5: Run focused tests to capture RED baseline and commit**

Run:
- `python -m pytest backend/tests/test_phase7_approval_service.py -q`
- `python -m pytest backend/tests/test_phase7_approvals_api.py -q`
- `python -m pytest backend/tests/test_phase7_activity_logger.py -q`

Expected:
- RED (missing approval/activity logger modules and route wiring)

Commit:
- `git commit -m "test: add failing approval workflow and activity logger contracts"`

---

### Task 2: Add Persistence Guardrails + Repository Transition Primitives

**Files:**
- Create: `supabase/migrations/20260511183000_phase07_generation_status_approval_guardrails.sql`
- Modify: `backend/app/services/generations_repo.py`

- [ ] **Step 1: Add migration check constraint for allowed `generations.status` values used by research/content/approval flows**
- [ ] **Step 2: Add index `(user_id, status, created_at desc)` for approval queue and timeline-adjacent queries**
- [ ] **Step 3: Implement `get_generation(user_id, generation_id)` repository method selecting `id, agent_type, status, output_json, created_at`**
- [ ] **Step 4: Implement `update_generation_status(user_id, generation_id, next_status)` repository method (PATCH with ownership filter)**
- [ ] **Step 5: Add/adjust unit tests covering normalization and error handling in repository methods**
- [ ] **Step 6: Run focused tests and commit**

Run:
- `python -m pytest backend/tests/test_phase7_approval_service.py -q`

Expected:
- still RED until service layer exists, but repository errors should now be deterministic

Commit:
- `git commit -m "feat: add generation status guardrails and transition repository primitives"`

---

### Task 3: Implement ActivityLogger + ApprovalService + API Endpoints

**Files:**
- Create: `backend/app/services/activity_logger.py`
- Create: `backend/app/services/approval_service.py`
- Create: `backend/app/api/routes/approvals.py`
- Modify: `backend/app/api/router.py`
- Modify: `backend/app/services/__init__.py`

- [ ] **Step 1: Implement `ActivityLogger.log(...)` wrapper around `ActivitiesRepository.create_activity(...)` with no-throw behavior**
- [ ] **Step 2: Implement `ApprovalService` methods `approve`, `reject`, `publish` with explicit state-machine checks and consistent error classes/messages**
- [ ] **Step 3: Log approval events (`approval_approved`, `approval_rejected`, `content_published`) via `ActivityLogger` metadata**
- [ ] **Step 4: Add FastAPI dependency providers + `/approvals/*` endpoints with 404/409/503 mapping**
- [ ] **Step 5: Register approvals router and re-run approval API/service tests**
- [ ] **Step 6: Commit backend approval workflow slice**

Run:
- `python -m pytest backend/tests/test_phase7_approval_service.py -q`
- `python -m pytest backend/tests/test_phase7_approvals_api.py -q`
- `python -m pytest backend/tests/test_phase7_activity_logger.py -q`
- `python -m pytest backend/tests/test_phase2_auth.py -q`

Expected:
- GREEN for new phase tests
- existing auth tests remain GREEN

Commit:
- `git commit -m "feat: add approval endpoints with guarded publish transitions"`

---

### Task 4: Wire Activity Logger Into Existing Critical Flows

**Files:**
- Modify: `backend/app/services/memory_service.py`
- Modify: `backend/app/services/research_agent_service.py`
- Modify: `backend/app/services/content_agent_service.py`
- Modify: `backend/tests/test_phase3_memory.py`
- Modify: `backend/tests/test_phase5_research_service.py`
- Modify: `backend/tests/test_phase6_content_service.py`
- Modify: `backend/tests/test_phase5_activities_api.py`

- [ ] **Step 1: Inject optional `ActivityLogger` into `MemoryService`; emit `document_uploaded` after successful document persistence**
- [ ] **Step 2: Replace direct `ActivitiesRepository.create_activity(...)` usage in research/content services with `ActivityLogger.log(...)`**
- [ ] **Step 3: Keep existing payload metadata stable so older consumers are not broken**
- [ ] **Step 4: Add feed-level regression assertions in `test_phase5_activities_api.py` for item shape/order (`id,event_type,metadata,created_at`) after logger centralization**
- [ ] **Step 5: Update tests to assert event types are still emitted and that primary operations succeed even if logging fails**
- [ ] **Step 6: Run targeted regression tests and commit**

Run:
- `python -m pytest backend/tests/test_phase3_memory.py -q`
- `python -m pytest backend/tests/test_phase5_research_service.py -q`
- `python -m pytest backend/tests/test_phase6_content_service.py -q`
- `python -m pytest backend/tests/test_phase5_activities_api.py -q`

Expected:
- GREEN; no regression in memory/research/content behavior

Commit:
- `git commit -m "refactor: centralize critical flow activity logging with shared helper"`

---

### Task 5: Frontend Approval Actions + Live Activity Feed Integration

**Files:**
- Create: `frontend/src/lib/approvals.ts`
- Create: `frontend/src/lib/activities-feed.ts`
- Create: `frontend/src/tests/approvals.test.ts`
- Create: `frontend/src/tests/activities-feed.test.ts`
- Modify: `frontend/src/legacy/pages/Workspace.tsx`
- Modify: `frontend/src/tests/Workspace.test.tsx`

- [ ] **Step 1: Write failing client tests for approve/reject/publish request payloads and backend error parsing**

```ts
await approveGeneration({ accessToken: "token", generationId: "gen-c1", note: "Looks good" })
expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining("/approvals/approve"), expect.any(Object))
```

- [ ] **Step 2: Write failing workspace tests for `Save draft` local behavior (status chip/local flag update) and assert it does not call publish endpoint**
- [ ] **Step 3: Write failing client tests for `GET /activities/feed` parsing and fallback behavior that triggers only on network/HTTP failure (not on empty list)**
- [ ] **Step 4: Implement approval + activity clients with typed response contracts**
- [ ] **Step 5: Replace static `runActivity` with fetched timeline items (`items=[]` renders empty-state text, not mock rows)**
- [ ] **Step 6: Use fallback mock timeline only when feed request fails at transport/HTTP level**
- [ ] **Step 7: Wire `Approve`, `Request edits`, `Queue publish` buttons to backend actions and local card status updates**
- [ ] **Step 8: Keep `Save draft` as explicit MVP-local action (UI state only) and mark it as non-publishing**
- [ ] **Step 9: Re-run focused frontend tests and commit**

Run:
- `npm --prefix frontend test -- --run src/tests/approvals.test.ts src/tests/activities-feed.test.ts src/tests/Workspace.test.tsx`

Expected:
- GREEN; content card actions update status and timeline panel renders real events when available

Commit:
- `git commit -m "feat: connect workspace approval actions and activity feed to backend"`

---

### Task 6: Full-System Verification (Seamless Integration Gate)

**Files:**
- Modify: tests only if regression fixes are needed

- [ ] **Step 1: Run full backend test suite**
- [ ] **Step 2: Run full frontend tests + production build**
- [ ] **Step 3: Run compose stack and perform runtime smoke for approve/reject/publish/activity flow with real token**

Run:
- `python -m pytest backend/tests -q`
- `npm --prefix frontend test`
- `npm --prefix frontend run build`
- `docker compose up --build -d backend chroma frontend`
- `curl -s -o NUL -w "%{http_code}" http://localhost:8000/healthz`
- `curl -s -o NUL -w "%{http_code}" http://localhost:3000/workspace`
- `python -c "import os,httpx; token=os.environ['FOUNDEROS_E2E_ACCESS_TOKEN']; base='http://localhost:8000'; headers={'Authorization':f'Bearer {token}'}; draft=httpx.post(base+'/agents/content',headers=headers,json={'query':'write a linkedin launch post about our onboarding milestone','format':'linkedin','tone':'professional','length':'medium','top_k':3},timeout=90.0).json(); gid=draft.get('generation_id'); pre=httpx.post(base+'/approvals/publish',headers=headers,json={'generation_id':gid},timeout=30.0); a=httpx.post(base+'/approvals/approve',headers=headers,json={'generation_id':gid,'note':'Approved for posting'},timeout=30.0); p=httpx.post(base+'/approvals/publish',headers=headers,json={'generation_id':gid},timeout=30.0); feed=httpx.get(base+'/activities/feed',headers=headers,timeout=30.0); print(pre.status_code,a.status_code,p.status_code,feed.status_code); print(feed.text[:900])"`

Expected:
- All tests PASS
- publish attempt before approval returns `409`
- publish after approval returns `200` and status `published`
- activity feed includes `content_draft_created`, `approval_approved`, and `content_published`

Commit:
- `git commit -m "test: verify approval workflow and activity timeline end-to-end"`

---

## Success Checklist

- `POST /approvals/approve` and `POST /approvals/reject` are implemented and contract-tested.
- Publish action is blocked unless generation status is already `approved`.
- Shared `ActivityLogger` is used by critical flows (document upload, research/content generation, approval transitions).
- Workspace approval cards trigger backend transitions and reflect updated statuses.
- Activity Feed panel shows persisted events, treats empty feed as a valid state, and uses mock fallback only for feed request failures.
- Save Draft action is implemented and tested as local-only (no publish side effect).
- Existing memory/chat/research/content flows remain functional without regressions.

## Execution Guidance

- Implement with @test-driven-development workflow for each task slice.
- Before any "done" claim, run @verification-before-completion and report command evidence.
