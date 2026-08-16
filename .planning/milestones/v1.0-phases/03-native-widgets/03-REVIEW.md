---
phase: 03-native-widgets
reviewed: 2026-08-16T07:31:00Z
status: clean
depth: standard
files_reviewed: 18
critical: 0
warning: 0
info: 3
total: 3
---

# Phase 3 Code Review: Native Widgets

**Depth:** standard (inline review — orchestrator-performed)
**Files reviewed:** 18 (src/widgets/*, src/grid/{WidgetFrame,DashboardGrid,SettingsPopover,addWidgetFlow,widgetMeta}.*, src/app/App.tsx, src/main.tsx)

## Findings

### Critical (0)

None.

### Warning (0)

None.

### Info (3)

1. **`src/widgets/github.ts` — backoff is session-scoped (not persisted)**
   - A reload immediately retries a rate-limited repo (backoffMap is in-memory). GitHub's reset window is typically ≤1 h, so the widget self-heals on the next interval, and the 304/cache path keeps showing data meanwhile. Deliberate trade-off (documented in summary); a persisted backoff could delay recovery after a genuine reset. Non-blocking.

2. **`src/widgets/pomodoro.tsx` — chime silently skipped when AudioContext is unavailable**
   - Non-secure contexts / odd embeds fall back to no sound (guard `try/catch`). By design (no asset, graceful degradation); the STATE.md on-device verification item covers real autoplay behavior.

3. **`src/widgets/clock.tsx` — `theme` prop accepted but unused** (accent display intentionally minimal)
   - The clock binds only `--text-primary`/`--text-muted` (per UI-SPEC "Clock time: --text-primary"). The unused prop is part of the uniform WidgetDefinition render signature — kept for interface consistency. Non-blocking.

## What Passed Review

- **Security:** no dangerouslySetInnerHTML/eval/innerHTML (grep gates 0); GitHub responses parsed into a fixed shape (never spread raw API JSON into state); cache stores normalized data; URLs fixed to api.github.com; no secrets.
- **Correctness:** timer lifecycle is zombie-free (interval cleared on pause/reset/unmount — tested); minutes-change reset uses render-time derived state (no setState-in-effect); GitHub conditional-request chain (304/403/429/network) each route tested; dedupe + backoff module state isolated in tests.
- **Failure tolerance (WID-04):** every GitHub failure path returns data (stale or zeroed) — the widget renders a status footer, never throws.
- **Tests:** 74 green — clock (tick/format/cleanup), pomodoro (countdown/chime/cleanup/clamp), registry (contract/fallback/registration), github (cache/304/403/backoff/network/dedupe), App integration.

## Verdict

**Clean.** Two real issues found and fixed during development-testing (ref churn abort loop; module backoff leak) — both caught by tests, not shipped broken. 3 info items documented, non-blocking.
