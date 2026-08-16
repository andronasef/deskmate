---
phase: 02
slug: grid-persistence-transports
status: validated
nyquist_compliant: true
wave_0_complete: true
created: 2026-08-16
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.1.10 + @testing-library/react + jest-dom |
| **Config file** | vite.config.ts (test block: jsdom, globals, setupFiles) |
| **Quick run command** | `npm test` (vitest run) |
| **Full suite command** | `npm test` + `npm run typecheck` + `npm run lint` |
| **Estimated runtime** | ~5 seconds (9 files / 46 tests) |

---

## Sampling Rate

- **After every task commit:** Run `npm test`
- **After every plan wave:** Run `npm test` + `npm run typecheck`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** ~6 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | GRID-01…04, GRID-06 | T-02-11 | addWidget/removeWidget/setLayout/updateWidget validate-before-commit; never corrupt store state | unit | `npm test` (store.test.ts, defaultConfig.test.ts) | ✅ | ✅ green |
| 02-01-02 | 01 | 1 | GRID-01…04, GRID-06 | — | Edit-mode gating (drag/resize/chrome only in edit mode) | component | `npm test` (App.test.tsx) | ✅ | ✅ green |
| 02-02-01 | 02 | 2 | CFG-05 (success crit 5) | T-02-11 | sanitizeLayout dedupe/clamp/drop — bad layouts never reach the grid | unit | `npm test` (sanitize.test.ts) | ✅ | ✅ green |
| 02-02-02 | 02 | 2 | CFG-01/02/03 | T-02-10 | export/import transports; backup-before-replace; invalid input never mutates state | unit | `npm test` (transports.test.ts) | ✅ | ✅ green |
| 02-02-03 | 02 | 2 | CFG-04 | T-02-12 | URL codec: sanitize-on-decode, cap rejection, garbage→null (never a blank screen) | unit | `npm test` (urlCodec.test.ts) | ✅ | ✅ green |
| 02-03-01 | 03 | 3 | CFG-04 | — | Probe page + recorded findings (empirical evidence for the cap) | manual/scripted | probe run (curl table) | ✅ | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] vitest harness (inherited from Phase 1)
- [x] jsdom File.text polyfill in transports.test.ts (jsdom limitation)

*Existing infrastructure covers all phase requirements.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Live drag/resize feel (RGL gestures) | GRID-03/04 | jsdom cannot simulate real pointer drags through RGL's DOM event pipeline | `npm run dev` → Edit → drag a widget, resize via corner handle, reload → layout persists |
| URL request-line boundary on the real deploy host | CFG-04 | Requires the deployed host | Open `/probe-url-limit.html` on the deployed URL; record first failing length in 02-03-FINDINGS.md |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 6s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-08-16 (reconstructed from artifacts — State B; 46 tests green, 0 gaps found)
