# Phase 03 Company Brain Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement MVP company-memory ingestion and retrieval so authenticated founders can upload PDF/TXT files and semantically retrieve relevant chunks.

**Architecture:** Add a memory domain to FastAPI with dedicated extraction/chunking/embedding/storage services. Persist document metadata plus vector IDs in Supabase `documents`, store chunk vectors in Chroma with per-user metadata, and expose `/memory/upload`, `/memory/search`, `/memory/list`. Extend the workspace UI with a Company Brain panel for upload, status, and retrieval previews.

**Tech Stack:** FastAPI, httpx, pypdf, ChromaDB client, OpenAI embeddings API, Next.js App Router, React, Tailwind, Vitest, Pytest.

## MVP Constraints

- No audio/video upload pipelines.
- No advanced OCR workflows.
- No knowledge graph.

---

### Task 1: Backend Memory Service Building Blocks

**Files:**
- Create: `backend/app/services/__init__.py`
- Create: `backend/app/services/text_extraction.py`
- Create: `backend/app/services/chunking.py`
- Create: `backend/app/services/embedding_service.py`
- Create: `backend/app/services/chroma_store.py`
- Create: `backend/app/services/documents_repo.py`
- Modify: `backend/app/core/config.py`
- Modify: `backend/requirements.txt`

- [ ] **Step 1: Write failing unit tests for extraction + chunking behavior**
- [ ] **Step 2: Implement TXT/PDF extraction utilities and deterministic chunking**
- [ ] **Step 3: Implement OpenAI embeddings adapter (`text-embedding-3-small`) with explicit config validation**
- [ ] **Step 4: Implement Chroma store and Supabase documents repository adapters that persist vector IDs + metadata**
- [ ] **Step 5: Re-run focused backend tests for utility/service modules**

Run:
- `python -m pytest backend/tests/test_phase3_memory_services.py -q`

---

### Task 2: Memory API Endpoints

**Files:**
- Create: `backend/app/api/routes/memory.py`
- Modify: `backend/app/api/router.py`

- [ ] **Step 1: Write failing API tests for `/memory/upload`, `/memory/search`, `/memory/list` using dependency overrides**
- [ ] **Step 2: Implement upload endpoint with file validation, extraction, chunking, embedding, vector upsert, and persistence of vector IDs + metadata in Supabase**
- [ ] **Step 3: Implement search endpoint with top-k semantic query and source metadata response**
- [ ] **Step 4: Implement list endpoint for per-user document metadata from Supabase**
- [ ] **Step 5: Re-run phase 3 API tests and ensure auth guard behavior remains intact**

Run:
- `python -m pytest backend/tests/test_phase3_memory.py -q`
- `python -m pytest backend/tests/test_phase2_auth.py -q`

---

### Task 3: Frontend Company Brain Client + UI Surface

**Files:**
- Create: `frontend/src/lib/company-brain.ts`
- Modify: `frontend/src/legacy/pages/Workspace.tsx`

- [ ] **Step 1: Write failing frontend tests for upload controls, source labels, and retrieval preview rendering**
- [ ] **Step 2: Implement typed frontend API helpers for memory upload/list/search with bearer auth**
- [ ] **Step 3: Add Company Brain panel in workspace (upload + source type labels such as Founder Notes/Product Roadmap + semantic search + preview badges)**
- [ ] **Step 4: Add loading/error/success states and keep existing workspace visual language**
- [ ] **Step 5: Re-run frontend tests for workspace and auth regression checks**

Run:
- `npm --prefix frontend run test`

---

### Task 4: End-to-End Verification Gate

**Files:**
- Modify: none (verification)

- [ ] **Step 1: Backend verification**
- [ ] **Step 2: Frontend verification**
- [ ] **Step 3: Compose verification for backend/chroma/frontend**

Run:
- `python -m pytest backend/tests -q`
- `npm --prefix frontend run test`
- `npm --prefix frontend run build`
- `docker compose up --build -d backend chroma frontend`
- `curl -s -o NUL -w "%{http_code}" http://localhost:8000/healthz`
- `curl -s -o NUL -w "%{http_code}" http://localhost:3000/workspace`

---

## Success Checklist

- Authenticated founders can upload `.pdf` and `.txt` files to Company Brain.
- Uploaded content is chunked, embedded, and persisted in Chroma; vector IDs + metadata are written to Supabase `documents`.
- Semantic retrieval returns relevant chunks with source metadata usable for prompt injection.
- Workspace displays upload state and retrieval preview badges without breaking Phase 2 auth/dashboard flows.
