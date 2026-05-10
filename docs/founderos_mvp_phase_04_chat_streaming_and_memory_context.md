# Phase 04 — Chat Streaming + Memory Context

## Goal

Ship the main AI chat workflow with streaming responses and memory-aware context injection.

## In Scope (MVP)

- `/chat/query` endpoint.
- Prompt pipeline: user query -> retrieval -> LLM generation.
- Streaming response support to frontend.
- Context citations/badges in UI.

## Tasks

### Backend
- Build chat orchestration service.
- Inject retrieved memory chunks into system/user prompt template.
- Return response chunks in stream-friendly format.
- Persist chat records in `chats` table.

### Frontend
- Build chat composer + response thread UI.
- Render streaming tokens progressively.
- Show AI status indicators:
  - retrieving memory
  - generating response
  - preparing output

## Exit Criteria

- Founder sees streamed responses instead of blocking full response.
- Responses reference uploaded company context in visible way.
