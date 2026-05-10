# FounderOS — Final 2-Day MVP Engineering PRD

Version: MVP Sprint Build
Timeline: 2 Days
Goal: Demo-ready AI-native founder workspace

---

# 1. PRODUCT OVERVIEW

FounderOS is an AI-native operational workspace for solo founders.

The MVP focuses on:
- persistent founder memory
- specialized AI agents
- web-aware research
- content generation
- approval workflows
- LinkedIn publishing

The product should feel like:
- an operational workspace
- an AI productivity system
- a startup execution assistant

The product should NOT feel like:
- ChatGPT clone
- simple AI wrapper
- generic chatbot

---

# 2. FINAL MVP GOAL

The user should be able to:

1. Upload startup/company documents
2. Store business knowledge in memory
3. Ask AI questions using company context
4. Run specialized agents
5. Generate startup content
6. Research trends/competitors
7. Approve generated outputs
8. Publish LinkedIn posts
9. View operational activity timeline
10. Use voice input for prompts

This is the COMPLETE MVP.

---

# 3. CORE PRODUCT POSITIONING

FounderOS is:

"An AI-native founder workspace with persistent business memory, specialized AI agents, contextual content generation, and operational execution workflows."

---

# 4. FINAL MVP FEATURES

# FEATURE 1 — AUTHENTICATION

Priority: P0

## Requirements

Users must be able to:
- sign up
- login
- logout
- access protected dashboard routes

## Stack

Frontend:
- Supabase Auth

Backend:
- JWT validation middleware

## Pages

/auth/login
/auth/signup

## Notes

DO NOT build:
- RBAC
- multi-user systems
- password reset
- teams/orgs
- enterprise auth

---

# FEATURE 2 — DASHBOARD WORKSPACE

Priority: P0

This is the main application UI.

## Goal

The dashboard should feel like:
- AI operations center
- founder workspace
- intelligent command system

NOT like:
- simple chatbot

---

## Layout

### LEFT SIDEBAR

Sections:
- Dashboard
- Company Brain
- Agents
- Outputs
- Activity
- Settings

---

### CENTER PANEL

Main AI workspace.

Contains:
- chat interface
- agent responses
- generated outputs
- approval cards
- voice input button

---

### RIGHT PANEL

Context panel.

Contains:
- retrieved memories
- uploaded documents
- web research summaries
- active context badges

Example badges:
- Founder Notes
- Product Roadmap
- AI Trend Research

---

## Components

### 1. AI Chat Area

Capabilities:
- send prompts
- stream responses
- select agents
- display citations/context

---

### 2. Activity Feed

Displays:
- file uploads
- research completed
- post generated
- post approved
- post published

This can be partially mocked.

---

### 3. Suggested Actions

Example:
- Generate launch post
- Summarize startup notes
- Research competitors
- Create investor update

Suggestions generated after uploads.

---

### 4. Approval Cards

Actions:
- approve
- reject
- publish

---

# FEATURE 3 — COMPANY BRAIN (CORE SYSTEM)

Priority: P0

THIS IS THE MOST IMPORTANT FEATURE.

The system must remember founder/company context.

---

## Supported Upload Types

KEEP:
- PDF
- TXT

OPTIONAL:
- simple image OCR

DO NOT BUILD:
- audio memory uploads
- video uploads
- advanced OCR pipelines
- knowledge graphs

---

## Upload Flow

User uploads document
↓
Extract text
↓
Chunk content
↓
Generate embeddings
↓
Store in vector DB
↓
Make searchable

---

## Retrieval Flow

User asks question
↓
Semantic retrieval
↓
Relevant chunks returned
↓
Inject into prompt
↓
Generate response

---

## Required Capabilities

### Memory-Aware Responses

The AI should reference:
- uploaded notes
- founder tone
- previous content
- startup details
- roadmap info

Example:

"Based on your uploaded founder notes and previous launch content..."

This is critical.

---

## Recommended Stack

### Embeddings
- OpenAI text-embedding-3-small

### Vector DB
Recommended:
- ChromaDB

Alternative:
- Supabase pgvector

### Text Extraction
Python libraries:
- pypdf
- pdfplumber

---

# FEATURE 4 — MULTI-AGENT SYSTEM

Priority: P0

IMPORTANT:
This is NOT a true autonomous multi-agent system.

This is:
- controlled orchestration
- specialized agents
- human-supervised execution

---

## Architecture

