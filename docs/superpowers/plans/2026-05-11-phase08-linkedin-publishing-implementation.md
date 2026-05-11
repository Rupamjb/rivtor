# Phase 08 LinkedIn Publishing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable the demo-critical path from approved content draft to real LinkedIn publication with explicit connect state, robust error handling, and activity visibility.

**Architecture:** Add a dedicated LinkedIn integration layer (`/linkedin/connect`, `/linkedin/publish`) that reuses Phase 07 approval semantics and generation persistence instead of introducing a parallel publish workflow. Implement OAuth connect-start/connect-complete handling in one connector endpoint, persist user connection tokens in Supabase, and perform publish only when generation status is `approved`. Enforce channel routing at backend level: LinkedIn-format drafts must publish through `/linkedin/publish`, while non-LinkedIn drafts can continue using existing `/approvals/publish` flow.

**Tech Stack:** FastAPI, Pydantic, httpx, Supabase REST (`generations`, `activities`, new LinkedIn tables), Next.js/React, Vitest, Pytest.

---

## Integration Constraints

- Reuse current auth + API patterns (`AuthGuardMiddleware`, service/repo decomposition, dependency overrides in tests).
- Reuse existing approval/publish state machine from Phase 07 (`approval_required -> approved -> published`), with LinkedIn publish as the channel-specific publish path for LinkedIn drafts.
- Keep Workspace visual language and structure (`rv-*`, right rail cards, existing content draft cards).
- Do not add scheduling, campaign analytics, or full draft management system (explicitly out of MVP scope).
- Keep activity logging best-effort for non-critical events, but do not mark draft as `published` unless LinkedIn API publish succeeds.

---

## Required Contracts (Lock Before Implementation)

### POST /linkedin/connect

Single endpoint with explicit step mode:

Request:
- `step: "start" | "complete" | "status"` (default `start`)
- `code: str | null` (required for `complete`)
- `state: str | null` (required for `complete`)
- `force_reconnect: bool` (optional, for `start`)

`step=start` 200 Response:
- `step: "start"`
- `connection_status: "pending" | "connected"`
- `authorization_url: str | null`
- `state: str | null`
- `connected_at: str | null`

`step=complete` 200 Response:
- `step: "complete"`
- `connection_status: "connected"`
- `linkedin_member_urn: str`
- `connected_at: str`

`step=status` 200 Response:
- `step: "status"`
- `connection_status: "connected" | "disconnected" | "pending"`
- `linkedin_member_urn: str | null`
- `connected_at: str | null`

Errors:
- `400` invalid payload, missing `code/state` for complete, OAuth state mismatch
- `401` unauthenticated request
- `503` LinkedIn app config missing (`LINKEDIN_CLIENT_ID/SECRET/REDIRECT_URI`) or provider unavailable

State transitions (must be deterministic):
- `disconnected --start--> pending` (persist `oauth_state` and `oauth_state_expires_at`)
- `pending --complete(valid state)--> connected`
- `pending --complete(invalid/expired state)--> 400`
- `connected --start(force_reconnect=false)--> connected` (no new URL)
- `connected --start(force_reconnect=true)--> pending` (new URL/state)

Idempotency rule:
- duplicate `complete` for an already connected account returns `200` with `connection_status="connected"` and does not rotate tokens unless explicitly re-authorized.

Frontend mapping rule:
- UI label `connecting` maps to backend `connection_status="pending"`.

### POST /linkedin/publish

Request:
- `generation_id: str`

200 Response:
- `generation_id: str`
- `status: "published"`
- `channel: "linkedin"`
- `linkedin_post_urn: str`
- `linkedin_post_url: str | null`
- `published_at: str`

Enforcement:
- generation must exist for authenticated user
- generation must be `agent_type=content`
- generation must be `status=approved`
- draft format must be `linkedin`
- user must have a connected LinkedIn account

Errors:
- `404` generation not found
- `409` invalid transition, unsupported format, or LinkedIn not connected
- `429` LinkedIn rate limit
- `503` provider/persistence failures

### Guardrail Contract for Existing POST /approvals/publish

To prevent bypassing LinkedIn publish:
- if generation format is `linkedin`, `/approvals/publish` must return `409` with detail `Use /linkedin/publish for LinkedIn drafts`.
- if generation format is non-LinkedIn, existing `/approvals/publish` semantics remain unchanged.

