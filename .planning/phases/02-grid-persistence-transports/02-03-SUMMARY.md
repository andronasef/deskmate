---
phase: 02-grid-persistence-transports
plan: 03
subsystem: research
tags: [url-limits, probe, request-line, deployment, lz-string]
requires:
  - phase: 02
    plan: 02
    provides: URL_CONFIG_CAP = 4096 in urlCodec.ts
provides:
  - Empirically verified URL request-line limit for the dev environment
  - Shipped probe page (public/probe-url-limit.html) for post-deploy re-probing
  - Confirmation that the 4 KB cap is safe (4× margin)
affects: [phase 05 (deploy + kiosk share links), deployment checklist]
requirements-completed: [CFG-04]

# Metrics
duration: 15min
completed: 2026-08-16
---

# Phase 2 Plan 03: URL Request-Line Probe Summary

**Empirically verified the host request-line limit and confirmed URL_CONFIG_CAP = 4096 is safe — closing the STATE.md research flag for Phase 2**

## Accomplishments
- `public/probe-url-limit.html` — dependency-free probe page: self-links with query params from 1 KB → 32 KB, measures `location.search.length` on load, renders "accepted: N bytes"; ships in the build for re-probing any deploy host
- Measured dev-server (Vite 8.2 / Node 22.12) limit: **accepts through 16,256 bytes, rejects at 16,320 (431)** — consistent with Node's 16 KB `--max-http-header-size` default
- `URL_CONFIG_CAP = 4096` confirmed safe with ~4× margin; no code change needed
- FINDINGS recorded in `02-03-FINDINGS.md` with the exact table, conclusion, and post-deploy re-probe instructions

## Files Created/Modified
- Created: public/probe-url-limit.html, .planning/phases/02-grid-persistence-transports/02-03-FINDINGS.md

## Decisions Made
- Probe environment = vite dev server (the only host available pre-deploy); FINDINGS explicitly marks "deploy-host probe pending post-deploy" and the probe page ships for that run
- Cap stays at 4096 (safe); the file-transport fallback (already built in plan 02-02) covers configs above the cap with the UI-SPEC info toast — graceful degradation, never a broken link

## Research Flag Resolution
- STATE.md flag: "deploy-host request-line limit unknown — probe with a long-query-param page (plan 02-03) before finalizing the URL size cap" → **RESOLVED for the dev environment** (measured 16 KB boundary); deploy-host portion becomes a post-deploy checklist item, not a code risk (cap has margin under every common host default: nginx 8 KB, CDNs 16 KB+)

## Next Phase Readiness
- Deploy checklist item: after first deploy, open `/probe-url-limit.html` on the production URL, click through lengths, record the boundary; if a host ever rejects below 4096, lower `URL_CONFIG_CAP` (single source of truth in urlCodec.ts)
---
*Phase: 02-grid-persistence-transports*
*Completed: 2026-08-16*
