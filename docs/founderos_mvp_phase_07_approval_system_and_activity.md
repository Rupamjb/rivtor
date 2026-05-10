# Phase 07 — Approval System + Activity Feed

## Goal

Enforce human-in-the-loop approval before execution and make operations visible through timeline events.

## In Scope (MVP)

- Approval endpoints:
  - `POST /approvals/approve`
  - `POST /approvals/reject`
- Approval card actions: approve, reject, publish, save draft.
- Activity feed endpoint: `GET /activities/feed`.

## Tasks

### Backend
- Add approvals service and status transitions.
- Gate publish/action endpoints behind approval state checks.
- Create activity logger helper used by all critical flows.

### Frontend
- Build approval card component states (pending/approved/rejected/published).
- Build activity feed panel with key event types.
- Keep timeline partially mockable where integration is pending.

## Exit Criteria

- No publish action can execute without approval.
- Timeline visibly updates with document, generation, approval, and publish events.
