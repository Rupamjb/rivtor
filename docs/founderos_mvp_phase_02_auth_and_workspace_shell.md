# Phase 02 — Auth + Workspace Shell

## Goal

Deliver sign-up/login/logout, route protection, and the 3-panel founder workspace layout.

## In Scope (MVP)

- Supabase Auth integration in frontend.
- Backend JWT verification middleware.
- Protected routes for dashboard/workspace.
- Layout shell:
  - left nav (Dashboard, Company Brain, Agents, Outputs, Activity, Settings)
  - center AI workspace
  - right context panel

## Tasks

### Frontend
- Create `/auth/login` and `/auth/signup` pages.
- Implement auth state guard for app routes.
- Build workspace shell components with responsive behavior.
- Reuse landing page design philosophy (fonts, color system, hairline panels, status motion).

### Backend
- Add auth middleware for protected endpoints.
- Add lightweight auth endpoints from PRD contract (`/auth/*`) where required for API symmetry.

## Exit Criteria

- User can sign up, login, logout.
- Unauthorized users cannot access protected dashboard routes.
- Workspace shell renders correctly on desktop and mobile.
