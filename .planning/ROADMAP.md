# Roadmap: DeskMate

## Overview

DeskMate turns idle screens into customizable smart dashboards. The roadmap builds the product as a single validated `DashboardConfig` pipeline: schema-first (Phase 1), then the Core Value — grid editing, persistence, and the three transports (localStorage / JSON export-import / unique display URL) — delivered end-to-end before any security-critical work (Phase 2). Native widgets prove the widget registry contract (Phase 3), the sandboxed BYOW ecosystem extends it as a second renderer of the same `WidgetInstance` (Phase 4), and the always-on kiosk promise completes last because it can only be verified on real hardware with the finished app (Phase 5).

## Phases

**Phase Numbering:**

- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Scaffold & Config Core** - Vite/React/TS scaffold plus the single validated `DashboardConfig` schema, store, and versioned storage adapter — the contract every later phase reuses (completed 2026-08-16)
- [x] **Phase 2: Grid, Persistence & Config Transports** - Drag-and-drop grid, localStorage persistence, JSON export/import, and unique display URLs — the Core Value end-to-end (completed 2026-08-16)
- [x] **Phase 3: Native Widgets** - Desk Clock & Date, Pomodoro Focus Timer, GitHub Pulse, plus the theme system and graceful live-data failure (completed 2026-08-16)
- [ ] **Phase 4: Sandbox & BYOW** - Sandboxed iframe renderer, validated postMessage bridge, and the in-browser custom widget editor — the open ecosystem
- [ ] **Phase 5: Kiosk & Polish** - Fullscreen + wake lock, single-widget mobile view, status indicators, PWA installability, and on-hardware soak

## Phase Details

### Phase 1: Scaffold & Config Core

**Goal**: Users have a static app that boots from a single validated `DashboardConfig` contract and never breaks on bad stored data — the foundation for "one schema, three transports".
**Mode:** mvp
**Depends on**: Nothing (first phase)
**Requirements**: CFG-05
**Success Criteria** (what must be TRUE):

  1. User opens the app URL and it boots into a working default dashboard shell from a static host — no server required
  2. When the browser's stored config is corrupt, invalid, or from a mismatched version, the app recovers to a safe working dashboard instead of a blank or broken screen — it never bricks
  3. Recovery preserves the raw bad data (backup) so the user's config is never silently destroyed, and the app always loads through one validated path

**Plans**: 2 plans

Plans:

- [x] 01-01: Vite 8 + React 19 + TypeScript 6.0.3 scaffold (override default TS 7), lint/type toolchain, static app shell that boots and renders a default dashboard shell
- [x] 01-02: Config core — zod `DashboardConfig` schema, `defaultConfig.ts`, zustand store, versioned storage adapter with validate-on-load + recovery/backup (CFG-05)

### Phase 2: Grid, Persistence & Config Transports

**Goal**: Users can edit a responsive multi-widget grid and move their exact configuration across reloads, files, and devices via one validated config — the Core Value working end-to-end.
**Mode:** mvp
**Depends on**: Phase 1
**Requirements**: GRID-01, GRID-02, GRID-03, GRID-04, GRID-06, CFG-01, CFG-02, CFG-03, CFG-04
**Success Criteria** (what must be TRUE):

  1. User can add, remove, resize, and drag-and-drop widgets on a multi-widget grid that reflows responsively across phone, tablet, and monitor breakpoints
  2. User's grid layout and widget configs persist across browser reloads
  3. User can export the dashboard configuration as a downloadable JSON file and import a JSON file back to load that exact dashboard
  4. User can open a unique display URL (query-param encoded config) on any device and see the exact configuration render
  5. Imported or URL-loaded layouts are sanitized (duplicate keys, invalid sizes rejected) so a bad layout never breaks the grid

**Plans**: 3 plans

Plans:

- [x] 02-01: DashboardGrid + WidgetFrame (react-grid-layout v2, `mounted`-gated width, add/remove/resize/drag with atomic store actions, responsive breakpoints, first-run default config render)
- [x] 02-02: Persistence + transports — debounced localStorage, JSON export/import, URL codec (lz-string + hard size cap + export fallback), migration/backup hardening, layout sanitization
- [x] 02-03: Research probe — deploy-host request-line limit probe page to empirically verify the URL size cap (CDNs/proxies may be stricter than nginx 8 KB)

### Phase 3: Native Widgets

