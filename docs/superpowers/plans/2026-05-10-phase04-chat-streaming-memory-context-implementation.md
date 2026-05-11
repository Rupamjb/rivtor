# Phase 04 Chat Streaming + Memory Context Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a production-shaped `/chat/query` workflow that retrieves Company Brain context, generates an LLM answer, streams response chunks to the workspace UI, and persists chat history.

**Architecture:** Add a backend chat orchestration layer that composes prompt context from `MemoryService.search`, calls a Bedrock-backed chat model adapter, and streams NDJSON events (`status`, `token`, `citations`, `done`) through FastAPI `StreamingResponse`. Persist each completed turn to Supabase `chats`, then update the frontend workspace chat thread to consume streaming events progressively with explicit status indicators and visible citation badges.

**Tech Stack:** FastAPI, StreamingResponse, Pydantic, httpx, boto3 (fallback), Supabase REST API, ChromaDB retrieval, Next.js App Router, React stateful streaming UI, Vitest, Pytest.

---

## Integration Constraints

- Keep existing auth middleware contract unchanged (`Authorization: Bearer <supabase access token>`).
- Reuse the current Bedrock hybrid credential strategy (bearer token primary, boto fallback) for chat generation.
- Preserve current workspace visual language (`rv-*` tokens, hairline panels, status chips).
- Keep MVP scope tight: single-turn query endpoint + streamed output + citations + chat persistence.

---

## File Structure & Responsibilities

- `supabase/migrations/20260510190000_phase04_chats.sql` - create `public.chats` table + indexes + RLS policies.
- `backend/app/services/chats_repo.py` - persist and list chat rows from Supabase REST.
- `backend/app/services/chat_model_service.py` - Bedrock chat generation adapter (bearer HTTP first, boto fallback).
- `backend/app/services/chat_orchestrator.py` - retrieval + prompt assembly + generation + citation shaping + persistence.
- `backend/app/api/routes/chat.py` - `/chat/query` request parsing and NDJSON event streaming.
- `backend/app/api/router.py` - include chat router.
- `backend/app/core/config.py` - add Bedrock chat model configuration fields.
- `backend/tests/test_phase4_chat_service.py` - orchestration unit tests.
- `backend/tests/test_phase4_chat_api.py` - endpoint streaming contract tests.
- `frontend/src/lib/chat.ts` - streaming client and NDJSON parser.
- `frontend/src/legacy/pages/Workspace.tsx` - progressive assistant rendering + status indicators + citation badges.
- `frontend/src/tests/chat-stream.test.ts` - stream parser/client tests.
- `frontend/src/tests/Workspace.test.tsx` - workspace streaming UI assertions and regressions.

---

### Task 1: Database + Config Contract for Chat Persistence

**Files:**
- Create: `supabase/migrations/20260510190000_phase04_chats.sql`
- Modify: `backend/app/core/config.py`
- Modify: `.env.example`
- Modify: `backend/.env` (placeholder fields only)

- [ ] **Step 1: Write failing DB contract test/validation note for expected `chats` columns**
- [ ] **Step 2: Add migration for `public.chats` with minimal MVP fields (`id`, `user_id`, `query`, `response`, `agent_type`, `citations`, `created_at`)**
- [ ] **Step 3: Add RLS + indexes (`user_id`, `created_at desc`) matching existing `documents` patterns**
- [ ] **Step 4: Add config keys for chat model (`BEDROCK_CHAT_MODEL`) and defaults**
- [ ] **Step 5: Commit schema/config setup**

Run:
- `python -m pytest backend/tests/test_phase2_auth.py -q`

Expected:
- PASS, no auth regressions

Commit:
- `git commit -m "feat: add chats schema and chat model config"`

---

### Task 2: Backend Chat Orchestration Service (Retrieval -> Prompt -> Generation -> Persist)

**Files:**
- Create: `backend/app/services/chats_repo.py`
- Create: `backend/app/services/chat_model_service.py`
- Create: `backend/app/services/chat_orchestrator.py`
- Modify: `backend/app/services/__init__.py`
- Test: `backend/tests/test_phase4_chat_service.py`

- [ ] **Step 1: Write failing orchestration tests for memory injection, citation extraction, and persistence**

```python
async def test_orchestrator_injects_memory_and_persists_chat():
    result = await service.run_query(user_id="u1", query="summarize notes", agent_type="executive")
    assert result.response_text
    assert result.citations
```

- [ ] **Step 2: Implement `ChatsRepository.create_chat(...)` with Supabase REST service-role headers**
- [ ] **Step 3: Implement `ChatModelService.generate(...)` using Bedrock bearer HTTP path and boto fallback path**
- [ ] **Step 4: Implement `ChatOrchestrator.run_query(...)` to call `MemoryService.search`, build prompt context block, call model service, map citations, and persist chat row**
- [ ] **Step 5: Re-run focused service tests and commit**

Run:
- `python -m pytest backend/tests/test_phase4_chat_service.py -q`

Expected:
- RED first: missing `chat_orchestrator` module
- GREEN after implementation: all tests pass

