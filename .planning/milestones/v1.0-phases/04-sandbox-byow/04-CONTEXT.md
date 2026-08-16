# Phase 4: Sandbox & BYOW - Context

**Gathered:** 2026-08-16
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 4 delivers the open developer ecosystem safely: (1) custom widgets written in HTML/CSS/JS via a built-in CodeMirror editor with live preview (BYOW-01/02); (2) rendering inside a sandboxed iframe (`sandbox="allow-scripts"` ONLY — the security boundary, BYOW-03); (3) a DeskMate API bridge via postMessage with exact-source-reference + per-widget nonce validation (BYOW-04); (4) clean teardown — no zombie iframes/timers (BYOW-05); (5) iframe performance budgets + lazy mounting. Plans: 04-01 research spike (postMessage/srcdoc multi-browser behavior), 04-02 sandbox contract + bridge + renderer + lifecycle, 04-03 editor + budgets + lazy mounting.

</domain>

<decisions>
## Implementation Decisions

### Sandbox Rendering Contract
- **D-4.01:** iframe `sandbox="allow-scripts"` ONLY — never allow-same-origin, allow-forms, allow-modals, allow-popups, allow-top-navigation; `referrerpolicy="no-referrer"` (BYOW-03, PITFALLS.md Pitfall 1).
- **D-4.02:** Content via `srcdoc` HTML wrapper: escaped `</script>`-safe bootstrap injects the per-widget nonce + API shim, then renders user code (html/css/js) inside the same document.
- **D-4.03:** Lifecycle: ready handshake with ~3 s timeout → "Widget failed to load" fallback UI; explicit teardown on remove/import (remove node, null refs, invalidate nonce).
- **D-4.04:** Widget code stored in settings `{ html, css, js }` string fields (size-capped ~100 KB total) inside the existing validated config — reuses all three transports.

### PostMessage Bridge
- **D-4.05:** Handshake: parent injects per-widget nonce via srcdoc bootstrap; child posts `{type:'deskmate:ready', nonce}`; parent validates `event.source === iframe.contentWindow` AND nonce before replying with the API payload.
- **D-4.06:** DeskMate API = `{ theme: {accent}, size: {w,h}, config }` pushed on ready + `{type:'deskmate:update'}` on resize/theme/config change.
- **D-4.07:** `targetOrigin: "*"` both directions (opaque origin has no usable origin); ALL trust via source-reference + nonce validation on receive.
- **D-4.08:** Spoofing defense: ignore any message whose source ≠ that widget's iframe.contentWindow or nonce mismatch; parent never trusts child origin claims.

### BYOW Editor
- **D-4.09:** CodeMirror 6 via @uiw/react-codemirror, HTML/CSS/JS tabs (STACK.md).
- **D-4.10:** Live preview in the sandbox, debounced ~300 ms after edits.
- **D-4.11:** "Add Custom Widget" (edit mode) → sidebar drawer with tabs + preview + Save/Cancel; gear opens existing custom widgets.
- **D-4.12:** `addWidget('custom', {html,css,js})` reuses the existing store + transports; URL cap applies (file export for large code).

### Performance Budgets
- **D-4.13:** ≤ 8 custom-widget iframes on mobile / ≤ 20 desktop; beyond → add blocked with info toast.
- **D-4.14:** Lazy mounting via IntersectionObserver — offscreen custom widgets render a lightweight placeholder.
- **D-4.15:** Crash handling: frame load timeout + message errors → "Widget failed to load" fallback body; one bad widget never affects the app or others.
- **D-4.16:** Teardown guarantee: remove node, null renderer ref, invalidate nonce on remove/import/config-replace.

### Claude's Discretion
- srcdoc bootstrap details, exact nonce generation, CodeMirror theme/tabs, drawer layout, IntersectionObserver thresholds, size-cap values, error-message formats beyond the UI-SPEC.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/widgets/registry.tsx` — renderWidget dispatch; custom widgets get a registry entry whose render mounts the sandbox.
- `src/grid/WidgetFrame.tsx` — chrome (remove/settings gear) + --widget-accent binding; custom widgets reuse it.
- `src/grid/SettingsPopover.tsx` — generic settings fields; custom widget settings (code) use the drawer instead.
- `src/config/store.ts` — addWidget/updateWidget/removeWidget/importConfig — the BYOW flow writes through these.
- `src/grid/DashboardGrid.tsx` — renders via registry; custom widgets plug in as a type.
- `src/components/toastStore.ts` — info toasts for budget blocks/URL caps.

### Established Patterns
- Module-level stores, atomic store actions, zod single validation funnel, CSS Modules + custom properties, colocated tests.

### Integration Points
- `WIDGET_REGISTRY['custom']` → IframeWidgetRenderer (sandbox).
- Editor drawer saves via `updateWidget`/`addWidget`.
- Nonce + source-reference validation in a `useSandboxBridge` hook.
- `src/widgets/index.tsx` registers the custom type.

</code_context>

<specifics>
## Specific Ideas

No specific requirements beyond the roadmap goal + success criteria and the decisions above.

</specifics>

<deferred>
## Deferred Ideas

- Widget marketplace/community hub → future milestone (PROJECT.md).
- Per-widget CSP via iframe `csp` attribute → future hardening (baseline `allow-scripts` only for v1).
- GitHub OAuth/tokens → out of scope (PROJECT.md).

</deferred>
