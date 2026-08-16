---
phase: 01-scaffold-config-core
plan: 02
subsystem: config
tags: [zustand, zod, typescript, localStorage, recovery, backup, migrations]
requires:
  - phase: 01
    plan: 01
    provides: Vite/React/TS scaffold with vitest + Testing Library harness and pinned zustand 5.0.14 / zod 4.4.3
provides:
  - Single validated DashboardConfig contract (types.ts + zod schemas.ts) — one schema, three transports foundation
  - defaultConfig() first-run config (Clock + GitHub Pulse + Pomodoro seeded as data)
  - Versioned safe storage adapter with validate→migrate→defaults recovery + raw backup preservation
  - zustand persist store with validated rehydration and CFG-05 recovery integration tests
affects: [phase 02 grid/persistence/transports, phase 03 theme/registry, phase 04 sandbox, phase 05]
tech-stack:
  added: []
  patterns:
    - "Pattern 1: config store is the single source of truth (zustand persist, validate-on-rehydrate)"
    - "Pattern 2: one zod schema funnels every load path (localStorage now; URL/file in Phase 2)"
    - "Pattern 3: storage adapter is the ONLY module touching localStorage (safeGet/safeSet, getItem/setItem methods only)"
    - "Pattern 4: versioned storage keys + MIGRATIONS + raw backup before overwrite (Pitfall 6)"
    - "Pattern 5: persist on-disk format is the raw DashboardConfig (envelope stripped) — identical to loadConfig()'s contract"
key-files:
  created: [src/config/types.ts, src/config/schemas.ts, src/config/schemas.test.ts, src/config/defaultConfig.ts, src/config/defaultConfig.test.ts, src/config/storage.ts, src/config/storage.test.ts, src/config/store.ts, src/config/recovery.test.ts]
  modified: [src/app/App.tsx]
key-decisions:
  - "zustand v5 persist is async and its storage expects parsed StorageValue; implemented string-based StateStorage + createJSONStorage so the on-disk key holds the raw DashboardConfig (matching loadConfig's Phase-2 contract) and getItem parse-guards/validates/backs-up before returning a rehydrate string"
  - "Persist rehydration is asynchronous (toThenable): recovery integration tests must await hasHydrated before asserting store state"
  - "validateConfig throws [deskmate:config] prefix; storage/store catch it and log the exact UI-SPEC console-warning format"
  - "MIGRATIONS keyed by version (identity for v1); Phase 3 theme bumps append here"
patterns-established:
  - "Every load path (storage.loadConfig, store rehydrate) funnels through validateConfig; parsed zod output is the only object ever spread into state (prototype-pollution defense)"
  - "Backup is written BEFORE any main-key overwrite and only when the backup differs (write-if-different)"
  - "Tests colocated under src/config/*.test.ts; boot path tested via vi.resetModules() + dynamic import (true reload simulation)"
requirements-completed: [CFG-05]

# Metrics
duration: 22min
completed: 2026-08-16
---

# Phase 1 Plan 02: Config Core Summary

**Single validated `DashboardConfig` contract (zod schema) with a versioned safe storage adapter — validate→migrate→defaults recovery with raw backup preserved, wired through a zustand persist store so corrupt, invalid, or version-mismatched stored configs never brick the dashboard (CFG-05)**

## Performance

- **Duration:** 22 min
- **Started:** 2026-08-16T05:24:00Z (approx)
- **Completed:** 2026-08-16T05:46:41Z
- **Tasks:** 3 (all auto, TDD)
- **Files modified:** 10 created + 1 modified

