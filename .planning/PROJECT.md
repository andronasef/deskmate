# DeskMate

> **Slogan:** Your Smart Desk Companion
> **Tagline:** Turn any idle screen into a fully customizable, extensible smart dashboard.

## What This Is

DeskMate is a web application that brings secondary or unused devices back to life — old smartphones, large monitors, and laptops — turning them into customizable smart displays. It adapts from a single full-screen widget on a phone to a multi-widget grid on a large monitor, and includes an open developer ecosystem where anyone can write and inject their own HTML/CSS/JS widgets. It is a React + Vite frontend that runs fully client-side, persisting layouts and widget configs in localStorage with export/import for portability.

## Core Value

Turn any idle screen into a customizable, sandboxed smart dashboard — one unique URL, opened on any device, renders the exact configuration. If everything else fails, this must work.

## Requirements

### Validated

- (None yet — ship to validate)

### Active

- [ ] User can add, remove, and resize widgets on a multi-widget grid (desktop/large screens)
- [ ] User can view a single full-screen widget on small/mobile screens
- [ ] User can drag-and-drop to arrange widgets in the grid layout
- [ ] User can persist their grid layout and widget configs in localStorage
- [ ] User can export their configuration as JSON and import it back (to move between devices)
- [ ] User can launch a dashboard fullscreen and activate the Screen Wake Lock API
- [ ] User can open a unique display URL (query-param encoded config) on any device to load the exact configuration
- [ ] User can use the native Desk Clock & Date widget with customizable typography and themes
- [ ] User can use the native Pomodoro Focus Timer widget (large countdown, audio chime)
- [ ] User can use the native GitHub Pulse widget via the public GitHub API (stars, issues, commit streaks)
- [ ] User can write a custom widget using HTML/CSS/JS in a built-in code editor
- [ ] Custom widgets are rendered in a sandboxed iframe so they cannot break the app or run unsafe code

### Out of Scope

- **Widget Marketplace / community hub** — Deferred to a future phase; v1 ships the BYOW editor + sandboxed rendering, marketplace comes later (confirmed during questioning)
- **Cloud sync (WebSockets / remote live sync)** — Future roadmap item; v1 is local-first with manual export/import
- **Chrome extension (new-tab replacement)** — Roadmap item, not in v1
- **GitHub OAuth / personal tokens** — v1 uses the public GitHub API only (rate-limited ~60 req/hr) to avoid auth complexity; token support could come later
- **Authentication / accounts** — No user accounts; config is device-local

## Context

- DeskMate is a **static, client-side web app** — no server. This keeps deployment trivial (any static host) and matches the "open a URL on a target device" model.
- **Stack decisions (from planning):** React + Vite frontend; React Grid Layout or CSS Grid for the multi-widget grid; sandboxed iframes (not Shadow DOM) for custom widget isolation; localStorage for persistence.
- **Native widget set (v1):** Desk Clock & Date, Pomodoro Focus Timer, GitHub Pulse. User indicated "most basic first and I will add more soon" — the architecture must make adding new native widgets trivial.
- **BYOW (Bring Your Own Widget)** is the key differentiator — a real open ecosystem. Custom widgets get a defined DeskMate API object (theme colors, screen size).
- Target audiences: developers/makers (GitHub stats, custom widgets), productivity users (Pomodoro, calendars), setup/aesthetic fans (minimal clocks, weather, typography).
- The GitHub Pulse widget relies on the public GitHub REST API unauthenticated, so designs must tolerate rate-limit errors and slow refresh.

## Constraints

- **Tech stack**: React + Vite frontend — locked during planning.
- **Persistence**: localStorage only for v1 — agreed; export/import JSON for portability. No backend.
- **Security**: Custom widgets must be isolated via sandboxed iframes to prevent XSS and CSS bleed — hard requirement.
- **Compatibility**: Must run on iOS, Android, and desktop browsers; must support the Web Screen Wake Lock API where available (graceful fallback elsewhere).
- **Offline/resilience**: As a static app with public API calls, network failures must fail gracefully (cached/sample data).

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| React + Vite frontend | Component ecosystem; react-grid-layout fits natively; better for large grid dashboards | — Pending |
| localStorage + export/import for persistence | Zero backend; fastest path to MVP; manual portability between devices | — Pending |
| Sandboxed iframe for custom widgets (not Shadow DOM) | Strong isolation, safest for untrusted community widgets | — Pending |
| Widget Marketplace deferred to future phase | MVP ships BYOW editor + sandboxed rendering | — Pending |
| GitHub Pulse uses public API only (no tokens) | Avoid auth complexity; tolerate rate limits | — Pending |
| Unique display URLs via query-param configs | No backend needed; any device loads exact config from one URL | — Pending |
| Minimal-but-extensible native widget set | Ship most basic first, add more soon | — Pending |

---

*Last updated: 2026-08-07 after initialization*

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state