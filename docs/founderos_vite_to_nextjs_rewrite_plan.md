# FounderOS Vite to Next.js Rewrite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current Vite + React Router frontend runtime with Next.js 15 while preserving the exact existing landing page UI/UX and routes.

**Architecture:** Keep all visual components and design tokens unchanged, then swap only the runtime shell (entrypoint, routing, build/dev tooling). Use Next App Router with a client-only route bridge to avoid SSR issues from `@react-three/fiber` and preserve current page behavior.

**Tech Stack:** Next.js 15, React 18, TypeScript, TailwindCSS, existing shadcn/ui + framer-motion stack.

---

## File Structure Plan

- Keep: `frontend/src/components/**`, `frontend/src/index.css`, `frontend/src/pages/**` (design + page content)
- Create: `frontend/src/app/layout.tsx`, `frontend/src/app/page.tsx`, `frontend/src/app/[...slug]/page.tsx`, `frontend/src/next/RouteBridge.tsx`
- Modify: `frontend/package.json`, `frontend/tsconfig.json`, `frontend/src/App.tsx`, `frontend/src/main.tsx`
- Create: `frontend/next.config.ts`, `frontend/next-env.d.ts`
- Remove (after successful migration): `frontend/vite.config.ts`, `frontend/index.html`

---

### Task 1: Prepare Migration Safety Baseline

**Files:**
- Modify: none (verification only)

- [ ] **Step 1: Capture current route behavior**

Run: `npm run dev` (Vite) and manually verify `/`, `/products`, `/solutions`, `/toolkits`, `/blog`, `/docs`, `/get-started`.

- [ ] **Step 2: Capture landing visual baseline**

Take screenshots of hero, navbar, and route pages for post-migration comparison.

- [ ] **Step 3: Record dependency baseline**

Run: `npm ls react react-dom @react-three/fiber react-router-dom`.

---

### Task 2: Swap Tooling from Vite to Next

**Files:**
- Modify: `frontend/package.json`
- Create: `frontend/next.config.ts`, `frontend/next-env.d.ts`

- [ ] **Step 1: Write failing runtime check**

Run: `npm run dev` and confirm current command still starts Vite.

- [ ] **Step 2: Update scripts and dependencies**

Change scripts:
- `dev` -> `next dev`
- `build` -> `next build`
- add `start` -> `next start`
- remove `preview`

Add `next` dependency, keep React 18 versions aligned.

- [ ] **Step 3: Add Next config files**

Create `next.config.ts` with minimal config and `next-env.d.ts`.

- [ ] **Step 4: Install and lock dependencies**

Run: `npm install`.

---

### Task 3: Create Next App Router Shell

**Files:**
- Create: `frontend/src/app/layout.tsx`
- Create: `frontend/src/app/page.tsx`
- Create: `frontend/src/app/[...slug]/page.tsx`
- Create: `frontend/src/app/globals.css`

- [ ] **Step 1: Add root layout**

Import existing CSS from `src/index.css` and keep body classes matching current visual system.

- [ ] **Step 2: Add root route page**

`src/app/page.tsx` should render the existing app shell via a client component.

- [ ] **Step 3: Add catch-all page**

`src/app/[...slug]/page.tsx` should render the same app shell so direct URLs still work.

---

### Task 4: Replace React Router with Next Path Routing Bridge

**Files:**
- Create: `frontend/src/next/RouteBridge.tsx`
- Modify: `frontend/src/App.tsx`

- [ ] **Step 1: Build route resolver bridge**

Create a mapping from pathname to page component:
- `/` -> `Index`
- `/products` -> `Products`
- `/solutions` -> `Solutions`
- `/toolkits` -> `Toolkits`
- `/blog` -> `Blog`
- `/docs` -> `Docs`
- `/get-started` -> `GetStarted`
- fallback -> `NotFound`

Use `usePathname()` from `next/navigation` in a client component.

- [ ] **Step 2: Remove BrowserRouter dependency from App shell**

Keep providers (`QueryClientProvider`, toasters, tooltips) and render `<RouteBridge />` in place of `<BrowserRouter><Routes/>...</BrowserRouter>`.

- [ ] **Step 3: Normalize TS imports**

Remove `.tsx` suffixes from imports in `src/App.tsx` and `src/main.tsx` to satisfy Next TS validation.

---

### Task 5: Handle Client-Only 3D/Shader Components Safely

**Files:**
- Modify: `frontend/src/components/rivtor/Hero.tsx`
- Modify: `frontend/src/components/rivtor/HeroShader.tsx` (if needed)

- [ ] **Step 1: Prevent SSR execution for three/fiber modules**

Wrap `HeroShader` import with dynamic no-SSR pattern where used:
- `dynamic(() => import("...").then(m => m.HeroShader), { ssr: false })`

- [ ] **Step 2: Verify hydration and runtime stability**

Confirm no `ReactCurrentOwner` error in dev server logs.

---

### Task 6: Update TypeScript and Remove Vite Entrypoint Dependency

**Files:**
- Modify: `frontend/tsconfig.json`
- Modify: `frontend/src/main.tsx`

- [ ] **Step 1: Update TS config for Next**

Ensure include list contains:
- `next-env.d.ts`
- `src/app/**/*`
- `src/**/*`
- `.next/types/**/*.ts`

- [ ] **Step 2: Keep `src/main.tsx` non-blocking**

Either:
- keep valid imports with no `.tsx` suffix, or
- remove from TS include if no longer needed.

---

### Task 7: Remove Vite-Only Files After Green Build

**Files:**
- Delete: `frontend/vite.config.ts`
- Delete: `frontend/index.html`
- Modify: `frontend/package.json` (remove Vite plugin deps if not used)

- [ ] **Step 1: Verify Next build before deletion**

Run: `npm run build` (must pass first).

- [ ] **Step 2: Remove Vite artifacts**

Delete Vite config and entry HTML once Next runtime is confirmed.

- [ ] **Step 3: Clean dependencies**

Optionally remove `vite`, `@vitejs/plugin-react-swc`, and unused Vite configs.

---

### Task 8: Final Verification and Regression Checklist

**Files:**
- Modify: none (verification only)

- [ ] **Step 1: Dev verification**

Run: `npm run dev`
Expected: Next server starts without runtime errors.

- [ ] **Step 2: Build verification**

Run: `npm run build`
Expected: successful build, no missing route manifest or TS import extension errors.

- [ ] **Step 3: Route verification**

Check HTTP 200 and UI parity for:
- `/`
- `/products`
- `/solutions`
- `/toolkits`
- `/blog`
- `/docs`
- `/get-started`

- [ ] **Step 4: Visual parity verification**

Compare captured screenshots to migrated output; no changes to landing visual philosophy.

---

## MVP Guardrails for This Rewrite

- Do not redesign UI during migration.
- Do not touch backend scope in this task.
- Do not introduce new feature work while migrating runtime.
- Keep changes incremental and commit after each task.
