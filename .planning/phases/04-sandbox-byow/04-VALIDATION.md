---
phase: 04
slug: sandbox-byow
status: validated
nyquist_compliant: true
wave_0_complete: true
created: 2026-08-16
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.1.10 + @testing-library/react + jest-dom |
| **Config file** | vite.config.ts (jsdom) |
| **Quick run command** | `npm test` |
| **Full suite command** | `npm test` + `npm run typecheck` + `npm run lint` |
| **Estimated runtime** | ~8 seconds (18 files / 104 tests) |

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
| 04-01-01 | 01 | 1 | BYOW-03/04 | T-04-01…04 | Spike verifies sandbox semantics (escaping, opaque origin, validation order) | research | spike docs (reviewed) | ✅ | ✅ |
| 04-02-01 | 02 | 2 | BYOW-03 | T-04-01/02 | Exact sandbox tokens + escaped bootstrap — hostile input cannot break out | unit | `npm test` (constants/bootstrap.test) | ✅ | ✅ green |
| 04-02-02 | 02 | 2 | BYOW-04 | T-04-03 | Source+nonce validation — spoofed messages ignored | unit | `npm test` (bridge.test) | ✅ | ✅ green |
| 04-02-03 | 02 | 2 | BYOW-05 | T-04-05 | Lifecycle: timeout → crash fallback; teardown no zombies | unit | `npm test` (lifecycle.test) | ✅ | ✅ green |
| 04-03-01 | 03 | 3 | BYOW-01/02 | T-04-06 | Editor tabs + debounced preview + Save/Cancel guard | component | `npm test` (byow.test) | ✅ | ✅ green |
| 04-03-02 | 03 | 3 | BYOW-05 | T-04-05 | Budgets + lazy mounting | unit | `npm test` (byow.test) | ✅ | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] vitest + Testing Library harness (inherited)
- [x] CodeMirror driving via EditorView.findFromDOM + dispatch (only supported way to fire onChange in jsdom)

*Existing infrastructure covers all phase requirements.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Cross-browser srcdoc/sandbox behavior on real devices (Chrome/Safari/Firefox) | BYOW-03/04 | jsdom + spec evidence ≠ live engines | Phase 5 soak: open the app on each engine, add a custom widget, verify it renders sandboxed and cannot reach window.parent |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 8s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-08-16 (reconstructed from artifacts — State B; 104 tests green, 0 gaps found)