## Accomplishments
- `src/config/types.ts`: `DashboardConfig { version: 1, theme, layout, widgets }` per D-01…D-04 (theme minimal per D-01; layout is the RGL v2 serializable `LayoutMap` per D-04; `WidgetInstance { id, type, settings }` per D-02)
- `src/config/schemas.ts`: zod 4 schema — `version: z.literal(1)`, widgets `.max(50)` (D-03), unknown-key STRIP (no `.passthrough()` → prototype-pollution defense, T-01-11), `validateConfig` throwing `[deskmate:config] path: message`
- `src/config/defaultConfig.ts`: `defaultConfig()` returns a fresh object per call — 3 seeded instances (Clock, GitHub Pulse, Pomodoro) as data only (D-09); `DEFAULT_THEME_ACCENT = '#22D3EE'`
- `src/config/storage.ts`: versioned key `deskmate.config.v1`, backup key `deskmate.config.backup`, `storageAvailable()` probe, `safeGet`/`safeSet`/`safeRemove` (getItem/setItem methods only, never throw, D-05), `backupRaw` write-if-different (D-06/D-13), `loadConfig` = parse→validate→migrate→defaults with exact UI-SPEC console-warning format (D-07), `saveConfig` only stores validated config, `MIGRATIONS` keyed by version (Pattern 4)
- `src/config/store.ts`: zustand 5 persist store — on-disk wire format is the RAW `DashboardConfig` (envelope `{ state, version }` stripped in setItem, matching `loadConfig()`'s Phase-2 contract), `getItem` parse-guards + `validateConfig` + `backupRaw` + warn before returning a rehydrate string, `merge` validates before commit (never spreads unvalidated data), `onRehydrateStorage` sets `hasHydrated`, `reset()`/`importConfig()` actions
- `src/app/App.tsx`: boot-path wiring — `useConfigStore((s) => s.config)` subscription (initializes persist rehydrate; no config values rendered per D-10)
- Tests: 17 total across `schemas.test.ts` (6 behaviors incl. genuine `__proto__`/`constructor` JSON strip), `defaultConfig.test.ts`, `storage.test.ts` (quota-0 guard, corrupt reload, future-version, save degradation), `recovery.test.ts` (5 boot-path scenarios using `vi.resetModules()` + dynamic import for true reload simulation — first run, valid round-trip, corrupt reload with exact backup string, version-99 mismatch, importConfig persist)

## Task Commits

Each task was committed atomically:

1. **Task 1: Define the config contract — types.ts + zod schemas.ts with tests** - `03e3452` (feat)
2. **Task 2: First-run defaults + versioned safe storage adapter with recovery/backup** - `6f44d2e` (feat)
3. **Task 3: Config store (zustand persist) + boot-path wiring + recovery integration test** - `6d5e5f3` (feat)

**Plan metadata:** pending (committed with SUMMARY)

## Files Created/Modified
- `src/config/types.ts` - `ConfigVersion`, `ThemeConfig`, `LayoutItem`, `LayoutMap`, `WidgetInstance`, `DashboardConfig`
- `src/config/schemas.ts` - `themeSchema`, `layoutItemSchema`, `widgetInstanceSchema`, `dashboardConfigSchema`, `validateConfig`
- `src/config/schemas.test.ts` - 6 behaviors incl. prototype-pollution strip (genuine JSON string seed)
- `src/config/defaultConfig.ts` - `defaultConfig()`, `DEFAULT_THEME_ACCENT`
- `src/config/defaultConfig.test.ts` - fresh-object + seeded-instances assertions
- `src/config/storage.ts` - `STORAGE_KEY`, `BACKUP_KEY`, `storageAvailable`, `loadConfig`, `saveConfig`, `backupRaw`, `MIGRATIONS`, `safeGet`/`safeSet`/`safeRemove`
- `src/config/storage.test.ts` - 6 behaviors (quota-0, corrupt, valid, future-version, save-degradation)
- `src/config/store.ts` - `useConfigStore`, `ConfigStore`, `stateStorage` (StateStorage + createJSONStorage)
- `src/config/recovery.test.ts` - 5 boot-path integration scenarios
- `src/app/App.tsx` - config store subscription (boot-path wiring)

## Decisions Made
- Used zustand v5's `StateStorage` + `createJSONStorage` model (string-based) so persist's `getItem` returns a rehydrate string and the on-disk key is the raw `DashboardConfig` — exactly the plan's wire-format contract and identical to what Phase 2's `loadConfig()` reads
- Kept `hasHydrated` set via `onRehydrateStorage`; recovery tests await it because persist rehydration is async (microtask chain)
- `backupRaw`/`backupAndWarn` deduplicated into one helper; warning format matches UI-SPEC exactly (`[deskmate:storage] config rejected (version=…): <reason> — raw backup preserved at deskmate.config.backup`)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] zustand v5 persist expects a parsed StorageValue, not a string**
- **Found during:** Task 3 (Config store)
- **Issue:** An initial `PersistStorage` implementation returning `{ config }` from getItem produced defaults on every load (persist's `deserializedStorageValue.state` was undefined) and `hasHydrated` never became true
- **Fix:** Implemented the plan's documented string-based `StateStorage` + `createJSONStorage` model — `getItem` returns `JSON.stringify({ state: { config }, version: 0 })`, `setItem` strips the envelope and stores only `state.config`
- **Files modified:** src/config/store.ts
- **Verification:** `recovery.test.ts` 5/5 pass (valid round-trip, corrupt/version-mismatch recovery with exact backup strings, first-run defaults)
- **Committed in:** 6d5e5f3

**2. [Rule 2 - Missing Critical] Persist rehydration is asynchronous in zustand v5**
- **Found during:** Task 3 (recovery integration tests)
- **Issue:** Immediately after `await import('./store')`, `hasHydrated` was still false and config not yet merged (hydration runs on a microtask chain)
- **Fix:** `bootStore()` helper awaits `vi.waitFor(() => expect(hasHydrated).toBe(true))`; `importConfig` test boots first to avoid mutating mid-hydration
- **Files modified:** src/config/recovery.test.ts
- **Verification:** All recovery tests pass with awaited hydration
- **Committed in:** 6d5e5f3

**3. [Rule 2 - Missing Critical] Prototype-pollution test was a false positive**
- **Found during:** Task 1 (schemas test)
- **Issue:** `{ __proto__: {...} }` in an object literal sets the prototype (not an own key) and JSON.stringify drops it — the test passed vacuously
- **Fix:** Seeded the raw JSON string directly (`'{"__proto__":...}'`) so `__proto__`/`constructor` arrive as genuine own keys in the parsed input
- **Files modified:** src/config/schemas.test.ts
- **Verification:** Test asserts parsed own-keys are exactly version/theme/layout/widgets and no `polluted` key survives
- **Committed in:** 6f44d2e

**4. [Rule 3 - Blocking] `vi.spyOn(Storage.prototype, 'setItem')` leaked across storage tests**
- **Found during:** Task 2 (storage tests)
- **Issue:** The quota-0 test's setItem mock persisted, breaking subsequent tests with QuotaExceededError
- **Fix:** Added `vi.restoreAllMocks()` in `afterEach`
- **Files modified:** src/config/storage.test.ts
- **Verification:** storage.test.ts 5/5 pass
- **Committed in:** 6f44d2e

---

**Total deviations:** 4 auto-fixed (2 missing critical, 2 blocking)
**Impact on plan:** All auto-fixes were zustand-v5-behavior correctness fixes required to satisfy the plan's wire-format and recovery contract. No scope creep; the on-disk format and recovery semantics match the plan exactly.

## Issues Encountered
- zustand v5 persist's synchronous `toThenable` runs the hydration chain synchronously for sync storage — the async `StateStorage.getItem` (returns a Promise) keeps hydration async and avoids referencing the store during its own creation
- `createJSONStorage` needs the storage to return strings; the plan's wire-format note was followed precisely

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- `src/config/*` is the stable contract Phase 2 imports: `DashboardConfig`, `validateConfig`, `STORAGE_KEY`/`BACKUP_KEY`, `loadConfig`/`saveConfig`, `MIGRATIONS`, `useConfigStore`, `defaultConfig()`
- CFG-05 is fully met: corrupt/invalid/version-mismatched configs recover to a working dashboard with console warning + raw backup preserved under `deskmate.config.backup` — never a blank screen
- On-disk format is the raw DashboardConfig, so Phase 2's `loadConfig()` path and the persist store read the same blob (one format, one validator)
- `importConfig(raw)` is the single mutation point Phase 2's JSON-import and URL-codec transports will call
- Phase 2 will add `setLayout`/`updateWidget`/`addWidget` store actions (grid), JSON export/import, and the `?config=` URL codec on top of this base

---
*Phase: 01-scaffold-config-core*
*Completed: 2026-08-16*
