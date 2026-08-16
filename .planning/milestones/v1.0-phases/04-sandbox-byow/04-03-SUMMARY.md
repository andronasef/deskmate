---
phase: 04-sandbox-byow
plan: 03
subsystem: ui
tags: [codemirror, byow, editor, live-preview, iframe-budget, lazy-mount]
requires:
  - phase: 04
    plan: 02
    provides: sandbox renderer + bridge + custom registry entry
provides:
  - BYOW editor drawer (CodeMirror HTML/CSS/JS tabs + 300 ms debounced live sandboxed preview)
  - Save/Cancel with unsaved-changes guard; Add Custom Widget flow; gear opens the drawer
  - Per-device iframe budgets (8 mobile / 20 desktop) with block toasts + IntersectionObserver lazy mounting
affects: [phase 05 (kiosk custom widgets), future marketplace]
requirements-completed: [BYOW-01, BYOW-02, BYOW-05]

# Metrics
duration: 40min
completed: 2026-08-16
---

# Phase 4 Plan 03: BYOW Editor + Budgets Summary

**The authoring surface (BYOW-01/02) and the performance layer (D-4.13/4.14) — write, preview, save, and run custom widgets safely**

## Accomplishments
- `src/widgets/byow/BYOWDrawer.tsx` — fixed right drawer (480px, full-width ≤ sm), HTML/CSS/JS CodeMirror tabs (@uiw/react-codemirror + lang-html/-css/-javascript), 300 ms debounced live preview reusing IframeWidgetRenderer, dirty tracking with "Discard unsaved changes?" confirm, Escape close, backdrop scrim; `WIDGET_CODE_TEMPLATE` in template.ts (UI-SPEC empty-code template with window.deskmate doc comment)
- `src/widgets/byow/useIframeBudget.ts` — `IFRAME_BUDGETS { mobile: 8, desktop: 20 }` + matchMedia device class + atLimit guard
- `src/widgets/byow/useLazyMount.ts` — IntersectionObserver (200px rootMargin) with IO-unavailable fallback (mounts immediately)
- Wiring: AddWidgetButton's "Custom Widget" entry → drawer (budget-blocked → info toast); gear on custom widgets → drawer (not the field popover); DashboardGrid lazy-mounts custom bodies with a lightweight placeholder until near-visible; Save → addWidget('custom') + updateWidget / updateWidget(existing)
- CodeMirror 6 deps added

## Files Created/Modified
- Created: src/widgets/byow/{BYOWDrawer.tsx, BYOWDrawer.module.css, template.ts, useIframeBudget.ts, useLazyMount.ts, byow.test.tsx}
- Modified: src/widgets/registry.tsx, src/widgets/index.tsx, src/grid/DashboardGrid.tsx + module.css, src/grid/addWidgetFlow.tsx, src/app/App.tsx (drawer state + save handler), package.json

## Decisions Made
- Preview = the SAME renderer as production widgets (the drawer previews the exact sandboxed experience)
- Custom-widget gear routes to the drawer (code editing) instead of the generic field popover
- Budget gate lives in the catalog entry (disabled + toast) AND counts mounted frames — prevent blowup at add time

## Tests
- byow.test.tsx: tabs + template render; existing-widget prefills; Save passes null id (create) / widget id (edit); Cancel with no edits closes; Cancel with edits confirms (via real CodeMirror `EditorView.dispatch` — the only supported way to drive onChange); Escape closes; budget atLimit at 8 mobile / 20 desktop; lazy mount stays far until the observer fires (mock IO) and mounts immediately without IO

## Next Phase Readiness
- Custom widgets are fully authored in-app; Phase 5 kiosk renders them like any widget
---
*Phase: 04-sandbox-byow*
*Completed: 2026-08-16*
