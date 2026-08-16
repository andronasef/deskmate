---
phase: 03-native-widgets
plan: 03
subsystem: api
tags: [github-api, etag, rate-limit, stale-while-revalidate, deduping, backoff, localstorage-cache]
requires:
  - phase: 03
    plan: 01
    provides: registry render contract
provides:
  - Deduping GitHub client: ETag/304 conditional requests, stale-while-revalidate localStorage cache, x-ratelimit parsing, ≥3 min adaptive backoff
  - GitHub Pulse widget: stars / open issues / 7-day commit streak + status footer (Updated / Rate limited / No data yet)
  - Failure-tolerant live data (WID-04): stale data renders on network failure — never a broken UI
affects: [phase 04 (sandbox example widget), phase 05 (kiosk network tolerance)]
requirements-completed: [WID-03, WID-04]

# Metrics
duration: 40min
completed: 2026-08-16
---

# Phase 3 Plan 03: GitHub Pulse Summary

**The failure-tolerant live-data widget (WID-03/WID-04): shared deduping client with ETag caching and rate-limit backoff — "if everything else fails, this must work"**

## Accomplishments
- `src/widgets/github.ts` — `fetchRepoWithCache` (ETag/If-None-Match + If-Modified-Since conditional requests; 304 → cached body; 403/429 → x-ratelimit parsing + `backoffUntil = max(3 min, reset)`; network error → stale cache marked `stale`; never throws), module-level in-flight dedupe map (one fetch per repo shared across widgets), session backoff map, localStorage cache `deskmate.github.<owner>/<repo>` (stale-while-revalidate), `parseRepoRefs` (comma/space list sanitizer), `useGitHubRepos` (5-min refresh respecting backoff, abort on unmount), `__resetGitHubClient` (test-only)
- `src/widgets/githubPulse.tsx` — per-repo rows (owner/repo, ★ stars, open issues, 🔥 7-day commit days), per-metric '—' fallback, status footer: "Updated HH:MM" / "Rate limited — showing cached data" (destructive tint) / "No data yet", ellipsis-truncated repo names, accent icons via --widget-accent
- Registered in WIDGET_REGISTRY (settingsFields: Repos text; default `facebook/react`)

## Files Created/Modified
- Created: src/widgets/{github.ts, githubPulse.tsx, githubPulse.module.css, githubPulse.test.tsx}
- Modified: src/widgets/index.tsx (registration)

## Decisions Made
- Backoff is session-scoped (in-memory), not persisted — a reload allows a fresh attempt (rate-limit reset is typically within an hour anyway)
- Cache stores normalized metrics + etag, not raw responses — the widget renders from one shape
- Commit streak = distinct commit days in the last 7 days (best-effort; failure → 0, per-metric graceful failure D-3.16)
- Ref-stability: `parseRepoRefs` memoized in the widget so the hook's effect doesn't abort/refetch per render (found via test — fixed with useMemo)

## Tests
- githubPulse.test.tsx: fetch+cache+streak, 304 reuses cache, 403 → rateLimited + backoff ≥3min + stale data, network error → stale cache, no-cache+error → graceful zero, parseRepoRefs sanitizer, widget states (stars/issues/streak render, rate-limited indicator with stale values, no-data-yet, no-repos)
- Module state isolation via `__resetGitHubClient` in beforeEach (backoff leak across tests fixed)

## Next Phase Readiness
- GitHub Pulse doubles as the Phase 4 sandbox example (a live-data custom widget template)
- The client's staleness pattern is the reference for any future network widget
---
*Phase: 03-native-widgets*
*Completed: 2026-08-16*
