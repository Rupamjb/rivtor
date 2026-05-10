# Phase 05 — Research Agent

## Goal

Enable web-aware research outputs for trends, competitors, and market summaries.

## In Scope (MVP)

- Agent endpoint: `POST /agents/research`.
- Query routing for research intent keywords.
- Tavily or Serper integration.
- Structured research summary output.

## Tasks

### Backend
- Add research agent node/service.
- Integrate external web search provider adapter.
- Merge search findings with memory context when available.
- Save outputs in `generations` and add activity events.

### Frontend
- Add agent selector with Research option.
- Render research cards with source context badges.
- Add suggested actions after document uploads.

## MVP Constraints

- No browser automation.
- No autonomous browsing loops.

## Exit Criteria

- User can request competitor/trend research and receive structured summary.
- Activity feed logs research completion event.