### Activity Feed Event Extensions

Keep existing events and add:
- `linkedin_connected`
- `linkedin_publish_failed`

On successful publish, keep canonical `content_published` event and add channel metadata:
- `channel: "linkedin"`
- `linkedin_post_urn`
- `linkedin_post_url`

---

## File Structure & Responsibilities

- `supabase/migrations/20260511213000_phase08_linkedin_publishing.sql` - LinkedIn connection + publication persistence tables, indexes, RLS policies.
- `backend/app/core/config.py` - add LinkedIn settings fields.
- `.env.example` - document required LinkedIn env vars for local/prod parity.
- `backend/app/middleware/auth_guard.py` - include `/linkedin` in protected prefixes.
- `backend/app/api/routes/linkedin.py` - connect + publish route contracts and error mapping.
- `backend/app/api/router.py` - register LinkedIn router.
- `backend/app/services/linkedin_connections_repo.py` - upsert/load connection state and oauth state per user.
- `backend/app/services/linkedin_publications_repo.py` - persist publish success/failure attempts.
- `backend/app/services/linkedin_api_client.py` - LinkedIn OAuth + publish HTTP wrapper with mapped runtime errors.
- `backend/app/services/linkedin_service.py` - orchestration for connect start/complete/status and publish workflow.
- `backend/app/services/approval_service.py` - add reusable publishability guard helper(s) if needed by LinkedIn service.
- `backend/app/services/generations_repo.py` - optional helper(s) to patch output/status metadata atomically if required.
- `backend/app/services/__init__.py` - export LinkedIn services.
- `backend/tests/test_phase8_linkedin_service.py` - orchestration tests.
- `backend/tests/test_phase8_linkedin_api.py` - endpoint contract tests.
- `backend/tests/test_phase7_approvals_api.py` - regression tests for `/approvals/publish` LinkedIn guardrail.
- `backend/tests/test_phase7_approval_service.py` - regression assertions for state transitions after LinkedIn integration.
- `frontend/src/lib/linkedin.ts` - typed client for connect + publish APIs.
- `frontend/src/legacy/pages/Workspace.tsx` - LinkedIn integration card and publish CTA wiring on approved LinkedIn drafts.
- `frontend/src/app/integrations/linkedin/callback/page.tsx` - OAuth callback completion + redirect UX.
- `frontend/src/tests/linkedin.test.ts` - client request/response/error tests.
- `frontend/src/tests/Workspace.test.tsx` - integration status + publish CTA + retry behavior tests.
- `frontend/src/tests/linkedin-callback.test.tsx` - callback flow tests.

---

### Task 1: Lock Phase 08 Contracts With Failing Tests First

**Files:**
- Create: `backend/tests/test_phase8_linkedin_service.py`
- Create: `backend/tests/test_phase8_linkedin_api.py`
- Create: `frontend/src/tests/linkedin.test.ts`

- [ ] **Step 1: Write failing service tests for connect start/complete/status and OAuth state validation**

```python
def test_connect_complete_rejects_state_mismatch():
    with pytest.raises(ValueError):
        asyncio.run(service.connect_complete(user_id="u1", code="abc", state="bad"))
```

- [ ] **Step 2: Write failing service tests for publish constraints (`approved` + `format=linkedin` + connected account required)**
- [ ] **Step 3: Write failing API tests for `POST /linkedin/connect` and `POST /linkedin/publish` status/error mappings**
- [ ] **Step 4: Write failing API regression tests for `/approvals/publish` rejecting LinkedIn drafts**
- [ ] **Step 5: Write failing frontend client tests for connect-start/connect-complete/status and publish error propagation**
- [ ] **Step 6: Run focused tests to capture RED baseline and commit**

Run:
- `python -m pytest backend/tests/test_phase8_linkedin_service.py -q`
- `python -m pytest backend/tests/test_phase8_linkedin_api.py -q`
- `python -m pytest backend/tests/test_phase7_approvals_api.py -q`
- `npm --prefix frontend test -- --run src/tests/linkedin.test.ts`

Expected:
- RED (LinkedIn modules/routes/clients not implemented yet)

Commit:
- `git commit -m "test: add failing linkedin connect and publish contracts"`

---

