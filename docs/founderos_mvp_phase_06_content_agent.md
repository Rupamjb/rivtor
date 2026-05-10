# Phase 06 — Content Agent

## Goal

Generate startup content (especially LinkedIn drafts) that references founder memory and research context.

## In Scope (MVP)

- Agent endpoint: `POST /agents/content`.
- Contextual content generation (LinkedIn, founder updates, launch posts).
- Output persistence in `generations` with draft status.

## Tasks

### Backend
- Add content agent service with memory + research injection.
- Add output template controls (tone, length, format).
- Mark generated records as approval-required.

### Frontend
- Add content prompt controls and generation actions.
- Display generated drafts in approval-ready cards.
- Show contextual labels in generated content panel.

## UX Requirement

- Generated content must clearly indicate it used founder memory/research context.

## Exit Criteria

- User can generate a context-aware LinkedIn draft from workspace.
- Draft appears with approval actions and metadata.
