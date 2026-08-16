---
phase: 05
slug: kiosk-polish
status: validated
nyquist_compliant: true
wave_0_complete: true
created: 2026-08-16
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.1.10 + @testing-library/react + jest-dom |
| **Config file** | vite.config.ts (jsdom) |
| **Quick run command** | `npm test` |
| **Full suite command** | `npm test` + `npm run typecheck` + `npm run lint` |
| **Estimated runtime** | ~10 seconds (20 files / 118 tests) |

---

## Sampling Rate

- **After every task commit:** Run `npm test`
- **After every plan wave:** Run `npm test` + `npm run typecheck`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** ~10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 05-01-01 | 01 | 1 | KIOSK-01/02 | T-05-01/02 | Spike records device-class behavior + fallback decisions | research | spike docs (reviewed) | ✅ | ✅ |
| 05-01-02 | 01 | 1 | KIOSK-01/02 | T-05-01/02 | WakeLockService: no retry loops; sentinel guard; re-acquire once | unit | `npm test` (wakeLock.test) | ✅ | ✅ green |
| 05-01-03 | 01 | 1 | KIOSK-01/02 | — | Fullscreen toggle coupling + exit symmetry | component | App tests + useKiosk | ✅ | ✅ green |
| 05-02-01 | 02 | 2 | GRID-05 | — | Single-widget view cycle/wrap/empty | component | `npm test` (kiosk.test) | ✅ | ✅ green |
| 05-02-02 | 02 | 2 | KIOSK-04 | — | Status chips per state (failures/stale/wake-lock) | component | `npm test` (kiosk.test) | ✅ | ✅ green |
| 05-02-03 | 02 | 2 | KIOSK-03 | — | PWA manifest + icons valid | unit | `npm test` (pwa.test) | ✅ | ✅ green |
| 05-02-04 | 02 | 2 | KIOSK-04 (soak) | — | Soak procedure documented + instrumentation shipped | manual/scripted | 05-02-SOAK.md + SoakPanel | ✅ | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] vitest harness (inherited)
- [x] matchMedia + ResizeObserver polyfills in src/test/setup.ts

*Existing infrastructure covers all phase requirements.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| 24 h on-hardware soak | KIOSK-04 (stability) | Requires real device + real time | 05-02-SOAK.md §1 — 24h run with hourly diagnostics logging |
| 6× CPU throttle run | KIOSK-04 | Requires DevTools/devices | 05-02-SOAK.md §2 |
| Chime on fresh profile | WID-02 (Phase 3 flag) | Autoplay policy is profile-dependent | 05-02-SOAK.md §3 |
| 2-widget rate-limit simulator | WID-04 (Phase 3 flag) | Requires live API budget | 05-02-SOAK.md §4 |
| Wake-lock on real iOS/Android | KIOSK-01/02 | Device class specific | 05-02-SOAK.md §1.5 |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 10s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-08-16 (reconstructed from artifacts — State B; 118 tests green, 0 gaps found; manual items are documented soak checks)