### Task 2: Add LinkedIn Persistence + Config Surface

**Files:**
- Create: `supabase/migrations/20260511213000_phase08_linkedin_publishing.sql`
- Modify: `backend/app/core/config.py`
- Modify: `.env.example`

- [ ] **Step 1: Add `linkedin_connections` table (user-scoped token state + oauth_state + timestamps) with indexes and RLS**
- [ ] **Step 2: Add `linkedin_publications` table (generation-scoped publish outcomes) with indexes and RLS**
- [ ] **Step 3: Add LinkedIn config fields to backend settings (`linkedin_client_id`, `linkedin_client_secret`, `linkedin_redirect_uri`, optional `linkedin_scope`)**
- [ ] **Step 4: Update `.env.example` docs for LinkedIn config and callback URI**
- [ ] **Step 5: Add/adjust migration validation tests or diagnostics, then commit**

Run:
- `python -m pytest backend/tests/test_phase8_linkedin_service.py -q`

Expected:
- still RED for orchestration, but persistence/config prerequisites are in place

Commit:
- `git commit -m "feat: add linkedin connection and publication persistence schema"`

---

### Task 3: Implement Backend LinkedIn Client + Repositories + Service

**Files:**
- Create: `backend/app/services/linkedin_connections_repo.py`
- Create: `backend/app/services/linkedin_publications_repo.py`
- Create: `backend/app/services/linkedin_api_client.py`
- Create: `backend/app/services/linkedin_service.py`
- Modify: `backend/app/services/approval_service.py`
- Modify: `backend/app/services/__init__.py`

- [ ] **Step 1: Implement connections repo methods (get/upsert pending state, finalize connected state, status read)**
- [ ] **Step 2: Implement publications repo methods for success/failure attempt recording**
- [ ] **Step 3: Implement LinkedIn API client methods: build auth URL, exchange code, fetch author identity, publish post**
- [ ] **Step 4: Map provider errors to domain errors (`invalid_code`, `state_mismatch`, `not_connected`, `rate_limited`, `provider_unavailable`)**
- [ ] **Step 5: Implement service orchestration that logs `linkedin_connected`, `linkedin_publish_failed`, and channelized `content_published` events**
- [ ] **Step 6: Ensure generation status flips to `published` only after LinkedIn publish success**
- [ ] **Step 7: Run focused backend tests and commit**

Run:
- `python -m pytest backend/tests/test_phase8_linkedin_service.py -q`
- `python -m pytest backend/tests/test_phase7_approval_service.py -q`

Expected:
- GREEN for LinkedIn service tests
- Phase 07 approval regressions remain GREEN

Commit:
- `git commit -m "feat: add linkedin oauth and publish orchestration service"`

---

### Task 4: Expose LinkedIn API Endpoints + Middleware Wiring

**Files:**
- Create: `backend/app/api/routes/linkedin.py`
- Modify: `backend/app/api/router.py`
- Modify: `backend/app/middleware/auth_guard.py`
- Modify: `backend/app/api/routes/approvals.py`
- Modify: `backend/tests/test_phase2_auth.py`
- Modify: `backend/tests/test_phase7_approvals_api.py`

- [ ] **Step 1: Add `/linkedin/connect` endpoint with step-based payload parsing and 400/503 mapping**
- [ ] **Step 2: Add `/linkedin/publish` endpoint with 404/409/429/503 mappings from service errors**
- [ ] **Step 3: Register LinkedIn router in API router**
- [ ] **Step 4: Add `/linkedin` to protected prefixes in auth middleware**
- [ ] **Step 5: Add guard in `/approvals/publish` path to reject LinkedIn-format drafts and keep non-LinkedIn behavior unchanged**
- [ ] **Step 6: Add auth regression test asserting LinkedIn endpoints require bearer token**
- [ ] **Step 7: Run backend API/auth tests and commit**

Run:
- `python -m pytest backend/tests/test_phase8_linkedin_api.py -q`
- `python -m pytest backend/tests/test_phase7_approvals_api.py -q`
- `python -m pytest backend/tests/test_phase2_auth.py -q`

Expected:
- GREEN for new LinkedIn API contract tests
- auth middleware behavior unchanged except new protected prefix

Commit:
- `git commit -m "feat: expose linkedin connect and publish api routes"`

---

