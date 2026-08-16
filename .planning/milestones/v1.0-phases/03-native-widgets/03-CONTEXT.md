# Phase 3: Native Widgets - Context

**Gathered:** 2026-08-16
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 3 delivers the table-stakes native widget set — Desk Clock & Date (WID-01), Pomodoro Focus Timer (WID-02), GitHub Pulse (WID-03) — rendered through a single widget registry/renderer contract, with a theme bridge (tokens → CSS variables → widget props) and failure-tolerant live data (WID-04: stale-data rendering + status indicator + auto-refresh without lockout). Plans: 03-01 registry+theme, 03-02 clock+pomodoro, 03-03 github pulse.

</domain>

<decisions>
## Implementation Decisions

### Widget Registry & Renderer Contract
- **D-3.01:** Data-driven `WIDGET_REGISTRY: Record<type, { name, description, render, defaultSettings }>` — the single source the grid, catalog, and settings popover all consume.
- **D-3.02:** Render contract = `render(widget, theme, editMode)` → React node rendered inside WidgetFrame. Grid maps widgets → registry.render.
- **D-3.03:** Minimal per-widget settings popover this phase (Clock format/typography, Pomodoro minutes, GitHub repos) — the widget chrome gains a settings (gear) button beside remove.
- **D-3.04:** DashboardGrid renders registry bodies instead of the Phase-3 placeholder; unknown types render a graceful "Unknown widget type" fallback.

### Theme System
- **D-3.05:** Stored theme contract stays minimal `{ accent }` (D-01) — NO schema migration. Widgets receive `accent` as a prop.
- **D-3.06:** WidgetFrame sets `--widget-accent` (and inherits the global token set) from config.theme.accent; widgets bind to it.
- **D-3.07:** Clock customization = settings `showSeconds`, `hour12`, `fontSize` (small/med/large).
- **D-3.08:** Theme picker UI deferred to a future phase — not in WID-01 scope.

### Pomodoro
- **D-3.09:** settings `minutes` (default 25), adjustable in the settings popover.
- **D-3.10:** Chime via Web Audio oscillator (~15 lines, no asset); unlocked on first user gesture — the Start button doubles as the unlock (autoplay policy).
- **D-3.11:** Display = large MM:SS countdown, accent color while running, Start/Pause/Reset controls.
- **D-3.12:** Timer state session-local (component state) — reload resets the timer (acceptable v1).

### GitHub Pulse
- **D-3.13:** settings `repos: ['owner/repo']`, defaulting to a well-known public repo (`facebook/react`) so first run shows live data.
- **D-3.14:** Data strategy per STACK.md: ETag/If-None-Match conditional requests, `x-ratelimit-*` parsing, ≥3 min adaptive backoff on rate-limit/403, shared deduping client (one fetch per repo shared across widgets), localStorage stale-while-revalidate cache.
- **D-3.15:** Status indicator = muted footer "Updated HH:MM" + "Rate limited — showing cached data" warning (WID-04); never a broken UI.
- **D-3.16:** Metrics = stars, open issues, commit streak (7-day commit count); per-metric graceful failure.

### Claude's Discretion
- Registry file layout, hook internals (useGitHubClient, useTimer), settings-popover implementation details, exact Web Audio chime synthesis, GitHub API endpoint choices, stale-cache TTL values beyond the ≥3 min backoff floor, autoplay-unlock wiring.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/grid/WidgetFrame.tsx` — chrome wrapper (remove button today); gains settings button + theme variable binding.
- `src/grid/widgetMeta.ts` — WIDGET_META (name/description) — superseded by WIDGET_REGISTRY (D-3.01) which carries render.
- `src/grid/DashboardGrid.tsx` — renders placeholder bodies today; swaps to registry.render (D-3.04).
- `src/config/store.ts` — `updateWidget(id, settings)` merges settings — the settings popover writes through this.
- `src/config/types.ts` — `ThemeConfig { accent }`, `WidgetInstance { id, type, settings }`.
- `src/index.css` — 8 dark tokens on :root; widgets bind via CSS variables.
- `src/app/App.tsx` — header toolbar; gear button rides WidgetFrame chrome.

### Established Patterns
- CSS Modules + custom properties; colocated tests; zod single validation funnel; module-level stores (toast); atomic store actions.

### Integration Points
- WidgetFrame: `onSettings` callback (opens popover) + `--widget-accent` CSS var.
- DashboardGrid: `config.theme.accent` → WidgetFrame.
- Store: `updateWidget` for settings changes; settings popover writes validated values.
- GitHub client: new `src/widgets/github.ts` module (shared client + cache); consumed by GitHub Pulse widget.

</code_context>

<specifics>
## Specific Ideas

No specific requirements beyond the roadmap goal + success criteria and the decisions above.

</specifics>

<deferred>
## Deferred Ideas

- Theme picker UI (D-3.08) → future phase.
- Timer persistence across reload (D-3.12) → future phase.
- Per-widget settings for future widgets / marketplace → future milestone.

</deferred>