User Query
↓
Intent Router
↓
Selected Agent
↓
Memory Retrieval
↓
(Optional Web Search)
↓
LLM Generation
↓
Approval Layer

---

## AGENT 1 — RESEARCH AGENT

Capabilities:
- competitor research
- AI/startup trend research
- market summaries
- product research
- web summaries

---

## Tools

### Web Search
Use:
- Tavily API
OR
- Serper API

DO NOT BUILD:
- browser automation
- autonomous browsing
- Playwright systems

---

## Output Examples

"Top AI startup trends this week"

"Competitor summary for AI productivity tools"

---

# AGENT 2 — CONTENT AGENT

Capabilities:
- LinkedIn posts
- Twitter/X posts
- founder updates
- launch announcements
- startup summaries
- blog outlines

---

## Input Sources

The agent should use:
- retrieved memory
- uploaded documents
- research summaries
- founder tone

---

## Important UX Requirement

Generated content should reference memory.

Example:

"Using your uploaded roadmap and latest AI trend research..."

This creates perceived intelligence.

---

# AGENT 3 — EXECUTIVE AGENT

Capabilities:
- summarize outputs
- generate action items
- create daily recaps
- summarize uploaded docs

DO NOT BUILD:
- autonomous planning
- task delegation
- recursive workflows

---

# FEATURE 5 — LINKEDIN PUBLISHING

Priority: P1

This is a VERY IMPORTANT demo feature.

---

## Flow

User requests content
↓
Content Agent generates post
↓
Approval card displayed
↓
User clicks publish
↓
Post sent to LinkedIn

---

## Requirements

### Required
- LinkedIn OAuth
- post publishing endpoint
- approval before posting

### NOT REQUIRED
- scheduling
- analytics
- engagement tracking
- drafts management
- campaigns

---

## Recommended MVP Approach

Use:
- LinkedIn API
OR
- Composio integration

Goal:
Simple publish flow only.

---

# FEATURE 6 — VOICE INPUT

Priority: P1

KEEP THIS VERY SIMPLE.

---

## Required Features

- record voice
- send audio
- transcribe using Whisper
- convert to text prompt

Flow:

Voice Input
↓
Whisper transcription
↓
Text query
↓
Normal AI flow

---

## DO NOT BUILD

- realtime voice assistant
- continuous listening
- voice workflows
- conversational voice agents
- streaming voice

---

# FEATURE 7 — APPROVAL SYSTEM

Priority: P0

The system must require human approval before actions.

---

## Approval Actions

- approve
- reject
- publish
- save draft

---

## Example Flow

AI generates LinkedIn post
↓
Approval card shown
↓
User approves
↓
Post published

---

# FEATURE 8 — OPERATIONAL ACTIVITY FEED

Priority: P1

Purpose:
Make the system feel operational and alive.

---

## Feed Events

- startup notes uploaded
- research completed
- LinkedIn draft generated
- post approved
- post published
- AI summary completed

Can be partially mocked.

---

# 5. FEATURES THAT MUST NOT BE BUILT

DO NOT BUILD THESE.

## REMOVE COMPLETELY

- Redis
- Celery
- Kubernetes infra
- Slack integrations
- Gmail integrations
- CRM systems
- browser agents
- autonomous workflows
- recursive agents
- agent-to-agent communication
- marketplace
- multi-user collaboration
- mobile app
- advanced analytics
- scheduling systems
- workflow builders
- realtime collaboration
- enterprise permissions
- background workers

These are timeline traps.

---

# 6. FINAL TECH STACK

# FRONTEND

- Next.js 15
- TypeScript
- TailwindCSS
- ShadCN UI
- Framer Motion

---

# BACKEND

- FastAPI
- LangGraph
- Pydantic
- Uvicorn

---

# DATABASE

- Supabase PostgreSQL

---

# VECTOR DATABASE

Recommended:
- ChromaDB

Alternative:
- Supabase pgvector

---

# AI STACK

## LLM
- OpenAI GPT-4.1-mini

## Embeddings
- text-embedding-3-small

## Voice
- Whisper API

---

# STORAGE

- Supabase Storage

---

# WEB SEARCH

- Tavily
OR
- Serper

---

# DEPLOYMENT

Frontend:
- Vercel

Backend:
- Railway
OR
- Render

---

# 7. DATABASE SCHEMA

# users

- id
- email
- created_at

---

# documents

- id
- user_id
- file_name
- extracted_text
- vector_id
- created_at

---

# chats

