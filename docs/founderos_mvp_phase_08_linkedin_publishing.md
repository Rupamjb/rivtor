# Phase 08 — LinkedIn Publishing

## Goal

Complete the demo-critical publish path: approved content -> LinkedIn post.

## In Scope (MVP)

- LinkedIn OAuth connection flow.
- Publish endpoint: `POST /linkedin/publish`.
- Connector endpoint: `POST /linkedin/connect`.
- Approval-enforced publish trigger.

## Tasks

### Backend
- Implement LinkedIn auth token handling.
- Implement publish API wrapper with robust error mapping.
- Record publish results and activity events.

### Frontend
- Add LinkedIn connect state in Settings/integration section.
- Add publish CTA on approved draft cards.
- Show publish success/failure states and retries.

## MVP Constraints

- No scheduling.
- No campaign analytics.
- No drafts management system beyond simple status.

## Exit Criteria

- Approved LinkedIn draft can be posted from FounderOS.
- User sees clear confirmation in UI and activity feed.
