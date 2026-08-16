---
phase: 04-sandbox-byow
plan: 02
subsystem: security
tags: [sandbox, iframe, srcdoc, postmessage, nonce, bridge, teardown]
requires:
  - phase: 04
    plan: 01
    provides: bridge ground truth (targetOrigin '*', validation order, escaping)
provides:
  - Sandboxed iframe renderer: EXACT sandbox='allow-scripts' + no-referrer + escaped srcdoc bootstrap
  - Source+nonce validated postMessage bridge (spoofed messages ignored)
  - Lifecycle: ready handshake + 3 s timeout → crash fallback; explicit teardown (no zombies)
affects: [phase 04 plan 03 (editor uses the renderer for live preview), phase 05 (kiosk)]
requirements-completed: [BYOW-03, BYOW-04, BYOW-05]

# Metrics
duration: 45min
completed: 2026-08-16
---

# Phase 4 Plan 02: Sandbox Contract + Bridge Summary

**The security boundary of the BYOW ecosystem (BYOW-03/04/05) — implemented exactly per the 04-01 spike findings**

## Accomplishments
- `src/widgets/sandbox/constants.ts` — `SANDBOX_TOKENS = 'allow-scripts'` (exact, single source), `READY_TIMEOUT_MS = 3000`, `BRIDGE_TYPES`, `generateNonce()` (128-bit hex, crypto.getRandomValues + fallback)
- `src/widgets/sandbox/bootstrap.ts` — `escapeScriptTags` (neutralizes `</script`/`</style`/`<!--` — NOT ordinary closers like `</p>`; `\/` is semantically neutral in JS strings), `buildSrcdoc` (full doc: bootstrap injects `__DESKMATE_NONCE__` + `window.deskmate` API shim; user css in `<style>`, html in `<body>`, js in final `<script>`), `apiMessage`
- `src/widgets/sandbox/bridge.ts` — `SandboxBridge`: validation order source → safe-parse → nonce → act; `push()` posts API payloads with targetOrigin '*'; `destroy()` removes listener + invalidates
- `src/widgets/sandbox/IframeWidgetRenderer.tsx` — renderer with loading/ready/crashed states; sandbox attribute exactly 'allow-scripts' + referrerPolicy no-referrer; ready handshake → API push (theme, size via ResizeObserver, config); 3 s timeout → "Widget failed to load"; unmount → bridge.destroy + timer clear + observer disconnect (no zombies)
- Registered `custom` in WIDGET_REGISTRY → IframeWidgetRenderer

## Files Created/Modified
- Created: src/widgets/sandbox/{constants.ts, bootstrap.ts, bridge.ts, IframeWidgetRenderer.tsx, IframeWidgetRenderer.module.css} + 4 test files
- Modified: src/widgets/registry.tsx, src/widgets/index.tsx (custom registration)

## Decisions Made
- srcdoc escaping neutralizes ONLY dangerous closers (`</script`/`</style`) — ordinary HTML closers pass through (a naive all-`</` escape broke user HTML; caught by test)
- Nonce as lazy state (readable during render, stable for life) instead of a ref — satisfies the react-hooks refs rule
- Lifecycle effect keyed on memoized srcdoc (fresh-string-per-render caused effect churn — caught by test)

## Tests
- constants.test (exact tokens — never allow-same-origin; nonce format/uniqueness; contract values)
- bootstrap.test (escaping: hostile `</script>` neutralized, ordinary `</p>` preserved; nonce injection; API shim + ready handshake present)
- bridge.test (valid source+nonce accepted; wrong source ignored; wrong nonce ignored; malformed ignored without throwing; destroy removes listener; push → targetOrigin '*')
- lifecycle.test (sandbox attr exact; hostile code can't break srcdoc; loading → crash after 3 s; ready handshake flips state; unmount teardown — no leaked handlers)

## Next Phase Readiness
- 04-03's BYOW drawer reuses IframeWidgetRenderer for the live preview and mounts real custom widgets through the registry
---
*Phase: 04-sandbox-byow*
*Completed: 2026-08-16*