### Task 5: Frontend Integration UX (Connect State + Publish CTA + Retry)

**Files:**
- Create: `frontend/src/lib/linkedin.ts`
- Create: `frontend/src/app/integrations/linkedin/callback/page.tsx`
- Create: `frontend/src/tests/linkedin-callback.test.tsx`
- Modify: `frontend/src/legacy/pages/Workspace.tsx`
- Modify: `frontend/src/tests/Workspace.test.tsx`

- [ ] **Step 1: Write failing Workspace tests for LinkedIn integration card states (`disconnected`, `connecting`, `connected`)**
- [ ] **Step 2: Write failing tests for approved LinkedIn draft CTA showing `Publish to LinkedIn` and retry on failure**
- [ ] **Step 3: Write failing routing-split tests: LinkedIn drafts call `linkedin.publish`, non-LinkedIn approved drafts call existing approvals publish**
- [ ] **Step 4: Implement `linkedin.ts` API client (connect start/complete/status + publish)**
- [ ] **Step 5: Implement callback page to complete OAuth and redirect to Workspace with UX-safe status message**
- [ ] **Step 6: Add Integrations card in Workspace right rail with connect/reconnect state**
- [ ] **Step 7: Replace generic publish action for LinkedIn-format approved cards with `/linkedin/publish` call**
- [ ] **Step 8: Keep non-LinkedIn publish flow routed to existing `/approvals/publish` behavior**
- [ ] **Step 9: Surface publish success/failure and retry affordance without breaking current approval card layout**
- [ ] **Step 10: Refresh activity feed after connect or publish results**
- [ ] **Step 11: Run focused frontend tests and commit**

Run:
- `npm --prefix frontend test -- --run src/tests/linkedin.test.ts src/tests/linkedin-callback.test.tsx src/tests/Workspace.test.tsx`

Expected:
- GREEN; connect state, publish CTA, and retry behavior verified

Commit:
- `git commit -m "feat: add linkedin connect state and approved draft publishing ux"`

---

### Task 6: End-to-End Verification (Automated + Manual OAuth)

**Files:**
- Modify: tests/docs only if regressions are found

- [ ] **Step 1: Run full backend and frontend suites**
- [ ] **Step 2: Run frontend production build**
- [ ] **Step 3: Bring compose stack up and verify health endpoints**
- [ ] **Step 4: Run API smoke with mock token (`mock-dev-token`) for negative-path coverage**
- [ ] **Step 5: Run manual LinkedIn OAuth connect + publish happy path with real credentials**

Run:
- `python -m pytest backend/tests -q`
- `npm --prefix frontend test`
- `npm --prefix frontend run build`
- `docker compose up --build -d backend chroma frontend`
- `curl -s -o NUL -w "%{http_code}" http://localhost:8000/healthz`
- `curl -s -o NUL -w "%{http_code}" http://localhost:3000/workspace`

Manual verification checklist:
- Sign in to Workspace.
- Open Integrations card and click LinkedIn connect.
- Complete OAuth and return to app.
- Generate LinkedIn draft -> approve -> publish to LinkedIn.
- Confirm UI success state, LinkedIn post URL/URN in response, and activity feed entries.

Expected:
- All automated tests pass.
- Real OAuth connection succeeds with valid credentials.
- LinkedIn publish succeeds only for approved LinkedIn drafts.
- Activity feed shows `linkedin_connected` and channelized `content_published`; failures show `linkedin_publish_failed`.

Commit:
- `git commit -m "test: verify linkedin publishing path end-to-end"`

---

## Success Checklist

- `POST /linkedin/connect` supports start/complete/status contract and is auth-protected.
- `POST /linkedin/publish` enforces approved LinkedIn draft before publishing.
- Existing `/approvals/publish` cannot bypass LinkedIn publishing for LinkedIn-format drafts.
- LinkedIn token state is persisted per user and never returned raw to frontend.
- Successful publish sets generation to `published`; failed publish keeps draft publishable for retry.
- Workspace shows LinkedIn integration state and publish success/failure UX.
- Activity feed includes LinkedIn connect/publish lifecycle events.
- Existing memory/chat/research/content/approval flows remain regression-free.

## Execution Guidance

- Implement with @test-driven-development for each backend/frontend slice.
- Before any completion claim, run @verification-before-completion and report command evidence.
