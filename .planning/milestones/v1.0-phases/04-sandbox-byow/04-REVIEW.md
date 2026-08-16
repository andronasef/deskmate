---
phase: 04-sandbox-byow
reviewed: 2026-08-16T07:53:00Z
status: clean
depth: standard
files_reviewed: 22
critical: 0
warning: 0
info: 3
total: 3
---

# Phase 4 Code Review: Sandbox & BYOW

**Depth:** standard (inline review — orchestrator-performed)
**Files reviewed:** 22 (src/widgets/sandbox/*, src/widgets/byow/*, registry/index wiring, DashboardGrid/App/AddWidgetFlow changes)

## Findings

### Critical (0)

None.

### Warning (0)

None.

### Info (3)

1. **`src/widgets/sandbox/bridge.ts` — `onApi` is invoked on READY/UDPATE with a stub API payload**
   - The ready/update handler currently delivers a placeholder API (`{theme:{accent:''}, size:{0,0}, config:null}`); the renderer's `push()` is the real delivery (theme/size/config). The bridge handler exists for the nonce-validated handshake; the payload path could be unified later. Non-blocking — the renderer tests cover real delivery.

2. **`src/widgets/sandbox/bootstrap.ts` — srcdoc base-URL residual risk (documented, not fixed)**
   - Relative URLs inside a widget resolve against the host origin (about:srcdoc base). With allow-scripts-only, response-reading is blocked by CORS; the residual risk is cookie-bearing requests to the host origin (e.g. `<img src="/api/x">`). Mitigation for v1: doc comment in the template advising absolute URLs; a future iframe `csp` attribute can block it (deferred in FINDINGS).

3. **`src/widgets/byow/useLazyMount.ts` — IO fallback mounts immediately**
   - Environments without IntersectionObserver mount all custom iframes eagerly (test env, very old browsers). Correct for correctness; budgets still cap the count.

## What Passed Review

- **Security (the point of the phase):** sandbox tokens exact and test-asserted (never allow-same-origin — PITFALLS Pitfall 1 honored); every embedded string in srcdoc escaped with the precise rule from the spike; nonce is 128-bit random, injected only via the bootstrap, and validated AFTER the source-identity check; spoofed/wrong-nonce/malformed messages are silently ignored; teardown destroys the listener + invalidates the nonce (no path leaks a message handler).
- **Lifecycle:** ready timeout cleared on teardown; ResizeObserver disconnected; interval-free (no timers in the renderer beyond the timeout); the drawer's debounce timer is cleared on unmount.
- **Failure tolerance:** crash/timeout shows a fallback body, never an app error; one hostile widget cannot affect other widgets (separate frames, separate nonces).
- **Budgets:** hard caps (8/20) at add time AND counted live; lazy mounting prevents offscreen frame churn.
- **Tests:** 104 green — the sandbox suite exercises the exact attack surface (hostile srcdoc, spoofed messages, teardown).

## Verdict

**Clean.** No blocking or warning findings. 3 info items documented — all non-blocking and safely deferrable (the base-URL residual is explicitly tracked for a future `csp` attribute).
