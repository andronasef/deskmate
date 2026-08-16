# Phase 5: Kiosk & Polish - Context

**Gathered:** 2026-08-16
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 5 ships the always-on kiosk experience: (1) wake lock + fullscreen services (KIOSK-01/02) with graceful fallback on unsupported devices (iOS < 16.4, Low Power Mode, non-HTTPS); (2) single-widget full-screen mobile mode (GRID-05); (3) status indicators for widget failures, GitHub rate-limit/stale data, and wake-lock state (KIOSK-04); (4) PWA installability (manifest + icons, KIOSK-03); (5) an on-hardware soak with instrumentation (24 h run, frame-time logging, memory sampling, 6× CPU throttle) + the deferred verify items (chime on fresh profile, 2-widget rate-limit simulator). Plans: 05-01 wake-lock/fullscreen services (+ spike), 05-02 mobile mode + indicators + PWA + soak.

</domain>

<decisions>
## Implementation Decisions

### Wake Lock + Fullscreen Services
- **D-5.01:** WakeLockService: feature-detect `navigator.wakeLock`; `request('screen')` → sentinel; re-acquire on `visibilitychange`→visible (browser auto-releases when hidden); release on unmount/exit (KIOSK-01/02). No third-party package (STACK.md).
- **D-5.02:** Wake-lock state (active / unsupported / error) lives in the zustand store — shared by all views; single global visibilitychange handler (STACK.md pattern).
- **D-5.03:** Unsupported (iOS < 16.4) or Low Power Mode rejection → status chip "Screen awake unavailable", never a crash (KIOSK-02).
- **D-5.04:** Header "Fullscreen" toggle → requests fullscreen + wake lock together; exits both on toggle-off/Escape.

### Single-Widget Mobile Mode
- **D-5.05:** Auto on narrow screens (≤480px / xs breakpoint): single full-screen widget replaces the grid; resizing wider returns to the grid (GRID-05).
- **D-5.06:** Session-local selection (first widget default); arrow buttons cycle through widgets with a dots indicator.
- **D-5.07:** Edit mode disabled in single-widget view (read-only kiosk); header remains.
- **D-5.08:** Responsive only (no manual exit affordance needed in v1).

### Status Indicators
- **D-5.09:** Slim status footer bar (kiosk display mode) aggregating: widget failures, GitHub stale/rate-limited, wake-lock state (KIOSK-04).
- **D-5.10:** Widget-failure chip "N widget(s) failed to load" — sourced from the sandbox crash state.
- **D-5.11:** GitHub global chip "GitHub data stale" — reuses the Phase 3 client's rateLimited/stale flags.
- **D-5.12:** Wake-lock chip "Screen awake" / "Wake lock unavailable" — from the store.

### PWA + Soak
- **D-5.13:** `public/manifest.webmanifest` (name, display: standalone, theme_color/background_color from tokens, icons 192/512) + meta theme-color (KIOSK-03).
- **D-5.14:** Simple generated PNG icons (accent glyph on background) — no design tooling.
- **D-5.15:** Debug status panel (frame-time + memory sampling + wake-lock/chime states) + documented 24h soak procedure; the on-device run is a documented checklist (cannot be executed in this environment).
- **D-5.16:** Rate-limit simulator + chime-on-fresh-profile documented as soak checklist items (STATE.md verify flags).

### Claude's Discretion
- WakeLockService internals, fullscreen API handling (cross-browser prefix fallback), status footer layout details, icon generation approach, soak instrumentation specifics, PWA manifest fields beyond the spec.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/config/store.ts` — zustand store; add `kiosk` slice (fullscreen, wakeLock state) per D-5.02.
- `src/widgets/github.ts` — the shared client already tracks `rateLimited`/`stale` per repo; the global chip aggregates across repos.
- `src/widgets/sandbox/IframeWidgetRenderer.tsx` — `crashed` state is the widget-failure source (D-5.10).
- `src/grid/DashboardGrid.tsx` — the grid + breakpoints (xs 480) drive the single-widget mode trigger (D-5.05).
- `src/app/App.tsx` — header (add Fullscreen toggle), main (swap grid for single-widget view on xs).
- `src/widgets/registry.tsx` — renderWidget for the single-widget body.
- `src/components/toastStore.ts` — toasts for fullscreen/wake-lock errors if needed.

### Established Patterns
- Module-level services with clean lifecycle, zustand single store, CSS Modules + tokens, colocated tests.

### Integration Points
- Store: `useKioskStore`-style slice on the existing store (fullscreen, wakeLockState, widgetFailures).
- App: fullscreen toggle button; conditional single-widget view at ≤480px; status footer.
- GitHub client: expose a global aggregate (stale/rateLimited across repos).
- Sandbox renderer: report crash state up (callback → store) for the failure chip.

</code_context>

<specifics>
## Specific Ideas

No specific requirements beyond the roadmap goal + success criteria and the decisions above.

</specifics>

<deferred>
## Deferred Ideas

- Service Worker / offline caching (PWA install works without SW in v1; SW adds offline resilience — STACK.md defers).
- Real push notifications / remote sync → future milestone.
- Multi-widget kiosk rotation (auto-cycling widgets on large screens) → future phase.

</deferred>
