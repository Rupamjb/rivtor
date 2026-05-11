# Phase 02 Auth and Workspace Design Spec

## Context

This spec defines the Phase 02 implementation details for FounderOS after the frontend runtime migration to Next.js. Scope includes:

- improved login/signup design
- smart `GET STARTED` auth routing
- polished 3-panel workspace shell
- hybrid auth wiring between frontend Supabase session and backend protected APIs

This spec preserves the existing landing page design philosophy and avoids generic SaaS dashboard visuals.

## Goals

1. Improve auth page visual quality without changing brand language.
2. Deliver a credible founder workspace shell (desktop + mobile responsive).
3. Keep auth/session flow stable and predictable across routes.
4. Keep backend protection and frontend auth state seamlessly integrated.

## Non-Goals

- No deep live data integration in workspace panels for this phase.
- No redesign of landing page sections.
- No expansion into Phase 03 memory/agent business logic.

## Chosen Approach

Approach selected: route-preserving incremental migration.

- Keep current Next route structure.
- Improve auth and workspace presentation using existing design tokens.
- Keep backend middleware as API-level guard.
- Keep UI-level route guard for smooth user redirect behavior.

## UX Design Decisions

### 1) Login and Signup Layout

- Replace overly wide single-card feeling with a constrained auth panel (`max-width` target ~440-480px).
- Keep atmospheric background treatment (`bg-grid`, gradients, hairline accents) consistent with existing language.
- Preserve typography stack and token usage (`rv-*` colors, display headings, eyebrow labels).
- Keep content hierarchy strict:
  - eyebrow
  - heading
  - supporting line
  - fields
  - primary CTA
  - secondary route link

### 2) Dashboard/Workspace Shell

- Preserve required 3-panel structure from PRD:
  - left: navigation (Dashboard, Company Brain, Agents, Outputs, Activity, Settings)
  - center: AI workspace composer + status indicators + output area
  - right: context badges and contextual summaries
- Improve spacing and panel proportions for desktop readability.
- Keep mobile behavior stacked and usable without horizontal overflow.
- Include operational feel details (status lines, empty states, subtle loading cues) even with mock data.

### 3) GET STARTED Behavior

Smart redirect policy:

- if authenticated session exists -> `/workspace`
- if unauthenticated -> `/auth/login?next=/workspace`

This applies to nav CTA and other primary onboarding entry points.

## Auth and Data Flow Design

### Hybrid Auth Model

- Frontend uses Supabase SDK for signup/login/logout and session hydration.
- Frontend stores session in auth context (`user`, `session`, `loading`).
- Backend middleware validates bearer tokens against Supabase `/auth/v1/user` for protected endpoints.

### Frontend Route Protection

- `/workspace` route checks `loading` and `user` state.
- Unauthenticated users are redirected to `/auth/login?next=/workspace`.

### Backend Protection

- Existing middleware remains the API-level gate for protected prefixes.
- Frontend protected API calls will send `Authorization: Bearer <access_token>`.

## Error Handling and UX Guardrails

- If Supabase env is missing, forms show clear inline actionable error.
- Avoid blank redirects by waiting for session hydration (`loading` guard).
- Keep auth failures localized to form-level messaging.

## Implementation Units

1. Auth page UI refactor (`Login`, `Signup`) with constrained layout and improved visual hierarchy.
2. Smart redirect utility + apply to `GET STARTED` entry points.
3. Workspace shell refinement (layout, spacing, component blocks, mock operational data).
4. Route guard stability checks (`/workspace` + auth pages).
5. Token passthrough helper for future protected API calls.

## Validation Plan

### Functional

- `/auth/login` renders with intended styling and no route error.
- `/auth/signup` renders with intended styling and no route error.
- `/workspace` redirects correctly when unauthenticated.
- login/signup success redirects to `next` target or `/workspace` fallback.
- logout returns user to login and blocks protected workspace access.

### Visual

- Auth card no longer appears stretched on desktop.
- Dashboard preserves current design language and looks intentional, not generic.
- Mobile layout remains clear and touch-friendly.

### Technical

- `npm run build` succeeds.
- `npm run test` succeeds.
- Backend auth smoke checks remain valid for protected endpoints.

## Success Criteria

- Auth screens are visually aligned with brand and composition quality is improved.
- Workspace shell delivers the required PRD structure with polished presentation.
- Smart `GET STARTED` auth flow is deterministic and seamless.
- Frontend and backend auth behaviors are integrated and stable for MVP progression.
