---
phase: 01
slug: scaffold-config-core
status: validated
nyquist_compliant: true
wave_0_complete: true
created: 2026-08-16
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.1.10 + @testing-library/react + jest-dom |
| **Config file** | vite.config.ts (test block: jsdom, globals, setupFiles, passWithNoTests) |
| **Quick run command** | `npm test` (vitest run) |
| **Full suite command** | `npm test` + `npm run typecheck` + `npm run lint` |
| **Estimated runtime** | ~3 seconds (5 files / 21 tests) |

---

## Sampling Rate

- **After every task commit:** Run `npm test`
- **After every plan wave:** Run `npm test` + `npm run typecheck`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** ~5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 01-01-01 | 01 | 1 | CFG-05 | — | N/A (dependency gate) | human | package gate (blocking-human) | ✅ | ✅ green |
| 01-01-02 | 01 | 1 | CFG-05 | — | N/A (scaffold) | build | `npm run build` + `typecheck` + `lint` | ✅ | ✅ green |
| 01-01-03 | 01 | 1 | CFG-05 | — | N/A (shell render) | unit | `npm test` (App.test.tsx) | ✅ | ✅ green |
| 01-02-01 | 02 | 2 | CFG-05 | T-01-11 | Unknown-key STRIP — `__proto__`/`constructor` own keys never survive parse (prototype-pollution defense) | unit | `npm test` (schemas.test.ts) | ✅ | ✅ green |
| 01-02-02 | 02 | 2 | CFG-05 | T-01-06 | Corrupt/future-version configs recover to defaults with raw backup preserved before overwrite; all localStorage access try/catch guarded | unit | `npm test` (storage.test.ts) | ✅ | ✅ green |
| 01-02-03 | 02 | 2 | CFG-05 | T-01-11 | Boot path: persist rehydration validates before commit; never spreads unvalidated data; recovery integration via true reload simulation | integration | `npm test` (recovery.test.ts) | ✅ | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] `vite.config.ts` — vitest jsdom harness (installed plan 01-01)
- [x] `src/test/setup.ts` — jest-dom matchers
- [x] Colocated `*.test.ts(x)` files across src/config and src/app

*Existing infrastructure covers all phase requirements.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Visual shell renders as designed (dark theme, wordmark, placeholder card) | CFG-05 | Aesthetic fidelity requires human eyes | `npm run dev`, open URL, confirm dark dashboard shell per 01-UI-SPEC.md |
| Dev-server smoke (HTTP 200, #root mount) | CFG-05 | Requires running server | `npm run dev` → curl localhost:5173 → 200 + `<title>DeskMate</title>` |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 5s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-08-16 (reconstructed from artifacts — State B; all 21 tests green, 0 gaps found)
