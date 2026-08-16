---
phase: 02-grid-persistence-transports
reviewed: 2026-08-16T07:11:00Z
status: clean
depth: standard
files_reviewed: 20
critical: 0
warning: 0
info: 3
total: 3
---

# Phase 2 Code Review: Grid, Persistence & Config Transports

**Depth:** standard (inline review — subagent layer unavailable, orchestrator-performed)
**Files reviewed:** 20 (src/grid/*, src/config/{store,storage,sanitize,transports,urlCodec,defaultConfig}.ts, src/components/*, src/app/App.tsx + CSS)

## Findings

### Critical (0)

None.

### Warning (0)

None.

### Info (3)

1. **`src/grid/DashboardGrid.module.css` — resize-handle edit-mode visibility selector mismatch (fixed in review)**
   - The CSS used `.grid[data-edit-mode='true']` but the `data-edit-mode` attribute lives on the container div, so edit-mode resize handles would have stayed invisible (opacity 0).
   - **Fixed:** selectors now read `.container[data-edit-mode='true'] .grid :global(.react-resizable-handle)`. Re-verified: build green, tests green. (This is what the review pass is for.)

2. **`src/config/store.ts` `addWidget` uses `crypto.randomUUID()`**
   - Throws in non-secure contexts (plain-HTTP non-localhost). Phase 1's defaultConfig already used it, so this is inherited behavior, and the app is HTTPS-deployed/localhost-dev. Not a v1 blocker.
   - If a non-secure-context deployment ever appears, add a tiny fallback (`Math.random`-based suffix). Non-blocking.

3. **`src/app/App.tsx` — Export exports the stored config even while viewing a shared config**
   - In shared view (`?config=` active), the header Export writes the user's stored config, not the one on screen. Defensible (Export = "my config"), but potentially confusing.
   - Recommendation: leave as-is for v1 (the banner's "Save to my dashboard" is the shared-config commit path); revisit if users report confusion.

## What Passed Review

- **Security:** all three transports funnel through `validateConfig`; imported/URL configs are sanitized (dedupe/clamp/drop) before ever touching state; backup-before-replace preserves the raw current blob (`deskmate.config.backup`); URL view is a pure override — `?config=` alone never writes storage; no `dangerouslySetInnerHTML`, no eval.
- **Correctness:** `setLayout` validates-before-commit (schema-invalid candidates rejected, store test asserts state untouched); `onLayoutChange` feedback loop is guarded by a ref snapshot so programmatic breakpoint renders never persist back; decode paths null on any failure (stored config renders instead — never a blank screen).
- **Error handling:** import failures return structured reasons → UI-SPEC error toasts; current config untouched on failure; lz-string decompress/parse/validate each wrapped.
- **State management:** atomic store actions; `importConfig` remains the single replace point; persist writes the raw validated config (one format, one validator).
- **Tests:** 46 green — store actions, sanitize (dedupe/clamp/drop/mend), URL codec (roundtrip, garbage→null, cap rejection with non-repetitive payload, sanitize-on-decode), transports (valid/invalid import, backup-before-replace, ghost pruning), debounce coalescing + flush, App shell/edit-mode/grid render.

## Verdict

**Clean.** One real bug found and fixed during review (resize-handle CSS selector). 3 info items documented, all non-blocking and safely deferrable.
