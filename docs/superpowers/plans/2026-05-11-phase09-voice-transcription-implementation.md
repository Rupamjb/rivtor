# Phase 09 Voice Transcription Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add push-to-record voice transcription in Workspace so founders can record a short prompt, review transcript text, and submit through the existing chat workflow.

**Architecture:** Add a dedicated backend voice endpoint (`POST /voice/transcribe`) that accepts authenticated multipart audio uploads, calls Whisper, returns transcript text, and logs transcription activity events. In the frontend composer, add a push-to-record microphone interaction that records short clips, transcribes via backend, shows transcript preview, and injects text into the existing input/send flow without introducing realtime or continuous listening.

**Tech Stack:** FastAPI, Pydantic, httpx, python-multipart, Supabase activities logging, Next.js/React, MediaRecorder API, Vitest, Pytest.

---

## Integration Constraints

- Keep MVP scope strict: push-to-record only; no realtime assistant mode, no continuous listening, no streaming voice chat.
- Reuse existing auth/middleware patterns (`AuthGuardMiddleware`) and route wiring conventions in `backend/app/api/router.py`.
- Reuse existing activity logging path (`ActivityLogger`) for transcription events.
- Keep Workspace visual language and existing composer behavior; voice is additive, not a redesign.
- Do not auto-send transcripts; user must review and submit through normal chat flow.
- Preserve local/dev/prod parity: Whisper config via env vars, documented in `.env.example`.

---

## Required Contracts (Lock Before Implementation)

### POST /voice/transcribe

Multipart request:
- `file` (required audio file)

Allowed file formats (MVP):
- extensions: `.webm`, `.wav`, `.mp3`, `.m4a`
- mime types: `audio/webm`, `audio/wav`, `audio/mpeg`, `audio/mp4`, `audio/x-m4a`

200 Response:
- `transcript: str`
- `provider: "whisper"`
- `model: str`
- `language: str | null`

Errors:
- `400` invalid file type, empty upload, payload too large, or empty transcript
- `401` unauthenticated request
- `503` Whisper provider unavailable or not configured

Security rules:
- enforce max upload size at service layer (for example 10 MB)
- never persist raw audio bytes to storage
- sanitize filename usage (treat as display metadata only)

### Activity Feed Event Extension

On successful transcription, log:
- `event_type: "voice_transcribed"`
- metadata keys:
  - `mime_type`
  - `audio_bytes`
  - `transcript_chars`
  - `provider: "whisper"`

Optional but recommended for debugging:
- `voice_transcription_failed` event on provider/runtime failures (best effort only)

### Frontend Composer Behavior Contract

- Press-and-hold mic starts recording.
- Release stops recording and begins transcription.
- While transcribing, show clear loading state and disable duplicate recording actions.
- On success, always inject transcript into composer input (replace empty input; append if user already typed text) and show preview of inserted text.
- User can edit transcript text before sending.
- On failure, show actionable error and keep existing input untouched.

---

## File Structure and Responsibilities

- `backend/app/core/config.py` - add Whisper settings and upload limits.
- `.env.example` - document Whisper env vars.
- `backend/app/services/whisper_api_client.py` - low-level Whisper HTTP wrapper.
- `backend/app/services/voice_transcription_service.py` - validation + orchestration + activity logging.
- `backend/app/api/routes/voice.py` - transcribe endpoint contract and error mapping.
- `backend/app/api/router.py` - register voice router.
- `backend/app/middleware/auth_guard.py` - protect `/voice` paths.
- `backend/app/services/__init__.py` - export voice services.
- `backend/tests/test_phase9_voice_service.py` - service-level transcription tests.
- `backend/tests/test_phase9_voice_api.py` - route contract/auth/error mapping tests.
- `backend/tests/test_phase2_auth.py` - auth middleware regression for `/voice`.
- `frontend/src/lib/voice.ts` - typed voice API client.
- `frontend/src/types/founderos-dashboard.ts` - add voice composer state fields.
- `frontend/src/store/founderos-dashboard-store.ts` - voice state/actions.
- `frontend/src/hooks/use-founderos-dashboard.ts` - transcribe action + input injection orchestration.
- `frontend/src/components/chat/chat-input-bar.tsx` - push-to-record UX, mic button states, transcript preview.
- `frontend/src/components/chat/conversation-workspace.tsx` - wire voice callbacks/props into composer.
- `frontend/src/legacy/pages/Workspace.tsx` - pass transcribe action from hook to workspace component tree.
- `frontend/src/tests/voice.test.ts` - client-level API tests.
- `frontend/src/tests/Workspace.test.tsx` - integration tests for voice flow in composer.