**Goal**: Users get the table-stakes widget set — Clock, Pomodoro, and GitHub Pulse — rendered through a single widget registry/renderer contract with themes and failure-tolerant live data.
**Mode:** mvp
**Depends on**: Phase 2
**Requirements**: WID-01, WID-02, WID-03, WID-04
**Success Criteria** (what must be TRUE):

  1. User can use the Desk Clock & Date widget with customizable typography and theme colors
  2. User can run the Pomodoro Focus Timer with a large readable countdown and an audio chime that plays (unlocked on first user gesture)
  3. User can view GitHub repo stars, open issues, and commit streaks via the public GitHub API
  4. When the network fails or the GitHub rate limit is exhausted, live-data widgets keep showing cached/stale data with a status indicator instead of a broken UI, and auto-refresh without lockout

**Plans**: 3 plans

Plans:

- [x] 03-01: Widget registry/renderer contract + theme system (tokens → CSS variables → native widget props)
- [x] 03-02: Desk Clock & Date (typography/themes) + Pomodoro Focus Timer (large countdown, audio chime unlocked on first gesture)
- [x] 03-03: GitHub Pulse (ETag/If-None-Match cache, rate-limit header parsing, ≥3 min adaptive backoff, shared deduping client, stale-data rendering)

### Phase 4: Sandbox & BYOW

**Goal**: Users can write, preview, and run their own HTML/CSS/JS widgets safely — the sandboxed-iframe security contract makes untrusted code impossible to escape, and teardown leaves no zombies.
**Mode:** mvp
**Depends on**: Phase 3
**Requirements**: BYOW-01, BYOW-02, BYOW-03, BYOW-04, BYOW-05
**Success Criteria** (what must be TRUE):

  1. User can write a custom widget with HTML, CSS, and JavaScript in a built-in code editor and see a live preview as they edit
  2. Custom widgets render in a sandboxed iframe (`sandbox="allow-scripts"` only — never `allow-same-origin`) and cannot access the host app, break it, or escape the sandbox
  3. Custom widgets receive a DeskMate API object (theme colors, screen size, config) via a postMessage bridge validated by exact source reference + per-widget nonce — spoofed messages are ignored
  4. Removing a widget or importing a config tears custom widgets down cleanly — no zombie iframes, timers, or duplicate frames
  5. The dashboard stays responsive with many custom widgets (per-device-class iframe budgets + lazy mounting)

**Plans**: 3 plans

Plans:

- [ ] 04-01: Research spike — multi-browser postMessage + srcdoc behavior (opaque origins, nonce handshake, `targetOrigin "*"` semantics across Chrome/Safari/Firefox) before implementing the bridge
- [ ] 04-02: Sandbox contract + bridge + bootstrap + IframeWidgetRenderer (`allow-scripts` constant + exact-attribute unit test, srcdoc escaping, hostile escape-attempt test widget) + widget lifecycle (ready handshake with timeout, crash fallback, explicit teardown)
- [ ] 04-03: BYOW editor (CodeMirror, live preview) + iframe performance budgets (≤8 mobile / ≤20 desktop) + lazy mounting

### Phase 5: Kiosk & Polish

**Goal**: Users can run DeskMate as an always-on kiosk display — fullscreen with wake lock, single-widget mobile mode, clear status indicators, and installable as a PWA — verified by an on-hardware soak.
**Mode:** mvp
**Depends on**: Phase 4
**Requirements**: GRID-05, KIOSK-01, KIOSK-02, KIOSK-03, KIOSK-04
**Success Criteria** (what must be TRUE):

  1. User can view a single full-screen widget on narrow/mobile screens
  2. User can launch the dashboard fullscreen with the Screen Wake Lock API active and it stays awake
  3. When the tab is hidden or the device lacks wake-lock support (e.g., iOS < 16.4), wake lock re-acquires on visibility change and the app degrades gracefully — never crashes or silently dies
  4. User can install DeskMate as a PWA (web manifest + icons) and launch it fullscreen from the installed app
  5. User sees status indicators for widget failures, GitHub rate-limit exhaustion, and stale data, and the dashboard stays stable over a 24 h kiosk run

**Plans**: 2 plans

Plans:

- [ ] 05-01: Research spike — wake-lock behavior on target device classes (iOS < 16.4 fallback copy, Low Power Mode rejection, HTTPS-only serving note) + FullscreenService + WakeLockService (feature-detect, visibilitychange re-acquire, sentinel release handling)
- [ ] 05-02: Single-widget mobile fullscreen view + widget status indicators + PWA manifest/icons + on-hardware soak (24 h run, frame-time logging, memory sampling, 6× CPU throttle check)

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Scaffold & Config Core | 2/2 | Complete    | 2026-08-16 |
| 2. Grid, Persistence & Transports | 3/3 | Complete    | 2026-08-16 |
| 3. Native Widgets | 3/3 | Complete    | 2026-08-16 |
| 4. Sandbox & BYOW | 0/3 | Not started | - |
| 5. Kiosk & Polish | 0/2 | Not started | - |

*Plan counts are initial estimates (granularity: coarse, 1-3 plans per phase); refined during plan-phase.*
