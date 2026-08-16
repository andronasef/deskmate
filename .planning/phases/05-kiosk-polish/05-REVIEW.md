---
phase: 05-kiosk-polish
reviewed: 2026-08-16T08:13:00Z
status: clean
depth: standard
files_reviewed: 18
critical: 0
warning: 0
info: 3
total: 3
---

# Phase 5 Code Review: Kiosk & Polish

**Depth:** standard (inline review — orchestrator-performed)
**Files reviewed:** 18 (src/kiosk/*, App/store/githubPulse/IframeWidgetRenderer wiring, manifest, icons, soak doc)

## Findings

### Critical (0)

None.

### Warning (0)

None.

### Info (3)

1. **`src/kiosk/useKiosk.ts` — the exit-symmetry effect releases the wake lock on initial mount**
   - `useEffect(() => { if (!fullscreen) releaseWakeLock() }, [fullscreen])` runs on mount when fullscreen is false → an unnecessary `releaseWakeLock()` (no-op when no sentinel exists). Harmless; could gate on a `hasMountedRef` for cleanliness. Non-blocking.

2. **`src/kiosk/wakeLock.ts` — sentinel auto-release detection uses `released.then`**
   - The `.released` promise wiring marks 'inactive' when the browser auto-releases (tab hidden). If the app re-acquires on visibilitychange before the promise resolves, the guard (`sentinel === next`) prevents a stale emit. Verified correct; worth a comment (present). Non-blocking.

3. **`src/kiosk/soak.ts` — rAF EMA starts with a default 16 ms frame**
   - The initial EMA biases the first seconds toward 60 fps before real deltas dominate. Cosmetic (diagnostics only).

## What Passed Review

- **Correctness:** wake-lock state machine complete (inactive/active/unsupported/error); re-acquire exactly-once tested; fullscreen coupling + exit symmetry; sentinel release guard prevents stale-state overwrites.
- **Resilience:** every unsupported/rejected path returns a state + chip, never a throw; matchMedia/ResizeObserver guarded or polyfilled in tests; the narrow-view switch is reactive (resize restores the grid).
- **Security:** no new surfaces (wake lock/fullscreen are browser-gated APIs); statusStore holds no sensitive data; manifest has no permissions.
- **Tests:** 118 green incl. wake-lock (6), kiosk views/chips (7), PWA manifest/icons (3); App suite adapted with matchMedia polyfill.

## Verdict

**Clean.** No blocking or warning findings. 3 info items — all cosmetic/non-blocking.
