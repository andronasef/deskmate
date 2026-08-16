---
phase: 03-native-widgets
plan: 01
subsystem: ui
tags: [widget-registry, renderer-contract, theme-bridge, settings-popover, css-variables]
requires:
  - phase: 02
    plan: 01
    provides: WidgetFrame chrome + grid + atomic store actions
provides:
  - WIDGET_REGISTRY render contract (type → {name, description, render, settingsFields, defaultSettings})
  - Theme bridge: theme.accent → --widget-accent CSS variable (no schema migration)
  - WidgetFrame settings gear + generic SettingsPopover writing via updateWidget
  - Grid renders real widget bodies; unknown types fall back gracefully
affects: [phase 03 plans 02/03 (register into the contract), phase 04 (sandbox mounts custom widgets via the same registry)]
requirements-completed: [WID-01, WID-02, WID-03, WID-04]

# Metrics
duration: 30min
completed: 2026-08-16
---

# Phase 3 Plan 01: Widget Registry + Theme Bridge Summary

**The single widget registry/renderer contract (D-3.01…3.04) and theme bridge (D-3.05/3.06) — every widget renders through one path, unknown types fail gracefully**

## Accomplishments
- `src/widgets/registry.tsx` — `WIDGET_REGISTRY`, `registerWidget`, `renderWidget` (unknown-type → "Unknown widget type" fallback), `defaultSettingsFor`, `SettingsField` type
- `src/widgets/theme.ts` — `WidgetTheme` + `widgetAccent()` (DEFAULT_THEME_ACCENT fallback)
- `src/widgets/index.tsx` — side-effect registration module importing the 3 native widgets (imported from main.tsx AND App.tsx so the registry is populated in app + tests)
- `WidgetFrame` — now binds `--widget-accent` from theme, gains edit-mode settings gear (32px, accent hover) beside remove
- `SettingsPopover` — generic fields from `definition.settingsFields` (text/number/toggle/select), Save merges + clamps (minutes 1-120), Cancel/outside-click/Escape close
- `DashboardGrid` — renders via `renderWidget(widget, theme, editMode)`; `openSettingsId` state; settings save → `updateWidget`
- `addWidgetFlow` + `widgetMeta` — consume the registry (single source of names)

## Files Created/Modified
- Created: src/widgets/{registry.tsx, theme.ts, index.tsx}, src/grid/SettingsPopover.tsx + module.css, registry.test.tsx
- Modified: WidgetFrame.tsx + module.css, DashboardGrid.tsx, addWidgetFlow.tsx, widgetMeta.ts, main.tsx, App.tsx (registration import)

## Decisions Made
- registry.tsx (JSX) over registry.ts — the render contract returns React nodes
- Registration is a side-effect module imported by App (composition root) — tests and app share the same populated registry
- `--widget-accent` var set on the WidgetFrame root so ALL widgets bind accent consistently (D-3.06)

## Tests
- registry.test.tsx: all 3 types registered with render+fields; unknown-type fallback; registerWidget/defaultSettingsFor; body smoke (pomodoro renders 25:00)
- App.test.tsx: real bodies render (clock-time testid, pomodoro countdown, Start control); settings gears appear in edit mode

## Next Phase Readiness
- Plans 03-02/03-03 register real bodies into this contract
- Phase 4's sandbox mounts custom widgets through the same renderWidget path (the registry is the BYOW integration point)
---
*Phase: 03-native-widgets*
*Completed: 2026-08-16*
