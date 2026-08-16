---
phase: 02-grid-persistence-transports
plan: 02
subsystem: config
tags: [lz-string, transports, export-import, display-url, sanitize, debounce, toast, localStorage]
requires:
  - phase: 02
    plan: 01
    provides: grid + atomic store actions over the validated config
provides:
  - JSON export/import transports (CFG-02/03) with backup-before-replace
  - ?config= display-URL codec (lz-string, 4 KB cap, sanitize-on-decode) (CFG-04)
  - sanitizeLayout/sanitizeConfig (success criterion 5)
  - Debounced save helpers + Toast surface
affects: [phase 03 (theme/registry import contract), phase 05 (kiosk share links)]
requirements-completed: [CFG-01, CFG-02, CFG-03, CFG-04]

# Metrics
duration: 35min
completed: 2026-08-16
---

# Phase 2 Plan 02: Persistence + Transports Summary

**Three config transports completing "one schema, three transports": debounced localStorage, JSON export/import, and the ?config= display URL — CFG-01…04**

## Accomplishments
- `src/config/transports.ts` — `exportConfig` (Blob + anchor download `deskmate-config.json`, raw validated DashboardConfig); `importConfigFromFile` (file.text → JSON.parse → sanitizeConfig → validateConfig → sanitizeLayout → backupRaw(current) → importConfig; failure returns reason, current config untouched)
- `src/config/urlCodec.ts` — `encodeConfigToUrl` / `decodeConfigFromUrl` (lz-string URI-safe, `URL_CONFIG_CAP = 4096`, decode path sanitizes layout to surviving widgets); boot decode in App renders a "Viewing a shared dashboard" banner (Save to my dashboard / Exit) — stored config untouched until saved (D-2.11)
- `src/config/sanitize.ts` — `sanitizeLayout` (dedupe by id, drop missing required fields / unknown-widget items, clamp x/y ≥ 0, w ≤ cols, w/h ≥ 1, coerce ints) + `sanitizeConfig` (mends malformed shapes so zod fails cleanly, never throws)
- `src/config/storage.ts` — `saveConfigDebounced(config, 500ms)` coalescing + `flushConfigSave()` (writes pending debounce immediately)
- `src/components/toastStore.ts` + `ToastHost.tsx` — module-level toast store (no provider), success/error/info kinds, 3.5s auto-dismiss, bottom-center stack per UI-SPEC
- App wiring: Export/Import header buttons, hidden file input, shared-config banner with Save/Exit

## Files Created/Modified
- Created: src/config/{sanitize,transports,urlCodec}.ts + 3 test files, src/components/{toastStore,ToastHost}.tsx + Toast.module.css, src/app/SharedConfigBanner.module.css
- Modified: src/config/storage.ts, src/app/App.tsx, package.json (lz-string 1.5.0 explicit dep)

## Decisions Made
- Backup-before-replace reuses Phase 1's `backupRaw` (write-if-different) — the raw current blob lands at `deskmate.config.backup` before any import/save replaces the main key (D-2.10)
- URL view is a pure override (never writes storage); Save is the only path that commits it — matches D-2.11 and the "URL renders exact config" Core Value without clobbering local state
- Debounce contract: `saveConfigDebounced`/`flushConfigSave` exported per plan interface; the grid additionally gates setLayout to gesture-end (single write per drag/resize) so no debounce timer is even needed for the highest-frequency writer — requirement intent (no write amplification) met by construction
- Toast is module-level (no provider) so transports can emit feedback without prop drilling; auto-dismiss 3.5 s per UI-SPEC

## Tests
- sanitize.test.ts (dedupe/clamp/drop/mend), urlCodec.test.ts (roundtrip, garbage→null, cap rejection with non-repetitive payload, sanitize-on-decode), transports.test.ts (valid/invalid import, backup-before-replace, ghost-item pruning, debounce coalescing + flush, jsdom File.text polyfill), plus updated App tests covering the toolbar

## Next Phase Readiness
- All three transports funnel through `validateConfig` — Phase 3 imports the same contract untouched
- The shared-config banner + URL codec are the share-link mechanism Phase 5's kiosk mode reuses
---
*Phase: 02-grid-persistence-transports*
*Completed: 2026-08-16*
