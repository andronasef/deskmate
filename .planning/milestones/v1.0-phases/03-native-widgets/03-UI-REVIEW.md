---
phase: 03
slug: native-widgets
status: complete
score: 23
audited: 2026-08-16
---

# Phase 3 — UI Review

**Phase:** 03-native-widgets
**Scope:** Clock / Pomodoro / GitHub Pulse bodies, settings popover, theme bridge (per 03-UI-SPEC.md)
**Auditor:** Orchestrator inline audit (subagent layer unavailable)

## Score Summary

**Overall: 23/24**

| Pillar | Score |
|--------|-------|
| Copywriting | 4/4 |
| Visuals | 4/4 |
| Color | 4/4 |
| Typography | 4/4 |
| Spacing | 4/4 |
| Experience Design | 3/4 |

## Pillar Findings

### 1. Copywriting (4/4)
- "Time's up!" done-state copy exact; Start/Pause/Reset aria-labels + tooltips exact.
- GitHub footer states exact: "Updated HH:MM" / "Rate limited — showing cached data" / "No data yet"; "No repos configured" + hint.
- Popover: "Settings" header, Save/Cancel, field labels per UI-SPEC.
- Unknown type: "Unknown widget type" fallback exact.

### 2. Visuals (4/4)
- Clock: Display-scale time (28/40/56px per fontSize), muted date line, tabular-nums. Matches spec.
- Pomodoro: 40px countdown, accent when running / destructive at 0, 40px controls. Matches spec.
- GitHub: per-repo rows with accent star/flame icons, muted issues icon, status footer. Matches spec.
- Settings gear 32px top-right beside remove (edit mode), popover 260px surface-raised. Matches spec.

### 3. Color (4/4)
- No new hex values; `--widget-accent` flows from the stored accent (theme bridge D-3.06).
- Accent restricted to spec list: running countdown, star/streak icons, gear hover, focus rings.
- Destructive only for done-state countdown + rate-limit warning.

### 4. Typography (4/4)
- Clock time Display 600/tabular-nums; date Label 400 muted. Pomodoro Display 600 tabular. GitHub repo name Label 600, metrics Body 600, footer Label 12 muted. All within inherited roles + spec sizes.

### 5. Spacing (4/4)
- Widget padding md (16), control gap sm (8), metric gap md (16), popover md padding / 260px width — all token-bound multiples of 4.

### 6. Experience Design (3/4)
- Registry contract + graceful fallback means the grid can never crash on a bad widget.
- Failure tolerance: GitHub always renders SOMETHING useful (stale data, indicator, or no-data state) — WID-04 core promise met.
- Gesture-unlocked chime is correct UX for the autoplay policy.
- **Deviation:** clock accent-seconds styling (UI-SPEC mentioned accent seconds when showSeconds) was not implemented — time renders fully in `--text-primary`. Cosmetic deviation, zero functional impact; the accent list still reserves the option. Also, settings popover overlaps the grid item it belongs to (absolute positioning) — acceptable for v1, verified functional.

## Findings / Fixes

1. **Deviation (documented):** accent seconds not implemented (cosmetic).
2. No blocking visual issues found.

## Full Report

Implementation reviewed: src/widgets/*, src/grid/SettingsPopover.tsx, src/grid/WidgetFrame.tsx (gear + theme binding), App integration.
