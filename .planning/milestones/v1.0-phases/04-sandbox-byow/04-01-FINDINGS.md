# Phase 4 Plan 01: Spike Findings — Bridge Ground Truth

**Resolved:** 2026-08-16
**STATE.md flag:** "multi-browser postMessage + srcdoc behavior (opaque origins, nonce handshake, `targetOrigin "*"`) needs a spike before the bridge is implemented (plan 04-01)" → **RESOLVED** (spec-derived; on-device cross-browser confirmation folded into Phase 5 soak).

## Conclusions 04-02 MUST implement

| # | Decision | Evidence (04-01-SPIKE.md) |
|---|----------|---------------------------|
| 1 | `targetOrigin: "*"` for BOTH directions — never a specific origin, never rely on `event.origin` | Opaque origin → parent sees `origin === "null"`; no targetable origin exists |
| 2 | Identity check FIRST: `e.source === iframe.contentWindow`; only then parse + nonce-check | `event.source` is the only reliable identity (reference equality, not origin) |
| 3 | Escape EVERY embedded string in srcdoc: `</script` → `<\/script`, `<!--` → `\u003C!--` | Literal `</script>` terminates the bootstrap script (forgery within the frame) |
| 4 | Per-widget nonce (≥128-bit, crypto.getRandomValues) injected ONLY via the srcdoc bootstrap; unknown nonce ⇒ ignore | Secret lives in an unreadable opaque-origin document; attacker can't know it |
| 5 | Validation order in the bridge handler: source → parse (try/catch) → nonce → act | Spoofing surface analysis (SPIKE §5) |
| 6 | No `allow-same-origin` ever; srcdoc base-URL trap documented for authors (absolute URLs) | PITFALLS Pitfall 1 + SPIKE §4 (residual cookie-bearing-request risk noted; `csp` attribute deferred) |
| 7 | Ready timeout 3 s → crash fallback; bridge.destroy() removes listener + invalidates nonce on teardown | Lifecycle contract (D-4.03/4.16) |

## Constants for 04-02
- `SANDBOX_TOKENS = 'allow-scripts'` (exact)
- `READY_TIMEOUT_MS = 3000`
- `BRIDGE_TYPES = { READY: 'deskmate:ready', UPDATE: 'deskmate:update', API: 'deskmate:api' }`
- `NONCE_LENGTH = 32` hex chars (128 bits)
