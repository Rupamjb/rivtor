# Phase 03 — Company Brain (Ingestion + Retrieval)

## Goal

Implement the core memory system so founder documents can be uploaded, embedded, stored, and retrieved contextually.

## In Scope (MVP)

- Upload support for PDF and TXT only.
- Text extraction, chunking, embeddings (`text-embedding-3-small`).
- Vector storage in ChromaDB.
- Metadata storage in Supabase (`documents`).
- Retrieval endpoint for top relevant chunks.

## Tasks

### Backend
- Implement `/memory/upload`, `/memory/search`, `/memory/list`.
- Add extraction service using `pypdf` or `pdfplumber`.
- Add chunking utility and embedding service.
- Persist vector ids + metadata.

### Frontend
- Build upload surface inside Company Brain section.
- Add upload state indicators and retrieval result preview badges.
- Show memory source labels (Founder Notes, Product Roadmap, etc.).

## MVP Constraints

- No audio/video upload pipelines.
- No advanced OCR workflows.
- No knowledge graph.

## Exit Criteria

- Uploaded PDF/TXT content is searchable semantically.
- Retrieval returns useful contextual chunks for prompt injection.
