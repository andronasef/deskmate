# Roadmap: DeskMate

## Overview

DeskMate turns idle screens into customizable smart dashboards. v1.0 (shipped 2026-08-16) delivered the complete Core Value: a single validated `DashboardConfig` pipeline (schema-first contract), the responsive multi-widget grid with three persistence transports (localStorage / JSON export-import / unique display URL), native widgets (Clock, Pomodoro, GitHub Pulse), a sandboxed BYOW ecosystem (srcdoc iframes + validated postMessage bridge), and the always-on kiosk layer (wake lock, fullscreen, single-widget mobile mode, status indicators, PWA).

## Completed Milestones

### Milestone v1.0 — SHIPPED 2026-08-16 (Phases 1-5)

- [x] **Phase 1: Scaffold & Config Core** — Vite/React/TS scaffold + validated `DashboardConfig` schema, store, versioned storage adapter
- [x] **Phase 2: Grid, Persistence & Config Transports** — Drag-and-drop grid, localStorage, JSON export/import, unique display URLs
- [x] **Phase 3: Native Widgets** — Desk Clock & Date, Pomodoro, GitHub Pulse, theme system, graceful live-data failure
- [x] **Phase 4: Sandbox & BYOW** — Sandboxed iframe renderer, validated postMessage bridge, in-browser widget editor
- [x] **Phase 5: Kiosk & Polish** — Fullscreen + wake lock, single-widget mobile view, status indicators, PWA, on-hardware soak procedure

**Archived detail:** `.planning/milestones/v1.0-ROADMAP.md` (full phase goals, plans, decisions, issues, tech debt)
**Archived requirements:** `.planning/milestones/v1.0-REQUIREMENTS.md` (24/24 satisfied)

## Backlog

No backlog items yet. Future directions (from audit tech debt + deferred items):

- PWA/offline service worker (deferred from v1 scope)
- Widget marketplace (registry is data-driven and marketplace-ready)
- Desktop/mobile notifications, additional native widgets (weather, calendar)
- `@tanstack/react-query` upgrade path for the GitHub data layer when the widget count grows
- Post-deploy verification: 24h on-hardware soak (05-02-SOAK.md), deploy-host URL probe

## Phase Details

See the milestone archive for shipped phases: `.planning/milestones/v1.0-ROADMAP.md`.

## Progress

- Milestone v1.0: **SHIPPED** (5/5 phases, 24/24 requirements)
- Next milestone: **not yet started** — plan via `/gsd-new-milestone` when the backlog is prioritized.
