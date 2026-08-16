# Phase 5 Plan 01: Wake Lock Device-Class Spike Notes

**Spiked:** 2026-08-16
**Scope:** Screen Wake Lock API behavior across target device classes (MDN Screen Wake Lock API — Baseline 2025, Mar 2025).

## Observations

### 1. Engine support (as of 2026)
| Engine | Version | Wake Lock |
|--------|---------|-----------|
| Chrome / Edge | 84+ | ✅ |
| Safari (iOS + macOS) | **16.4+** | ✅ |
| Safari < 16.4 | — | ❌ unsupported |
| Firefox (desktop) | 126+ | ✅ (partial earlier) |
| Firefox (Android) | — | ❌ (not shipped — falls back gracefully) |

### 2. Requirements & failure modes
- **Secure context only** (HTTPS or localhost) — `navigator.wakeLock` is undefined on plain HTTP.
- **`navigator.wakeLock.request('screen')`** returns a `WakeLockSentinel`; `.released` promise resolves when released; `release()` manually releases.
- **Auto-release:** the browser releases the sentinel when the **tab becomes hidden** (visibilitychange → hidden) — re-acquire on `visibilitychange → visible`.
- **Low Power Mode** (iOS) / battery saver (Android) → the request **rejects with `NotAllowedError`**.
- **Permissions-Policy** `screen-wake-lock` can block it (frame-embedded contexts).
- Wake lock only matters while the document is visible — hidden tabs get throttled regardless.

### 3. Re-acquire rule
- On `visibilitychange → visible`, if the app is in kiosk/fullscreen intent → `requestWakeLock()` again. The previous sentinel may already be released — requesting again returns a fresh sentinel.

## FINDINGS → implementation decisions

| # | Decision | Value |
|---|----------|-------|
| 1 | State machine | `inactive → active | unsupported | error`; sentinel release event → `inactive` |
| 2 | Fallback copy | "Screen awake unavailable" chip (UI-SPEC) — calm, non-blocking, app fully functional |
| 3 | Re-acquire | Single global `visibilitychange` handler: visible + kiosk intent → request |
| 4 | Test strategy | Stub `navigator.wakeLock` (supported/unsupported/rejecting); simulate visibilitychange via `document.dispatchEvent` |
| 5 | Fullscreen coupling | Toggle enters fullscreen + requests wake lock together; `fullscreenchange → false` releases (D-5.04) |
| 6 | STATE.md flag | "wake-lock behavior on target device classes … needs a spike + on-hardware verification (plan 05-01)" → **RESOLVED** for behavior; on-hardware verification folds into the 05-02 soak |
