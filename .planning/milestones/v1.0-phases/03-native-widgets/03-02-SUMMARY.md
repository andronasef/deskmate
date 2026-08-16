---
phase: 03-native-widgets
plan: 02
subsystem: ui
tags: [clock, pomodoro, intl, web-audio, countdown, autoplay-policy, timer]
requires:
  - phase: 03
    plan: 01
    provides: registry render contract + theme bridge
provides:
  - Desk Clock & Date widget (Intl.DateTimeFormat, ticking, showSeconds/hour12/fontSize)
  - Pomodoro widget (MM:SS countdown, Start/Pause/Reset, Web Audio chime, minutes 1-120)
  - Gesture-unlocked audio (autoplay policy) + zombie-timer-free lifecycle
affects: [phase 05 (kiosk clock display), phase 04 (sandbox clock example)]
requirements-completed: [WID-01, WID-02]

# Metrics
duration: 35min
completed: 2026-08-16
---

# Phase 3 Plan 02: Desk Clock + Pomodoro Summary

**The two self-contained native widgets (WID-01/WID-02): a typography-driven live clock and a focus timer with a large countdown and a Web Audio chime**

## Accomplishments
- `src/widgets/clock.tsx` — ticks via setInterval (1s with seconds, 60s without — cleaned up on unmount), `Intl.DateTimeFormat` for time (hour/minute/second, hour12) + locale date (weekday/month/day), fontSize small/medium/large → 28/40/56px, tabular-nums
- `src/widgets/pomodoro.tsx` — MM:SS countdown at 40px (accent while running, destructive at 0), Start (gesture) / Pause / Reset, minutes 1-120 clamped, "Time's up!" label, Web Audio two-tone chime (oscillator pair, no asset, AudioContext created inside the Start click handler → autoplay-unlocked), interval cleared on pause/reset/unmount (no zombie timers — STATE.md verify flag)
- Both registered in WIDGET_REGISTRY with settingsFields (clock: showSeconds/hour12/fontSize; pomodoro: minutes)
- Minutes-change reset uses the render-time derived-state pattern (no setState-in-effect)

## Files Created/Modified
- Created: src/widgets/{clock.tsx, clock.module.css, clock.test.tsx, pomodoro.tsx, pomodoro.module.css, pomodoro.test.tsx}
- Modified: src/widgets/index.tsx (registration)

## Decisions Made
- Chime synthesized (Web Audio) per STACK.md — no asset pipeline; silently skipped when AudioContext unavailable (test env)
- Timer state session-local (D-3.12) — reload resets; persisted timers deferred
- Clock date uses the runtime locale via Intl (no hardcoded strings per UI-SPEC)

## Tests
- clock.test.tsx (fake timers + act): time/date render, seconds toggle, ticking, fontSize style, unmount cleanup
- pomodoro.test.tsx: initial MM:SS, countdown advance, pause freeze, reset, chime at 0 (spy on oscillator), unmount cleanup, minutes clamp

## Next Phase Readiness
- Both widgets are showcase bodies the kiosk mode (Phase 5) displays full-screen
---
*Phase: 03-native-widgets*
*Completed: 2026-08-16*
