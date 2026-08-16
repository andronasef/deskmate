# Phase 4 Plan 01: Sandbox + postMessage Spike Notes

**Spiked:** 2026-08-16
**Scope:** Verify srcdoc + sandbox(allow-scripts) + postMessage semantics that the 04-02 bridge depends on.
**Method:** Spec + MDN + HTML Standard analysis; behaviors are spec-determined and stable across engines. Cross-browser on-device confirmation is folded into the Phase 5 on-hardware soak (STATE.md).

## Observations

### 1. Opaque origin with `sandbox="allow-scripts"` + srcdoc
- An iframe with `sandbox="allow-scripts"` (no `allow-same-origin`) has an **opaque origin** (HTML Standard §7.5: sandboxed origin browsing context flag → "unique opaque origin").
- srcdoc documents additionally use `about:srcdoc` — but the sandbox flag forces the opaque origin regardless.
- Consequence: from the parent's perspective, any postMessage from the frame arrives with `event.origin === "null"`. **`targetOrigin` must be `"*"`** in both directions — there is no origin string to target, and `"null"` as a targetOrigin string is unreliable across engines.
- `window.parent` access from inside an opaque-origin frame is blocked (`SecurityError`), and `window.top` likewise — the widget cannot script the host even if it had a reference.

### 2. `event.source` is the only reliable identity
- The parent receives `event.source` = the exact `WindowProxy` that sent the message. For our iframe that is `iframe.contentWindow` — and this reference comparison is **identity-based**, not origin-based.
- Validation order (04-02 implements): **1)** `e.source === iframe.contentWindow` (identity) → **2)** parse `e.data` safely → **3)** `data.nonce === this.nonce` (secret). If any fails → ignore. No origin-string checks anywhere.

### 3. srcdoc `</script>` escaping is mandatory
- The srcdoc is one HTML document. Any literal `</script>` inside a user-provided JS string embedded in our bootstrap `<script>` terminates it → arbitrary HTML/JS injection INTO THE BOOTSTRAP DOC (still sandboxed, but the API shim/nonce could be clobbered and the ready handshake forged within that frame).
- Escaping rule: in any JS string literal we emit, replace `</script` → `<\/script` (and `<!--` → `\u003C!--` for HTML-comment safety). Since user code runs in a separate `<script>` tag of its own, only OUR injected strings need escaping — but we escape every embedded value defensively.
- Additionally, user HTML in `<body>` cannot contain a literal `</script>` OUTSIDE a script context (it would still close the final script tag if unclosed in user html) — so the whole srcdoc build runs through the same escape.

### 4. srcdoc base-URL trap (PITFALLS.md)
- srcdoc documents use the **embedding document's URL as their base URL** (about:srcdoc resolution). A widget's relative URLs (e.g. `<img src="/logo.png">`) resolve against the HOST origin.
- With `allow-scripts` only, the widget CANNOT read responses (fetch/XHR from an opaque origin to any origin fails CORS anyway — the opaque origin can't be a credentialed origin). The risk is limited to *requests being made to the host's origin with cookies* (e.g. `<img src="/api/...">` would send the host's cookies).
- Mitigation documented for widget authors: use absolute URLs. Baseline `allow-scripts`-only already prevents response reading; cookie-bearing requests to the host origin are the residual risk → note for the 04-02 doc comments + PITFALLS. (A future `csp` attribute can block it; deferred.)

### 5. Spoofing surface
- An attacker-controlled page cannot inject a `deskmate:ready` message because: (a) its `window` is not our iframe's `contentWindow` (source check fails), and (b) it doesn't know the per-widget nonce (secret check fails). The nonce lives only inside the srcdoc bootstrap string (opaque-origin document, unreadable from outside).
- Cross-frame messaging from the app's own code is the only path that carries the nonce, and it's generated per-widget at mount.

## Open Items / Caveats
- Safari quirk watch: older Safari treated `srcdoc` + sandbox edge cases inconsistently; modern Safari (16.4+) matches the spec. Confirm during the Phase 5 soak (STATE.md on-hardware verification).
- `crypto.getRandomValues` is available in all target browsers (secure context + localhost).
