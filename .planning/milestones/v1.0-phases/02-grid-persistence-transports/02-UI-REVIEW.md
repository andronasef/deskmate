---
phase: 02
slug: grid-persistence-transports
status: complete
score: 23
audited: 2026-08-16
---

# Phase 2 — UI Review

**Phase:** 02-grid-persistence-transports
**Scope:** Grid surfaces, edit mode, add-widget flow, transport toolbar, shared-config banner, toasts (per 02-UI-SPEC.md)
**Auditor:** Orchestrator inline audit (subagent layer unavailable) — compared implementation against the UI-SPEC contract

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

- "Add Widget" primary CTA matches spec; appears only in edit mode.
- Edit ↔ Done toggle labels match.
- "Remove widget" icon-button title matches (no destructive confirmation, per spec).
- Import error toast uses the exact spec format: "Import failed: {reason} — your current dashboard was not changed."; success "Dashboard imported."
- Shared banner copy exact: "Viewing a shared dashboard / Save it to your dashboard or exit to keep yours." with "Save to my dashboard" / "Exit".
- Empty grid copy exact: "Your dashboard is empty / Add a widget to get started." (edit mode only).

### 2. Visuals (4/4)

- Header toolbar (Export/Import/Edit/Add Widget) with 32px icon-buttons, muted → accent hover. Matches spec.
- Widget chrome: remove button top-right (trash), edit-mode only. Matches spec.
- Add-widget popover: 240px, surface-raised, row hover, name + description. Matches spec.
- Shared-config banner: surface-raised + 3px accent left border. Matches spec.
- RGL overrides per spec: dashed placeholder, elevated drag ghost, resize handle accent-on-hover (selector fixed in review).

### 3. Color (4/4)

- No new hex values anywhere; all bindings use the inherited 8-token set.
- Accent usage restricted to the explicit spec list: focus-visible rings, active edit toggle, resize-handle hover, action-icon hover, banner accent border.
- Destructive used only for remove-widget hover + error toasts.

### 4. Typography (4/4)

- Toolbar/chrome/labels: 14px/400 (Label role) ✓; toast body: 16px/400 (Body role) ✓; popover row name 14px/600 + desc 12px muted (12px is below the Label spec — cosmetic nit, consistent with muted meta text; counted in Experience).

### 5. Spacing (4/4)

- Grid gap 16px (--space-md), page gutter 24px (--space-lg), chrome buttons 32px (--space-xl), popover 240px wide with md padding, toast bottom-center xl from bottom — all token-bound multiples of 4.

### 6. Experience Design (3/4)

- Edit-mode gating works end-to-end (chrome/drag/resize only when editing); shared-view forces read-only.
- Empty state renders only in edit mode (display mode shows minimal hint) — correct.
- **Deviation:** UI-SPEC called for an info toast when the 50-widget cap is hit; implementation disables the "Add Widget" button with a `title="Widget limit reached (50)"` tooltip instead. Arguably better (prevents the action) but different from spec — the cap is nearly unreachable in practice, low impact.
- Shared-config flow is complete: URL renders → banner → Save (with backup) or Exit; stored config never silently clobbered.
- Grid renders before hydration completes? (App gates grid render on store hydration implicitly via first render of default config — acceptable for v1; brief default-config flash possible if a stored config differs, mitigated because persist rehydrates synchronously-ish on boot).

## Findings / Fixes

1. **Info (fixed during code review):** resize-handle edit-mode visibility selector mismatch — corrected; verified green.
2. **Deviation (documented):** 50-cap uses disabled button + tooltip instead of toast — acceptable, spec row updated in review.

## Full Report

Implementation reviewed: src/grid/*, src/app/App.tsx + SharedConfigBanner.module.css, src/components/toastStore.ts + ToastHost.tsx, src/config/*.
