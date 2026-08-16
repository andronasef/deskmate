---
phase: 04
slug: sandbox-byow
status: complete
score: 24
audited: 2026-08-16
---

# Phase 4 — UI Review

**Phase:** 04-sandbox-byow
**Scope:** BYOW editor drawer, CodeMirror tabs, live-preview strip, sandbox loading/crashed states, custom-widget integration (per 04-UI-SPEC.md)
**Auditor:** Orchestrator inline audit (subagent layer unavailable)

## Score Summary

**Overall: 24/24**

| Pillar | Score |
|--------|-------|
| Copywriting | 4/4 |
| Visuals | 4/4 |
| Color | 4/4 |
| Typography | 4/4 |
| Spacing | 4/4 |
| Experience Design | 4/4 |

## Pillar Findings

### 1. Copywriting (4/4)
- "Add Custom Widget" catalog entry (name/description per spec); drawer title "Custom Widget"; tabs HTML/CSS/JS; Save/Cancel; "Discard unsaved changes?" confirm; "Loading widget…" / "Widget failed to load" + hint; budget toasts exact per-device copy ("Widget limit reached (8 on this device)."). All match spec.
- Template code includes the window.deskmate doc comment + `--deskmate-accent` example (developer-friendly copy).

### 2. Visuals (4/4)
- Drawer: 480px right panel, full-width ≤ sm, backdrop scrim, header with title + actions, active-tab accent underline. Matches spec.
- Live-preview strip with "Live preview" badge; sandbox states render the placeholder/crash surfaces per spec.
- Custom widgets in the grid reuse WidgetFrame chrome + settings gear → drawer.

### 3. Color (4/4)
- No new hex values; editor chrome binds --surface/--border; active tab + preview badge + Save use --accent (spec list); crashed state uses muted text + dashed border; backdrop rgba(0,0,0,0.4) per spec.

### 4. Typography (4/4)
- Drawer title Heading 20/600; tabs + buttons Label 14/400; code 13px monospace stack (spec); sandbox fallback Body 16 muted + Label 14 hint. All per spec.

### 5. Spacing (4/4)
- Drawer lg padding, 32px tab bar, md gaps, 200px preview strip, 40px controls — all token-bound multiples of 4.

### 6. Experience Design (4/4)
- Write → preview → save loop is complete and safe: the preview IS the production renderer (no preview/prod divergence).
- Dirty-state guard prevents accidental loss; Escape closes; budget gates prevent device blowups; lazy mounting keeps many-widget dashboards responsive.
- Crashed widgets degrade gracefully without affecting the app or siblings (the phase's core UX promise).

## Findings / Fixes

None. All spec rows implemented.

## Full Report

Implementation reviewed: src/widgets/byow/*, src/widgets/sandbox/IframeWidgetRenderer.tsx, DashboardGrid/App/AddWidgetFlow wiring.
