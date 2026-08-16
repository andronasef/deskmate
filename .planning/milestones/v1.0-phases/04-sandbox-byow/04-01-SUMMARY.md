---
phase: 04-sandbox-byow
plan: 01
subsystem: research
tags: [srcdoc, sandbox, postmessage, opaque-origin, nonce, security]
requires:
  - phase: 03
    provides: registry render contract (custom widgets mount into it)
provides:
  - Verified srcdoc/sandbox/postMessage ground truth (opaque origin, event.source identity, escaping, base-URL trap, spoofing surface)
  - Bridge design decisions 04-02 implements verbatim (targetOrigin '*', validation order, constants)
affects: [phase 04 plan 02 (bridge), phase 05 (on-device cross-browser soak)]
requirements-completed: [BYOW-03, BYOW-04]

# Metrics
duration: 15min
completed: 2026-08-16
---

# Phase 4 Plan 01: Sandbox + postMessage Spike Summary

**Spec-derived verification of the security boundary's semantics — resolving the STATE.md Phase 4 research flag**

## Accomplishments
- `04-01-SPIKE.md` — observations: opaque origin with allow-scripts-only (parent sees origin "null", targetOrigin must be "*"); event.source identity as the only reliable check; `</script>` escaping rule; srcdoc base-URL trap (relative URLs resolve against host — document absolute-URL guidance; residual cookie-bearing-request risk noted with csp-attribute deferral); spoofing surface analysis (source + nonce beats origin strings)
- `04-01-FINDINGS.md` — 7 implementation decisions 04-02 consumes: targetOrigin "*", validation order (source → parse → nonce), escaping rule, per-widget nonce, no allow-same-origin, 3 s ready timeout, teardown contract + exact constants
- STATE.md flag RESOLVED (spec-derived; on-device cross-browser confirmation folded into Phase 5 soak)

## Files Created
- .planning/phases/04-sandbox-byow/04-01-SPIKE.md, 04-01-FINDINGS.md

## Next Phase Readiness
- 04-02 implements FINDINGS verbatim (constants, escaping, validation order)
---
*Phase: 04-sandbox-byow*
*Completed: 2026-08-16*
