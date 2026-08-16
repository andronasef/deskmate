---
phase: 05-kiosk-polish
plan: 02
subsystem: kiosk
tags: [single-widget-view, status-footer, pwa, manifest, soak, diagnostics]
requires:
  - phase: 05
    plan: 01
    provides: wake-lock/fullscreen state (chips + panel)
provides:
  - SingleWidgetView (full-bleed widget + arrows + dots at ≤480px) (GRID-05)
  - StatusFooter + statusStore (failure / GitHub stale / wake-lock chips) (KIOSK-04)
  - PWA manifest + generated icons + theme-color (KIOSK-03)
  - SoakPanel diagnostics + documented 24h on-hardware soak procedure (D-5.15/5.16)
affects: [deploy checklist, future marketplace/notifications]
requirements-completed: [GRID-05, KIOSK-03, KIOSK-04]

# Metrics
duration: 40min
completed: 2026-08-16
---

# Phase 5 Plan 02: Kiosk Presentation + PWA + Soak Summary

**The presentation layer that completes the Core Value — a phone or idle monitor runs DeskMate fullscreen, stays awake, shows exactly the config, and communicates its health quietly**

## Accomplishments
- `src/kiosk/SingleWidgetView.tsx` — full-bleed widget body at ≤480px (matchMedia-driven, replaces the grid; wider → grid returns), arrow buttons + dots cycle/select widgets, session-local index, read-only (edit hidden)
- `src/kiosk/statusStore.ts` — immutable-snapshot aggregation store (widgetFailures, githubStale/RateLimited) with `useSyncExternalStore`; `__resetStatusStore` test helper
- `src/kiosk/StatusFooter.tsx` — slim footer chips: "N widget(s) failed to load" (destructive), "GitHub data stale" (destructive-tinted warning), "Screen awake" / "Screen awake unavailable" (from the store)
- Crash → footer wiring: IframeWidgetRenderer reports failure/recovered on crashed→ready transitions; GitHubPulse aggregates its per-repo stale/rateLimited into the footer
- `public/manifest.webmanifest` (standalone, theme/background #0A0D12, 192/512 icons) + generated PNG icons (accent disc on dark — dependency-free PNG encoder script) + index.html manifest link + theme-color (KIOSK-03)
- `src/kiosk/SoakPanel.tsx` + soak.ts — diagnostics (rAF-delta EMA fps, performance.memory heap, wake-lock, visibility), 1 s sampling, header gauge toggle
- `05-02-SOAK.md` — full on-hardware procedure: 24h run + hourly logging table, 6× CPU throttle, chime-on-fresh-profile (STATE.md flag), 2-widget rate-limit simulator (STATE.md flag), pass criteria + failure recording path

## Files Created/Modified
- Created: src/kiosk/{SingleWidgetView.tsx, StatusFooter.tsx, statusStore.ts, soak.ts, SoakPanel.tsx, kiosk.test.tsx, pwa.test.ts} + module.css files, public/manifest.webmanifest, public/icons/{icon-192,icon-512}.png, 05-02-SOAK.md
- Modified: src/app/App.tsx (narrow view + footer + diagnostics toggle), src/widgets/sandbox/IframeWidgetRenderer.tsx (failure reporting), src/widgets/githubPulse.tsx (GitHub aggregation), index.html, src/test/setup.ts (matchMedia/ResizeObserver polyfills)

## Decisions Made
- Single-widget view is purely responsive (no manual exit; resize returns to the grid) (D-5.08)
- statusStore uses immutable snapshots (useSyncExternalStore contract — found the in-place-mutation trap via test)
- Soak is a documented procedure + shipped instrumentation; the run itself is a human checklist (cannot execute on-device here) — the procedure records results back into 05-02-SOAK.md

## Tests
- kiosk.test.tsx: statusStore aggregation (failures/GitHub flags + reset); SingleWidgetView renders first widget, arrows cycle + wrap, empty → null; StatusFooter chips per state
- pwa.test.ts: manifest fields (standalone/colors/icons sizes), PNG magic bytes, index.html links
- App suite still green with the narrow-view + footer + matchMedia polyfill

## Next Phase Readiness
- Milestone complete — this phase closes v1.0. Post-deploy: run 05-02-SOAK.md on hardware, then the milestone audit/complete/cleanup flow.
---
*Phase: 05-kiosk-polish*
*Completed: 2026-08-16*
