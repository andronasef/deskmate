---
phase: 05-kiosk-polish
plan: 01
subsystem: kiosk
tags: [wake-lock, fullscreen, visibilitychange, sentinel, store-slice]
requires:
  - phase: 04
    provides: registry + sandbox (custom widgets run in kiosk)
provides:
  - WakeLockService (feature-detect, sentinel, visibilitychange re-acquire, graceful fallback)
  - FullscreenService (webkit prefix) + kiosk slice on the zustand store
  - Header Fullscreen toggle coupling fullscreen + wake lock; exit releases both
  - Device-class spike findings (iOS < 16.4, Low Power Mode, HTTPS-only)
affects: [phase 05 plan 02 (footer chips read wake-lock state), deploy checklist]
requirements-completed: [KIOSK-01, KIOSK-02]

# Metrics
duration: 30min
completed: 2026-08-16
---

# Phase 5 Plan 01: Wake Lock + Fullscreen Services Summary

**The always-on display promise (KIOSK-01/02): keep the screen on where supported, degrade calmly where not — with the device-class spike recorded**

## Accomplishments
- `src/kiosk/wakeLock.ts` — `WakeLockState` machine (inactive/active/unsupported/error); `requestWakeLock` (feature-detect → `navigator.wakeLock.request('screen')` → sentinel; rejection → 'error' — Low Power Mode/battery saver); `releaseWakeLock`; sentinel auto-release detection (`.released` promise → 'inactive'); `initWakeLockGlobalHandler` — ONE global visibilitychange listener that re-acquires on visible when the app is in kiosk intent (latest intent getter supersedes earlier installs)
- `src/kiosk/fullscreen.ts` — request/exit with webkit prefix fallback; `subscribeFullscreenState` (fullscreenchange + webkitfullscreenchange)
- Store kiosk slice — `wakeLock`/`fullscreen` fields + setters on the zustand store (NOT persisted; partialize unchanged) (D-5.02)
- `src/kiosk/useKiosk.ts` — toggle wires fullscreen + wake lock together; `fullscreenchange→false` releases wake lock (symmetry D-5.04); service→store subscriptions
- App header: Fullscreen toggle (Maximize icon, active state) + wake-lock chips ("Screen awake" / "Screen awake unavailable" per UI-SPEC) (D-5.03)
- `05-01-FINDINGS.md` — device-class spike: engine support table (Safari 16.4+, Chrome 84+, Firefox partial), secure-context requirement, Low Power Mode NotAllowedError, auto-release on hide, re-acquire rule, test stubbing strategy → STATE.md Phase 5 flag RESOLVED (behavior; on-device verification folds into the 05-02 soak)

## Files Created/Modified
- Created: src/kiosk/{wakeLock.ts, fullscreen.ts, useKiosk.ts, wakeLock.test.ts}
- Modified: src/config/store.ts (kiosk slice), src/app/App.tsx + App.module.css (toggle + chips)

## Decisions Made
- Wake-lock state in the store (STACK.md pattern) so Dashboard + kiosk views share the sentinel; single global handler
- Fullscreen/wake-lock coupling with exit-symmetry (D-5.04); chips only show meaningful states (active / unavailable — nothing when idle)

## Tests
- wakeLock.test.ts (6): unsupported → 'unsupported'; request → 'active' + sentinel; release → 'inactive' + sentinel.release; rejection → 'error' (no crash); visibilitychange→visible re-acquires exactly once (single handler, latest intent); no re-acquire when kiosk intent off

## Next Phase Readiness
- 05-02's StatusFooter + SoakPanel read the store's wake-lock state and the fullscreen flag
---
*Phase: 05-kiosk-polish*
*Completed: 2026-08-16*
