# Phase 09 — Voice Transcription

## Goal

Add simple voice-to-prompt capability for faster founder input.

## In Scope (MVP)

- Voice record action in chat composer.
- Backend transcription endpoint: `POST /voice/transcribe`.
- Whisper API integration.
- Inject transcription result into normal chat flow.

## Tasks

### Backend
- Implement secure multipart audio upload handling.
- Call Whisper API and return text result.
- Log transcription events into activity feed.

### Frontend
- Add push-to-record UX with clear loading status.
- Show transcribed text preview before submit.
- Reuse existing chat submission flow.

## MVP Constraints

- No realtime assistant mode.
- No continuous listening.
- No streaming voice conversations.

## Exit Criteria

- User records a short prompt, gets transcript, and can submit directly to chat.
