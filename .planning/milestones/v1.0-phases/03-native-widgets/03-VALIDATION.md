---
phase: 03
slug: native-widgets
status: validated
nyquist_compliant: true
wave_0_complete: true
created: 2026-08-16
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.1.10 + @testing-library/react + jest-dom |
| **Config file** | vite.config.ts (jsdom) |
| **Quick run command** | `npm test` |
| **Full suite command** | `npm test` + `npm run typecheck` + `npm run lint` |
| **Estimated runtime** | ~8 seconds (13 files / 74 tests) |

---

## Sampling Rate

- **After every task commit:** Run `npm test`
- **After every plan wave:** Run `npm test` + `npm run typecheck`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** ~8 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 1 | WID-01…04 | T-03-10 | Registry contract: render dispatch + unknown-type fallback; theme bridge (no unvalidated accent injection) | unit | `npm test` (registry.test.tsx) | ✅ | ✅ green |
| 03-01-02 | 01 | 1 | WID-01…04 | — | SettingsPopover: validated field writes via updateWidget | component | `npm test` (App.test.tsx) | ✅ | ✅ green |
| 03-02-01 | 02 | 2 | WID-01 | — | Clock: ticking lifecycle cleaned on unmount (no leaked intervals) | unit | `npm test` (clock.test.tsx) | ✅ | ✅ green |
| 03-02-02 | 02 | 2 | WID-02 | T-03-12 | Pomodoro: zombie-free timers; gesture-unlocked chime | unit | `npm test` (pomodoro.test.tsx) | ✅ | ✅ green |
| 03-03-01 | 03 | 3 | WID-03/04 | T-03-13 | GitHub client: never throws; stale/rate-limited data served; backoff ≥3 min | unit | `npm test` (githubPulse.test.tsx) | ✅ | ✅ green |
| 03-03-02 | 03 | 3 | WID-03/04 | T-03-13 | Widget: status footer per state; per-metric graceful failure | component | `npm test` (githubPulse.test.tsx) | ✅ | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] vitest + Testing Library harness (inherited)
- [x] MockAudioContext stub for chime tests (jsdom has no Web Audio)

*Existing infrastructure covers all phase requirements.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Audio chime on a fresh profile (autoplay policy) | WID-02 | Autoplay policy is browser/profile-dependent — cannot be exercised in jsdom | STATE.md flag: open a fresh browser profile, start Pomodoro, verify chime at 0:00 after the first user gesture |
| Rate-limit behavior with a 2-widget budget simulator | WID-04 | Requires two live widgets sharing the 60 req/hr unauth budget | STATE.md flag: add 2 GitHub widgets pointing at different repos; verify shared fetch budget + backoff indicators |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 8s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-08-16 (reconstructed from artifacts — State B; 74 tests green, 0 gaps found)
