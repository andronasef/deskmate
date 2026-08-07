# Requirements: DeskMate

**Defined:** 2026-08-07
**Core Value:** Turn any idle screen into a customizable, sandboxed smart dashboard — one unique URL, opened on any device, renders the exact configuration.

## v1 Requirements

### Grid & Layout (GRID)

- [ ] **GRID-01**: User can add widgets to their dashboard grid
- [ ] **GRID-02**: User can remove widgets from their dashboard grid
- [ ] **GRID-03**: User can resize widgets in the grid
- [ ] **GRID-04**: User can drag-and-drop widgets to rearrange their positions in the grid
- [ ] **GRID-05**: User can view a single full-screen widget on narrow/mobile screens
- [ ] **GRID-06**: Grid layouts reflow responsively across phone, tablet, and monitor breakpoints

### Config & Transports (CFG)

- [ ] **CFG-01**: User's dashboard configuration persists across browser reloads (localStorage)
- [ ] **CFG-02**: User can export their dashboard configuration as a downloadable JSON file
- [ ] **CFG-03**: User can import a JSON configuration file and load that dashboard
- [ ] **CFG-04**: User can open a unique display URL that renders the exact configuration on any device
- [ ] **CFG-05**: Corrupt, invalid, or version-mismatched configs fail gracefully with validation and recovery (never brick the dashboard)

### Native Widgets (WID)

- [ ] **WID-01**: User can use the Desk Clock & Date widget with customizable typography and theme colors
- [ ] **WID-02**: User can use the Pomodoro Focus Timer widget with a large readable countdown and audio chime
- [ ] **WID-03**: User can use the GitHub Pulse widget showing repo stars, open issues, and commit streaks via the public GitHub API
- [ ] **WID-04**: Live-data widgets auto-refresh and fail gracefully, rendering cached/stale data with a status indicator rather than a broken UI

### BYOW Extensibility (BYOW)

- [ ] **BYOW-01**: User can write a custom widget using HTML, CSS, and JavaScript in a built-in code editor
- [ ] **BYOW-02**: User can preview a custom widget live as they edit its code
- [ ] **BYOW-03**: Custom widgets render in a sandboxed iframe (`sandbox="allow-scripts"` only — never `allow-same-origin`) so they cannot access the host app
- [ ] **BYOW-04**: Custom widgets receive a DeskMate API object (theme colors, screen size, config) via a validated postMessage bridge (source-reference + per-widget nonce)
- [ ] **BYOW-05**: Custom widgets are torn down cleanly on removal/import — no zombie frames or timers

### Kiosk & Display (KIOSK)

- [ ] **KIOSK-01**: User can launch a dashboard fullscreen with the Screen Wake Lock API active
- [ ] **KIOSK-02**: Wake lock re-acquires on visibility change and degrades gracefully (feature-detect + fallback) on unsupported devices
- [ ] **KIOSK-03**: User can install DeskMate as a PWA (web manifest + icons)
- [ ] **KIOSK-04**: User sees status indicators for widget failures, GitHub rate-limit exhaustion, and stale data

## v2 Requirements

Deferred to a future release. Tracked but not in the current roadmap.

### Onboarding & Themes

- **FRST-01**: New users see a working first-run default dashboard (Clock + GitHub Pulse + Pomodoro) before configuring
- **THEM-01**: Global theme system pushes design tokens to all widgets (native + iframe) from one place

### Widgets

- **WTHR-01**: Weather widget via Open-Meteo (keyless, CORS-friendly) — closes the biggest table-stakes gap
- **CALD-01**: Calendar / ICS feed widget

### BYOW Extension

- **PROX-01**: `DeskMate.fetch` host-proxy with per-widget URL allow-list and request budgets so sandboxed widgets can call external APIs
- **MKT-01**: Public Widget Marketplace where users publish and install custom widgets

## Out of Scope

| Feature | Reason |
|---------|--------|
| User accounts / authentication | Static client-side app; config is device-local by design |
| Cloud sync / remote live sync (WebSockets) | Future roadmap; v1 is local-first with export/import |
| Chrome extension (new-tab replacement) | Roadmap item, not v1 |
| GitHub OAuth / personal tokens | v1 uses public API only; token support later if requested |
| Server-side API proxying | No backend by design; widgets use public/CORS-friendly APIs |
| Telemetry / analytics | Privacy-first; no tracking |
| Native mobile apps | Web is the product; PWA covers installability |
| Photo frame / ambient slideshow mode | Not in target scope |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| GRID-01 | _TBD_ | Pending |
| GRID-02 | _TBD_ | Pending |
| GRID-03 | _TBD_ | Pending |
| GRID-04 | _TBD_ | Pending |
| GRID-05 | _TBD_ | Pending |
| GRID-06 | _TBD_ | Pending |
| CFG-01 | _TBD_ | Pending |
| CFG-02 | _TBD_ | Pending |
| CFG-03 | _TBD_ | Pending |
| CFG-04 | _TBD_ | Pending |
| CFG-05 | _TBD_ | Pending |
| WID-01 | _TBD_ | Pending |
| WID-02 | _TBD_ | Pending |
| WID-03 | _TBD_ | Pending |
| WID-04 | _TBD_ | Pending |
| BYOW-01 | _TBD_ | Pending |
| BYOW-02 | _TBD_ | Pending |
| BYOW-03 | _TBD_ | Pending |
| BYOW-04 | _TBD_ | Pending |
| BYOW-05 | _TBD_ | Pending |
| KIOSK-01 | _TBD_ | Pending |
| KIOSK-02 | _TBD_ | Pending |
| KIOSK-03 | _TBD_ | Pending |
| KIOSK-04 | _TBD_ | Pending |

**Coverage:**
- v1 requirements: 24 total
- Mapped to phases: 0
- Unmapped: 24 ⚠️ (populated during roadmap creation)

---
*Requirements defined: 2026-08-07*
*Last updated: 2026-08-07 after initial definition*
