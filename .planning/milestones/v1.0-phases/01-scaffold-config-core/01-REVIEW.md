---
phase: 01-scaffold-config-core
reviewed: 2026-08-16T03:40:00Z
status: clean
depth: standard
files_reviewed: 15
critical: 0
warning: 0
info: 2
total: 2
---

# Phase 1 Code Review: Scaffold & Config Core

**Depth:** standard (inline review — subagent layer unavailable, orchestrator-performed)
**Files reviewed:** 15 (all phase-1 source files: src/config/*, src/app/*, src/main.tsx, src/index.css, src/test/setup.ts, vite.config.ts, eslint.config.js, tsconfig files)

## Findings

### Critical (0)

None.

### Warning (0)

None.

### Info (2)

1. **`src/config/store.ts` — backup/warn logic duplicated with `storage.ts`**
   - `backupAndWarn` (store.ts) duplicates `warnRejected` (storage.ts) almost verbatim.
   - Impact: two code paths must stay in sync if the warning format or backup semantics change.
   - Fix: export a shared `rejectAndBackup(version, reason, raw)` helper from storage.ts and reuse it in the store's `getItem`/`merge` paths. Non-blocking; defer to a later phase.

2. **`src/config/schemas.ts` — no bounds on layout item `w`/`h`**
   - `layoutItemSchema` accepts any finite number, so a corrupt config could carry `w: -5` or `w: 1e9`.
   - Impact: RGL v2 may render oddly with out-of-range dimensions. Phase 2 (grid) owns grid semantics; add `w`/`h` bounds (e.g. 1..N) there when the grid contract is finalized.
   - Recommendation: defer to Phase 2 — not a v1 correctness blocker (config still validates structurally; dashboard never bricks).

## What Passed Review

- **Security:** prototype-pollution defense is genuine and tested (schemas strip unknown keys, genuine `"__proto__"` JSON-string seeds asserted to not survive). Parsed zod output is the only object spread into state; no `dangerouslySetInnerHTML`, no `eval`, no iframe injection in this phase.
- **Correctness:** every localStorage access is wrapped in try/catch (`safeGet`/`safeSet`/`safeRemove`); backup is write-if-different and happens on *every* rejection path before defaults overwrite; version-keyed MIGRATIONS ladder is in place for future schema evolution.
- **Error handling:** all rejection paths warn with the exact UI-SPEC console format and preserve raw bytes under `deskmate.config.backup`; `saveConfig` degrades gracefully on quota errors.
- **Tests:** 21 tests across 5 files cover the observable truths (valid round-trip, corrupt reload with exact backup string, version-99 mismatch, first-run defaults, prototype-pollution strip, quota-0 guard). Recovery tests use `vi.resetModules()` + dynamic import for true reload simulation — not mocks of reload.
- **Toolchain:** typecheck, lint, build all exit 0; deps pinned exactly per STACK.md (TS ~6.0.3, Vite 8.2, React 19.2, zustand 5, zod 4, eslint flat config).

## Verdict

**Clean.** No blocking or warning findings. The 2 info items are documented and safely deferrable (Phase 2 grid contract, shared-helper refactor).
