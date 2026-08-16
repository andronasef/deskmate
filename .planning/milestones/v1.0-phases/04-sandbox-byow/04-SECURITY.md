---
phase: 04
slug: sandbox-byow
status: verified
threats_open: 0
asvs_level: 1
created: 2026-08-16
---

# Phase 4 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| Sandboxed iframe (opaque origin) | Untrusted widget code (HTML/CSS/JS) | None by default — only the nonce-validated DeskMate API payloads |
| postMessage bridge | theme/size/config updates parent ↔ widget | Trusted only after source + nonce validation |
| Widget settings (config) | html/css/js code strings | Untrusted input — size-capped, escaped, sandboxed |
| Host app DOM/state | The React app | MUST be unreachable from widget code |

---

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-04-01 | Escalation | iframe sandbox — allow-same-origin combination | critical | mitigate | `SANDBOX_TOKENS = 'allow-scripts'` EXACTLY (PITFALLS Pitfall 1); exact-attribute unit test asserts no allow-same-origin/forms/popups/top-navigation; single source constant | closed |
| T-04-02 | Injection | srcdoc `</script>` breakout clobbering bootstrap/nonce | critical | mitigate | `escapeScriptTags` neutralizes `</script`/`</style`/`<!--` in every embedded string (tested with hostile input); nonce only inside the opaque-origin doc | closed |
| T-04-03 | Spoofing | forged deskmate:ready/update messages | high | mitigate | Bridge validates `event.source === iframe.contentWindow` FIRST then the per-widget nonce; wrong source/nonce/malformed silently ignored (tested) | closed |
| T-04-04 | Data exfiltration | widget reading host localStorage/cookies/state | high | mitigate | Opaque origin (no allow-same-origin) → no storage access, no same-origin fetch; srcdoc base-URL trap documented (absolute-URL guidance; residual cookie-bearing-request risk accepted, csp attribute deferred) | closed |
| T-04-05 | DoS | zombie iframes/timers/handlers accumulating | medium | mitigate | Explicit teardown: bridge.destroy (listener removed + nonce invalidated), ready-timeout cleared, ResizeObserver disconnected, debounce cleared (tested — no leaked handlers); per-device iframe budgets (8/20) cap frame count; lazy mounting limits offscreen frames | closed |
| T-04-06 | Tampering | code-size / storage abuse | medium | mitigate | 100 KB code cap documented (UI-SPEC); settings strings validated through the schema; budget toasts block over-limit adds | closed |

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| R-04-1 | T-04-04 | Widgets using relative URLs could trigger cookie-bearing requests to the host origin (response reading is blocked by CORS on the opaque origin). Template doc comment advises absolute URLs; a future iframe `csp` attribute closes this entirely (tracked in 04-01-FINDINGS). | Orchestrator (autonomous) | 2026-08-16 |

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-08-16 | 6 | 6 | 0 | Orchestrator (autonomous — inline verification with grep gates) |

---

## Sign-Off

- [x] All threats have a disposition
- [x] Accepted risks documented
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-08-16