Commit:
- `git commit -m "feat: add chat orchestration with memory context and persistence"`

---

### Task 3: `/chat/query` Streaming API Endpoint

**Files:**
- Create: `backend/app/api/routes/chat.py`
- Modify: `backend/app/api/router.py`
- Test: `backend/tests/test_phase4_chat_api.py`

- [ ] **Step 1: Write failing API tests for authenticated streaming contract and unauthenticated rejection using dependency overrides (`FakeChatOrchestrator`) so tests do not call Bedrock/Supabase**

```python
def test_chat_query_streams_ndjson_events(client):
    response = client.post("/chat/query", headers=auth, json={"query": "hello"})
    assert response.status_code == 200
    assert b'"type":"status"' in response.content
```

- [ ] **Step 2: Implement request model (`query`, optional `agent_type`, optional `top_k`) and dependency wiring for orchestrator**
- [ ] **Step 3: Implement async generator yielding NDJSON events in this order: `status(retrieving_memory)` -> `status(generating_response)` -> `token*` -> `status(preparing_output)` -> `citations` -> `done`**
- [ ] **Step 4: Return `StreamingResponse(..., media_type="application/x-ndjson")` and map runtime errors to stream `error` events**
- [ ] **Step 5: Re-run API tests and commit**

Run:
- `python -m pytest backend/tests/test_phase4_chat_api.py -q`
- `python -m pytest backend/tests/test_phase2_auth.py -q`

Expected:
- PASS; protected endpoint still enforces bearer auth

Commit:
- `git commit -m "feat: add streaming chat query endpoint"`

---

### Task 4: Frontend Streaming Client + Workspace Integration

**Files:**
- Create: `frontend/src/lib/chat.ts`
- Modify: `frontend/src/legacy/pages/Workspace.tsx`
- Test: `frontend/src/tests/chat-stream.test.ts`

- [ ] **Step 1: Write failing stream parser tests for NDJSON event parsing and incremental callbacks**

```ts
it("parses status/token/citations/done stream events", async () => {
  const events = await collectEventsFromStream(mockResponse)
  expect(events.map((e) => e.type)).toEqual(["status", "token", "done"])
})
```

- [ ] **Step 2: Implement `streamChatQuery(...)` helper that uses `fetch` POST and reads `ReadableStream` chunks into parsed NDJSON events**
- [ ] **Step 3: Replace current mock assistant response logic in `Workspace.tsx` with streamed event handling (incremental assistant token append)**
- [ ] **Step 4: Wire status indicators to backend stages (`retrieving memory`, `generating response`, `preparing output`) and render citation badges from stream event payload**
- [ ] **Step 5: Re-run focused frontend tests and commit**

Run:
- `npm --prefix frontend test -- --run src/tests/chat-stream.test.ts src/tests/Workspace.test.tsx`

Expected:
- RED first: missing `streamChatQuery`
- GREEN after implementation

Commit:
- `git commit -m "feat: stream chat responses in workspace with memory citations"`

---

### Task 5: End-to-End Verification + Seamless Integration Checks

**Files:**
- Modify: `frontend/src/tests/Workspace.test.tsx`
- Modify: `backend/tests/test_phase4_chat_api.py` (if needed for edge cases)

- [ ] **Step 1: Add/adjust regression tests to confirm existing document upload + memory panels still work with new chat flow**
- [ ] **Step 2: Validate full backend and frontend test suites**
- [ ] **Step 3: Validate local compose runtime and stream endpoint manually**

Run:
- `python -m pytest backend/tests -q`
- `npm --prefix frontend test`
- `npm --prefix frontend run build`
- `docker compose up --build -d backend chroma frontend`
- `curl -s -o NUL -w "%{http_code}" http://localhost:8000/healthz`
- `curl -s -o NUL -w "%{http_code}" http://localhost:3000/workspace`
- `FOUNDEROS_E2E_ACCESS_TOKEN=<real Supabase access token for authenticated test user>`
- `python -c "import os,httpx; token=os.environ['FOUNDEROS_E2E_ACCESS_TOKEN']; r=httpx.post('http://localhost:8000/chat/query',headers={'Authorization':f'Bearer {token}'},json={'query':'Summarize founder notes'},timeout=60.0); print(r.status_code); print(r.text[:600])"`

Expected:
- backend tests PASS
- frontend tests/build PASS
- `/chat/query` returns stream events containing status + token + done

Commit:
- `git commit -m "test: verify chat streaming and memory context integration"`

---

## Success Checklist

- `/chat/query` exists and streams progressive response events for authenticated users.
- Prompt pipeline injects top memory chunks before generation.
- Workspace renders streamed tokens progressively (no blocking full response swap).
- UI shows explicit runtime statuses (`retrieving memory`, `generating response`, `preparing output`).
- Citation badges/source labels are visible in chat UI and trace to retrieved context.
- Completed chat turns are persisted to Supabase `chats` with query/response/agent metadata.

## Execution Guidance

- Implement with @test-driven-development across backend + frontend tasks.
- Before completion claims or PR handoff, run @verification-before-completion checks with command output evidence.
