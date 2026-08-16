# Phase 2: Grid, Persistence & Config Transports - Context

**Gathered:** 2026-08-16
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 2 delivers the Core Value working end-to-end: (1) a responsive multi-widget grid (react-grid-layout v2) where users can add, remove, resize, and drag-and-drop widgets; (2) persistence via debounced localStorage; (3) the three config transports — localStorage (CFG-01), JSON file export/import (CFG-02/03), and the unique display URL (CFG-04) — all funneling through the single validated `DashboardConfig` contract from Phase 1 ("one schema, three transports"); (4) layout sanitization so imported/URL-loaded layouts never break the grid. GRID-05 (single full-screen widget on phones) is deferred to Phase 5. Plans: 02-01 grid, 02-02 transports, 02-03 URL-cap research probe.

</domain>

<decisions>
## Implementation Decisions

### Grid Interaction Model
- **D-2.01:** Edit-mode gating — a header toggle switches the grid into edit mode; drag/resize/remove chrome appears only in edit mode. Kiosk display stays clean (display mode is the default).
- **D-2.02:** Drag surface = whole widget draggable in edit mode (RGL v2 default), resize via RGL corner handle. No dedicated drag handle.
- **D-2.03:** Add-widget flow = "Add Widget" button in the header (edit mode) → popover listing the 3 seeded widget types from `defaultConfig` → click adds an instance at the first free grid slot.
- **D-2.04:** Widget chrome = top-right overlay cluster (remove now; settings arrives Phase 3). Drag/resize affordances come from RGL's own handles.

### Responsive Breakpoints
- **D-2.05:** RGL v2 default breakpoints/cols: lg 1200 (12), md 996 (10), sm 768 (6), xs 480 (4), xxs 0 (2).
- **D-2.06:** Phone/narrow = 1-column stacked grid (widgets reflow full width); single-fullscreen widget mode deferred to Phase 5 (GRID-05).
- **D-2.07:** `defaultConfig()` seeds a sensible per-breakpoint layout for the 3 widget instances (clock 2×2, pomodoro 2×1, github 2×2 on lg).
- **D-2.08:** Grid width measured via RGL v2 `useContainerWidth` with a `mounted` gate — no measure-on-mount flash.

### Config Transports UX
- **D-2.09:** Export = downloadable `deskmate-config.json` containing the raw validated `DashboardConfig` (one schema, three transports).
- **D-2.10:** Import = file → zod validate → replace config on success; on failure error toast, current config untouched; current config backed up (reuse backup semantics) before replace.
- **D-2.11:** Display URL = `?config=<lz-string compressed JSON>`; decoded + validated config renders on load, stored config untouched; a small banner offers "Save to my dashboard".
- **D-2.12:** Hard cap on compressed payload (~4 KB) with automatic fallback to JSON-file transport above the cap; plan 02-03 empirically probes host request-line limits.

### Persistence & Sanitization
- **D-2.13:** Debounced localStorage write (~500 ms) after any layout/widget change (CFG-01).
- **D-2.14:** `sanitizeLayout` on import/URL-load: dedupe duplicate item keys, clamp invalid w/h, drop items missing required fields (success criterion 5).
- **D-2.15:** Atomic `addWidget` / `removeWidget` / `setLayout` / `updateWidget` actions on the existing zustand store; `importConfig` remains the single replace point.
- **D-2.16:** Extend the `MIGRATIONS` ladder; keep identity v1→v1; future-version configs still degrade to defaults with backup.

### Claude's Discretion
- Technical implementation details: exact RGL v2 API usage (hooks vs components), debounce wiring, URL codec internals, popover styling, toast styling, sanitizeLayout edge handling beyond D-2.14.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/config/store.ts` — `useConfigStore` (zustand persist) with `config`, `hasHydrated`, `reset`, `importConfig`; the single validated state source Phase 2 extends with grid actions.
- `src/config/storage.ts` — `STORAGE_KEY`/`BACKUP_KEY`, `loadConfig`/`saveConfig`, `backupRaw` (write-if-different), `MIGRATIONS`, safe adapter helpers.
- `src/config/schemas.ts` — `dashboardConfigSchema` + `validateConfig`; `layout` is already the RGL-v2-serializable `{ breakpoint: LayoutItem[] }` record (D-04).
- `src/config/defaultConfig.ts` — `defaultConfig()` seeding 3 widget instances (Clock, GitHub Pulse, Pomodoro).
- `src/app/App.tsx` — shell with wordmark header + placeholder card; Phase 2 replaces the placeholder with the grid.
- `src/index.css` — 8 dark tokens + 7 spacing tokens on `:root`; grid chrome binds to these.

### Established Patterns
- CSS Modules + CSS custom properties (no component library); colocated `*.test.ts(x)`; strict TS; zod as the single validation funnel; adapter-only localStorage access.

### Integration Points
- `App.tsx` mounts the grid where the placeholder card sits today.
- `defaultConfig()` must grow a per-breakpoint `layout` (currently the seeded contract has layout data).
- Store actions call `saveConfig`/persist; transports (import/URL) call `importConfig` + `sanitizeLayout`.
- RGL v2 CSS: `react-grid-layout/css/styles.css` + `react-resizable/css/styles.css` imported at app level.

</code_context>

<specifics>
## Specific Ideas

No specific requirements beyond the roadmap goal + success criteria and the decisions above — standard RGL v2 patterns apply.

</specifics>

<deferred>
## Deferred Ideas

- GRID-05 single full-screen widget on narrow screens → Phase 5 (already mapped).
- Widget settings UI (per-widget config forms) → Phase 3 with the registry.
- Widget catalog/marketplace → future milestone (out of v1 scope).

</deferred>