---

### Task 1: Lock Voice Contracts With Failing Tests First

**Files:**
- Create: `backend/tests/test_phase9_voice_service.py`
- Create: `backend/tests/test_phase9_voice_api.py`
- Create: `frontend/src/tests/voice.test.ts`

- [ ] **Step 1: Write failing service tests for file validation and provider call orchestration**

```python
async def test_transcribe_rejects_unsupported_file_type():
    with pytest.raises(ValueError):
        await service.transcribe(user_id="u1", file_name="recording.ogg", content_type="audio/ogg", content=b"...")
```

- [ ] **Step 2: Write failing service tests for successful transcription activity logging and empty transcript rejection**
- [ ] **Step 3: Write failing API tests for `/voice/transcribe` success, 400 validation (including empty transcript), and 503 provider failure mapping**
- [ ] **Step 4: Write failing API auth test for missing bearer token**
- [ ] **Step 5: Write failing frontend voice client tests for multipart request shape and error detail propagation**
- [ ] **Step 6: Run focused tests to capture RED baseline and commit**

Run:
- `python -m pytest backend/tests/test_phase9_voice_service.py -q`
- `python -m pytest backend/tests/test_phase9_voice_api.py -q`
- `npm --prefix frontend test -- --run src/tests/voice.test.ts`

Expected:
- RED (voice route/service/client not implemented yet)

Commit:
- `git commit -m "test: add failing phase09 voice transcription contracts"`

---

### Task 2: Add Backend Whisper Config and HTTP Client

**Files:**
- Modify: `backend/app/core/config.py`
- Modify: `.env.example`
- Create: `backend/app/services/whisper_api_client.py`

- [ ] **Step 1: Add config fields**
  - `whisper_api_key`
  - `whisper_api_base_url` (default `https://api.openai.com/v1`)
  - `whisper_model` (default `whisper-1`)
  - `voice_max_upload_mb` (default `10`)
- [ ] **Step 2: Document required Whisper env vars in `.env.example`**
- [ ] **Step 3: Implement `WhisperApiClient.transcribe_audio(...)` using multipart POST to `/audio/transcriptions`**
- [ ] **Step 4: Map upstream failures to stable runtime errors (`Whisper unavailable`, `Whisper not configured`)**
- [ ] **Step 5: Run focused backend tests and commit**

Run:
- `python -m pytest backend/tests/test_phase9_voice_service.py -q`

Expected:
- still RED for route/service orchestration, but client/config layer compiles

Commit:
- `git commit -m "feat: add whisper config and api client for voice transcription"`

---

### Task 3: Implement Voice Transcription Service and API Route

**Files:**
- Create: `backend/app/services/voice_transcription_service.py`
- Create: `backend/app/api/routes/voice.py`
- Modify: `backend/app/api/router.py`
- Modify: `backend/app/middleware/auth_guard.py`
- Modify: `backend/app/services/__init__.py`
- Modify: `backend/tests/test_phase2_auth.py`

- [ ] **Step 1: Implement service validation helpers (allowed extension/mime, empty payload, max bytes)**
- [ ] **Step 2: Implement `transcribe(...)` orchestration using `WhisperApiClient`**
- [ ] **Step 3: Log `voice_transcribed` activity with metadata**
- [ ] **Step 4: Add `/voice/transcribe` route with multipart upload handling and status mapping**
- [ ] **Step 5: Register voice router in API router and add `/voice` to protected prefixes**
- [ ] **Step 6: Add auth regression for `/voice/transcribe` in `test_phase2_auth.py`**
- [ ] **Step 7: Run backend voice/auth tests and commit**

Run:
- `python -m pytest backend/tests/test_phase9_voice_service.py -q`
- `python -m pytest backend/tests/test_phase9_voice_api.py -q`
- `python -m pytest backend/tests/test_phase2_auth.py -q`

Expected:
- GREEN for voice service/API contracts and auth protection

Commit:
- `git commit -m "feat: add authenticated voice transcription endpoint"`

---

### Task 4: Add Frontend Voice Client and Dashboard State Wiring

**Files:**
- Create: `frontend/src/lib/voice.ts`
- Modify: `frontend/src/types/founderos-dashboard.ts`
- Modify: `frontend/src/store/founderos-dashboard-store.ts`
- Modify: `frontend/src/hooks/use-founderos-dashboard.ts`

