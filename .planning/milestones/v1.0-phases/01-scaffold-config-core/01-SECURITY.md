---
phase: 01
slug: scaffold-config-core
status: verified
threats_open: 0
asvs_level: 1
created: 2026-08-16
---

# Phase 1 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| Browser localStorage | Persisted `DashboardConfig` blob (user's dashboard layout/config) | Low sensitivity — no secrets, no PII by design; corruption must never brick the app |
| npm supply chain | Dev/build-time dependencies (Vite 8, React 19, TS 6, zod, zustand, vitest…) | Toolchain integrity |

---

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-01-01 | Tampering | npm installs (all Phase 1 deps) | high | mitigate | Blocking-human package legitimacy checkpoint (plan 01-01 Task 1) verified every package + pinned version on npmjs.com before install; versions from STACK.md's npm-registry-verified table (2026-08-07); exact pins in package.json | closed |
| T-01-02 | Information disclosure | — | low | accept | No secrets exist in Phase 1: no API keys, no tokens, no user data, no storage access. Nothing to disclose | closed (accepted) |
| T-01-03 | Spoofing | — | low | accept | No identity or messaging surface in this phase (static shell only); postMessage/sandbox surface arrives Phase 4 | closed (accepted) |
| T-01-10 | Tampering | storage.ts loadConfig (JSON.parse of stored value) | high | mitigate | Every read path: try/catch JSON.parse + `validateConfig` (zod safeParse) before anything renders; never render or spread unvalidated data; adapter-only storage access — grep gate `localStorage` outside src/config/storage.ts → 0 in production (only test files seed/assert storage) | closed |
| T-01-11 | Tampering | prototype pollution via `__proto__`/`constructor` keys in stored JSON | high | mitigate | zod unknown-key strip (no `.passthrough()` — grep 0); parsed output is the only object ever spread into store state (merge validates first); schemas.test.ts asserts genuine `{"__proto__":...}` JSON-string seed yields no `__proto__`/`constructor`/`polluted` own keys | closed |
| T-01-12 | XSS | executable payloads smuggled via stored/imported config | high | mitigate | v1 schema has no code-bearing fields (settings is a data record; widget code is Phase 4 and ONLY ever goes to a sandboxed srcdoc iframe); app never uses dangerouslySetInnerHTML (grep → 0) or eval (grep → 0); schema caps widgets at 50 | closed |
| T-01-13 | Tampering | backup overwrite destroying the raw bad data | medium | mitigate | `backupRaw` writes-if-different (compares current backup content); backup written BEFORE any main-key overwrite; getItem/setItem methods only (never property access); recovery tests assert the exact raw bad string is preserved at `deskmate.config.backup` | closed |
| T-01-14 | Tampering | unvalidated config written back to storage | medium | mitigate | `saveConfig` only accepts the validated type; store merge validates before commit; persist serializes store state, which is always the validated object; on-disk key holds raw validated DashboardConfig | closed |
| T-01-SC | Tampering | npm/pip/cargo installs | high | mitigate | Blocking-human checkpoint (plan 01-01 Task 1, gate blocking-human) for all [ASSUMED] packages — never auto-approvable; plan 01-02 performs no installs | closed |

*Status: open · closed · open — below threshold (non-blocking)*
*Severity: critical > high > medium > low — only open threats at or above workflow.security_block_on count toward threats_open*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| R-01-1 | T-01-02 | No secret-bearing surface exists in Phase 1; information-disclosure risk is structural (nothing to disclose) | Orchestrator (autonomous) | 2026-08-16 |
| R-01-2 | T-01-03 | No identity/messaging surface yet — spoofing surface arrives with Phase 4 postMessage bridge, which will get its own threat register | Orchestrator (autonomous) | 2026-08-16 |

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-08-16 | 9 | 9 | 0 | Orchestrator (autonomous — subagent layer unavailable; inline verification with grep gates) |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-08-16
