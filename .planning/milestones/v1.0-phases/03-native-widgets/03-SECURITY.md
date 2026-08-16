---
phase: 03
slug: native-widgets
status: verified
threats_open: 0
asvs_level: 1
created: 2026-08-16
---

# Phase 3 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| GitHub API (api.github.com) | Public REST responses (repo metrics, commits) | Public data — but rate-limited and must never break the UI |
| localStorage `deskmate.github.*` | Cached repo data + ETags | Low sensitivity (public data) |
| Widget settings (config) | User-editable per-widget settings via popover | Untrusted-ish — validated shapes only |
| Web Audio | Chime oscillator output | None (no data crossing) |

---

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-03-10 | Tampering | registry/render contract — a bad widget type/definition | medium | mitigate | Unknown types render a graceful fallback (never crash the grid); definitions are statically registered (no dynamic injection); settings validated through schema + clamped fields | closed |
| T-03-11 | Tampering | settings popover writes unvalidated values into config | medium | mitigate | Number fields clamped (minutes 1-120); updates merge via `updateWidget` into the schema-validated config; schema re-validates on any persistence path | closed |
| T-03-12 | Tampering | zombie timers/intervals from widget lifecycle (Pomodoro) | medium | mitigate | Interval cleared on pause/reset/unmount (tested); unmount cleanup via effect; chime AudioContext closed after playback | closed |
| T-03-13 | Tampering/DoS | GitHub API responses: unexpected shapes, rate limits, network failures | high | mitigate | Responses parsed into a fixed shape (never spread raw API JSON into state); 403/429 → x-ratelimit parse + ≥3 min backoff (prevents lockout hammering); network error → stale cache/zeroed data (never throws); shared deduping client (one request per repo — respects the 60 req/hr budget); URL fixed to api.github.com (no user-supplied endpoints) | closed |
| T-03-14 | Information disclosure | cached GitHub data in localStorage | low | accept | Public repo data only (stars/issues/commit days — no tokens, no private data). GitHub OAuth explicitly out of scope (PROJECT.md) | closed (accepted) |

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| R-03-1 | T-03-14 | GitHub cache holds public repo metrics only; no credentials or private data by design | Orchestrator (autonomous) | 2026-08-16 |

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-08-16 | 5 | 5 | 0 | Orchestrator (autonomous — inline verification with grep gates) |

---

## Sign-Off

- [x] All threats have a disposition
- [x] Accepted risks documented
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-08-16