- [ ] **Step 1: Implement `transcribeVoice(...)` client with `FormData` upload to `/voice/transcribe`**
- [ ] **Step 2: Add voice state fields in dashboard types/store**
  - `voiceStatus: "idle" | "recording" | "transcribing"`
  - `voicePreview: string`
  - `voiceError: string`
- [ ] **Step 3: Add store actions for voice lifecycle (`setVoiceStatus`, `setVoicePreview`, `setVoiceError`, `clearVoice`)**
- [ ] **Step 4: Add hook action `transcribeAudio(file: File)` to call backend and update state**
- [ ] **Step 5: Inject transcript into existing composer input (replace empty input, append with newline if non-empty)**
- [ ] **Step 6: Run frontend unit tests and commit**

Run:
- `npm --prefix frontend test -- --run src/tests/voice.test.ts`

Expected:
- GREEN for client request/response/error behavior

Commit:
- `git commit -m "feat: add voice transcription client and dashboard state orchestration"`

---

### Task 5: Implement Push-to-Record Composer UX and Preview

**Files:**
- Modify: `frontend/src/components/chat/chat-input-bar.tsx`
- Modify: `frontend/src/components/chat/conversation-workspace.tsx`
- Modify: `frontend/src/legacy/pages/Workspace.tsx`
- Modify: `frontend/src/tests/Workspace.test.tsx`

- [ ] **Step 1: Add failing Workspace tests for voice states (idle -> recording -> transcribing -> preview ready)**
- [ ] **Step 2: Add failing test for transcript injection into composer input without auto-send**
- [ ] **Step 3: Add failing test for transcription error UI path**
- [ ] **Step 4: Implement press-and-hold mic behavior in `chat-input-bar` using `MediaRecorder`**
  - `onPointerDown` start recording
  - `onPointerUp/onPointerLeave` stop recording
  - build `File` from chunks and call `onTranscribeAudio`
- [ ] **Step 5: Show explicit status text and mic affordances (`Recording...`, `Transcribing...`)**
- [ ] **Step 6: Show transcript preview block with inserted text and `Discard` action (clears preview, keeps manually edited composer text)**
- [ ] **Step 7: Keep send path unchanged: transcript text flows through normal `onSubmit`**
- [ ] **Step 8: Run Workspace tests and commit**

Run:
- `npm --prefix frontend test -- --run src/tests/Workspace.test.tsx`

Expected:
- GREEN; voice composer interactions do not regress existing chat/content/linkedin workflows

Commit:
- `git commit -m "feat: add push-to-record transcription ux in workspace composer"`

---

### Task 6: Verification and Runtime Smoke

**Files:**
- Modify tests/docs only if regressions are found

- [ ] **Step 1: Run full backend tests**
- [ ] **Step 2: Run full frontend tests**
- [ ] **Step 3: Run frontend production build**
- [ ] **Step 4: Rebuild docker stack and run health checks**
- [ ] **Step 5: Manual voice transcription flow in browser with microphone permission**

Run:
- `python -m pytest backend/tests -q`
- `npm --prefix frontend test`
- `npm --prefix frontend run build`
- `docker compose up --build -d backend frontend chroma`
- `curl -s -o NUL -w "%{http_code}" http://localhost:8000/healthz`
- `curl -s -o NUL -w "%{http_code}" http://localhost:3000/workspace`

Manual checklist:
- Sign in and open `/workspace`.
- Hold mic button, speak a short prompt, release.
- Confirm `Transcribing...` state then transcript preview appears.
- Confirm transcript is inserted into composer input and editable.
- Click send and verify standard chat flow executes (no special voice endpoint used after transcription).
- Confirm activity feed includes `voice_transcribed` event.

Expected:
- All tests pass.
- Voice transcription works for short recordings.
- Existing non-voice flows remain stable.

Commit:
- `git commit -m "test: verify phase09 voice transcription flow end-to-end"`

---

## Success Checklist

- `/voice/transcribe` exists, is authenticated, and handles secure multipart audio uploads.
- Whisper integration returns transcript text with stable error mapping.
- Successful transcriptions create `voice_transcribed` activity events.
- Workspace composer supports push-to-record and clear loading/error states.
- Transcript preview appears before user submits to chat.
- Transcript feeds existing chat input/send flow without introducing a separate execution path.
- No realtime/continuous listening behavior is introduced.
- Existing Workspace tests (chat/research/content/linkedin approvals) remain green.

## Execution Guidance

- Implement each task with @test-driven-development.
- Before claiming completion, run @verification-before-completion and provide command evidence.
