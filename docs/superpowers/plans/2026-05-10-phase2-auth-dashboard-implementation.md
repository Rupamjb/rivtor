# Phase 02 Auth and Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver refined login/signup UX, smart Get Started auth routing, and a polished 3-panel founder dashboard shell wired to hybrid auth.

**Architecture:** Keep the existing Next.js route map and landing visual language. Refactor auth screens into a constrained premium layout, wire CTA routing via auth-aware destination logic, and refine workspace shell with realistic mocked operational blocks. Keep frontend Supabase session as auth source while adding backend token pass-through helpers for protected APIs.

**Tech Stack:** Next.js App Router, React, Tailwind, Supabase JS, FastAPI bearer-protected APIs.

---

### Task 1: Auth Routing and CTA Destination Logic

**Files:**
- Create: `frontend/src/lib/auth-routing.ts`
- Modify: `frontend/src/components/rivtor/Navbar.tsx`
- Modify: `frontend/src/legacy/pages/GetStarted.tsx`

- [ ] **Step 1: Write failing test for smart destination logic**
- [ ] **Step 2: Implement pure helper `getStartedDestination(isAuthenticated)`**
- [ ] **Step 3: Use helper in nav CTA and Get Started CTA**
- [ ] **Step 4: Re-run tests and route checks**

Run:
- `npm --prefix frontend run test`
- `curl -I http://localhost:3000/get-started`

Note: run the `curl` checks only while frontend dev server is running.

---

### Task 2: Login/Signup UI Redesign (No Design Drift)

**Files:**
- Create: `frontend/src/components/auth/AuthShell.tsx`
- Modify: `frontend/src/legacy/pages/auth/Login.tsx`
- Modify: `frontend/src/legacy/pages/auth/Signup.tsx`
- Modify: `frontend/src/app/auth/signup/page.tsx`
- Test: `frontend/src/tests/auth-pages.test.tsx`

- [ ] **Step 1: Write failing UI smoke assertions for auth pages**
- [ ] **Step 2: Build constrained auth shell with max width and two-zone composition**
- [ ] **Step 3: Keep existing token/typography/hairline language intact**
- [ ] **Step 4: Ensure login/signup submit flow and redirects are explicit**

- login + signup redirect to `next` when provided, otherwise `/workspace`
- missing Supabase env renders clear inline configuration error on form

Run:
- `npm --prefix frontend run test`
- `curl -s http://localhost:3000/auth/login`
- `curl -s http://localhost:3000/auth/signup`

Note: run the `curl` checks only while frontend dev server is running.

---

### Task 3: Dashboard Shell Upgrade (UI-First + Mock Ops Data)

**Files:**
- Modify: `frontend/src/legacy/pages/Workspace.tsx`
- Modify: `frontend/src/app/workspace/page.tsx`
- Test: `frontend/src/tests/Workspace.test.tsx`

- [ ] **Step 1: Add failing assertions for required IA sections**

- left nav must contain `Dashboard, Company Brain, Agents, Outputs, Activity, Settings`
- center panel must include prompt composer, status indicators, output region
- right panel must include context badges/summaries
- [ ] **Step 2: Implement refined left/center/right panel composition**
- [ ] **Step 3: Add mock operational blocks (status, suggested actions, approvals, activity snapshot)**
- [ ] **Step 4: Validate responsive behavior and guard logic**

Run:
- `npm --prefix frontend run test`
- `curl -I http://localhost:3000/workspace`

Note: run the `curl` checks only while frontend dev server is running.

---

### Task 4: Backend Seamless Auth Wiring Helpers

**Files:**
- Create: `frontend/src/lib/backend.ts`
- Modify: `frontend/src/context/AuthContext.tsx`
- Test: `frontend/src/tests/backend-auth-helper.test.ts`

- [ ] **Step 1: Add helper for bearer headers and backend logout ping**
- [ ] **Step 2: Wire sign-out flow to best-effort backend `/auth/logout` call**
- [ ] **Step 3: Keep graceful no-backend/no-token fallback behavior**

- bearer header construction handles missing session token safely
- backend logout ping is best effort and never blocks frontend logout UX
- [ ] **Step 4: Verify no auth regressions in login/logout cycle**

Run:
- `npm --prefix frontend run test`
- `npm --prefix frontend run build`

---

### Task 5: Final Verification Gate

**Files:**
- Modify: none (verification)

- [ ] **Step 1: Build and type verification**
- [ ] **Step 2: Route-level checks**
- [ ] **Step 3: Manual auth flow checks**

Run:
- `npm --prefix frontend run build`
- `npm --prefix frontend run test`
- `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000`
- `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/auth/login`
- `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/auth/signup`
- `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/get-started`
- verify unauthenticated `/workspace` redirects to `/auth/login?next=/workspace` (status + `Location`)
- verify `/auth/signup?next=/workspace` success path redirects to `/workspace`
- validate workspace has no horizontal overflow at mobile widths (375px and 430px)
- `python -m pytest backend/tests/test_phase2_auth.py -q`

Expected backend auth smoke behavior:
- protected endpoint returns 401 without bearer token
- protected endpoint returns 200 with valid/mock bearer token

Note: run the `curl` checks only while frontend dev server is running.

---

## Success Checklist

- Login and signup cards are no longer visually stretched.
- `GET STARTED` routes authenticated users to workspace and unauthenticated users to login with next target.
- Workspace presents required 3-panel founder shell with operational cues.
- Frontend auth flow remains stable and backend auth integration is wired for protected API evolution.
