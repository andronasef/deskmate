---
phase: 05
slug: kiosk-polish
status: verified
threats_open: 0
asvs_level: 1
created: 2026-08-16
---

# Phase 5 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| Fullscreen API | Browser-gated display mode | None (UI state only) |
| Screen Wake Lock API | Browser-gated sentinel | None (display state only) |
| Status store | Aggregated failure/stale/wake-lock flags | Non-sensitive UI state |
| PWA manifest | Static metadata | None |

---

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-05-01 | DoS | wake-lock request loops on unsupported/rejected devices | medium | mitigate | Rejection → 'error' terminal state (no retry loop); re-acquire only on visibilitychange when fullscreen intent; unsupported detected before requesting | closed |
| T-05-02 | Tampering | sentinel state desync (auto-release vs re-acquire) | medium | mitigate | `sentinel === next` guard prevents a stale auto-release from overwriting a fresh re-acquired state; tested | closed |
| T-05-03 | Information disclosure | status chips leaking device capability info | low | accept | Chips reveal wake-lock support (public device capability); no user data exposed | closed (accepted) |
| T-05-04 | Tampering | PWA manifest metadata | low | accept | Static file; no install-time code execution; icons are bundled assets | closed (accepted) |

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| R-05-1 | T-05-03 | Wake-lock support is a public device capability — the chip leaks nothing private | Orchestrator (autonomous) | 2026-08-16 |
| R-05-2 | T-05-04 | Manifest is inert metadata; PWA install adds no privilege beyond the web page | Orchestrator (autonomous) | 2026-08-16 |

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-08-16 | 4 | 4 | 0 | Orchestrator (autonomous) |

---

## Sign-Off

- [x] All threats have a disposition
- [x] Accepted risks documented
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-08-16