- id
- user_id
- query
- response
- agent_type
- created_at

---

# generations

- id
- user_id
- agent_type
- content
- status
- created_at

---

# approvals

- id
- generation_id
- status
- approved_at

---

# activities

- id
- user_id
- activity_type
- metadata
- created_at

---

# 8. API ARCHITECTURE

# AUTH

POST /auth/signup
POST /auth/login
POST /auth/logout

---

# MEMORY

POST /memory/upload
POST /memory/search
GET /memory/list

---

# AGENTS

POST /agents/research
POST /agents/content
POST /agents/executive

---

# CHAT

POST /chat/query

---

# LINKEDIN

POST /linkedin/connect
POST /linkedin/publish

---

# VOICE

POST /voice/transcribe

---

# APPROVALS

POST /approvals/approve
POST /approvals/reject

---

# ACTIVITIES

GET /activities/feed

---

# 9. LANGGRAPH FLOW

# MAIN FLOW

User Input
↓
Intent Router
↓
Select Agent
↓
Retrieve Memory
↓
(Optional Web Search)
↓
Generate Response
↓
Approval Layer
↓
Save Activity
↓
Return Output

---

# ROUTING LOGIC

## Research Keywords

Route to Research Agent:
- trends
- competitors
- research
- market
- startup news

---

## Content Keywords

Route to Content Agent:
- write
- generate
- post
- tweet
- LinkedIn
- announcement

---

## Executive Keywords

Route to Executive Agent:
- summarize
- action items
- recap
- notes

---

# 10. FRONTEND REQUIREMENTS

# DESIGN STYLE

The app must feel:
- premium
- operational
- futuristic
- AI-native

NOT:
- generic SaaS dashboard
- ChatGPT clone

---

# REQUIRED UI ELEMENTS

## AI Status Indicators

Examples:
- retrieving memory...
- researching web...
- generating content...
- preparing approval...

Even partially fake indicators improve UX massively.

---

## Context Badges

Show sources used.

Examples:
- Founder Notes
- Product Roadmap
- AI Trends
- Competitor Research

---

## Streaming Responses

Responses should stream.

This improves perceived intelligence.

---

## Loading States

Every major action needs:
- skeletons
- loaders
- status indicators

---

# 11. CLAUDE CODE DEVELOPMENT STRATEGY

IMPORTANT:
DO NOT ASK CLAUDE CODE TO BUILD EVERYTHING AT ONCE.

Build feature-by-feature.

---

# RECOMMENDED BUILD ORDER

# STEP 1

Setup:
- Next.js frontend
- FastAPI backend
- Supabase
- environment variables

---

# STEP 2

Build:
- auth
- protected routes
- dashboard layout

---

# STEP 3

Build Company Brain:
- uploads
- extraction
- embeddings
- retrieval

---

# STEP 4

Build chat system:
- streaming
- memory injection
- citations

---

# STEP 5

Build Research Agent:
- web search
- summaries

---

# STEP 6

Build Content Agent:
- LinkedIn generation
- contextual writing

---

# STEP 7

Build approvals:
- approve
- reject
- publish

---

# STEP 8

Build LinkedIn posting.

---

# STEP 9

Build voice transcription.

---

# STEP 10

Polish:
- animations
- loaders
- empty states
- deploy

---

# 12. FINAL 2-DAY TIMELINE

# DAY 1

## Morning

- project setup
- frontend architecture
- backend architecture
- auth
- dashboard layout

---

## Afternoon

- uploads
- text extraction
- embeddings
- vector storage
- retrieval pipeline

---

## Night

- chat system
- LangGraph routing
- first working agent

---

# DAY 2

## Morning

- research agent
- web search
- content generation

---

## Afternoon

- LinkedIn publishing
- approval system
- activity feed
- voice transcription

---

## Night

- polish
- animations
- bug fixes
- deployment
- demo preparation

---

# 13. MOST IMPORTANT PRODUCT PRINCIPLE

The product is NOT:
- a chatbot
- an AI wrapper
- autonomous AGI

The product IS:

"An AI workspace that remembers startup context and performs founder operations using specialized agents and human approvals."

Every feature should reinforce that feeling.

---

# 14. SUCCESS CRITERIA

The MVP succeeds if the demo shows:

1. memory-aware AI
2. web-aware research
3. contextual content generation
4. operational workflows
5. approvals before execution
6. LinkedIn publishing
7. persistent founder context

If these work well, the product will feel significantly more advanced than a normal LLM wrapper.
