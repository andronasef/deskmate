---
phase: 02
slug: grid-persistence-transports
status: verified
threats_open: 0
asvs_level: 1
created: 2026-08-16
---

# Phase 2 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| Browser localStorage | Persisted `DashboardConfig` (layout, widget settings) | Low sensitivity — no secrets/PII by design |
| Imported JSON file | User-supplied config file (CFG-02/03) | Untrusted input — must be validated before state commit |
| Display URL `?config=` | lz-string payload from any source (CFG-04) | Untrusted input — decoded, sanitized, validated before render |
| Grid store → RGL | Layout data into the grid engine | Must be schema-valid + sanitized — a bad layout must never break the grid |

---

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-02-10 | Tampering | importConfigFromFile (JSON parse of user file) | high | mitigate | `sanitizeConfig` mends malformed shapes → `validateConfig` (zod, inherited unknown-key strip) → `sanitizeLayout` prunes ghost/dup/clamped items → only then `importConfig`. Any failure returns a reason; current config untouched (tested). setLayout also validates-before-commit (store.test) | closed |
| T-02-11 | Tampering | prototype pollution via `__proto__`/`constructor` in imported/URL JSON | high | mitigate | zod unknown-key strip (no `.passthrough()` — grep 0); parsed objects never spread into state unvalidated; Phase 1 schemas.test still asserts genuine `{"__proto__":...}` seeds yield no pollution; sanitizeConfig operates on JSON.parse output only | closed |
| T-02-12 | XSS | executable payloads in URL/imported config rendering in the app DOM | high | mitigate | v1 schema has no code-bearing fields (widget bodies are Phase 3/4 and ONLY render in a sandboxed iframe); app never uses dangerouslySetInnerHTML / innerHTML / eval (grep gates all 0); widget bodies render as static names | closed |
| T-02-13 | Tampering | display URL silently overwriting the user's stored config | medium | mitigate | `?config=` is a pure render override — never writes storage; commit happens only via the banner's explicit "Save to my dashboard", which backs up the raw current blob first (backupRaw) before `importConfig` | closed |
| T-02-14 | Information disclosure | exported JSON / shared URL exposing settings | low | accept | Settings are widget preferences only (no secrets by design — no API keys/tokens in v1; GitHub uses public unauthenticated API). Exported raw DashboardConfig is the intended transport format | closed (accepted) |
| T-02-15 | DoS | oversized URL payload (request-line exhaustion) | medium | mitigate | `URL_CONFIG_CAP = 4096` enforced on encode AND decode; over-cap payloads → null → file-transport fallback with info toast; empirically probed dev-server boundary is ~16 KB (FINDINGS) — 4× margin | closed |
| T-02-SC | Tampering | npm installs (react-grid-layout 2.2.4, lucide-react, lz-string) | high | mitigate | Versions from STACK.md's npm-registry-verified table; exact pins in package.json; npm audit 0 vulnerabilities post-install | closed |

*Status: open · closed · open — below threshold (non-blocking)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| R-02-1 | T-02-14 | Export/URL transports carry widget settings by design; no secret-bearing surface exists in the config contract (verified: schema has no credential fields; GitHub widget uses public API) | Orchestrator (autonomous) | 2026-08-16 |

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-08-16 | 7 | 7 | 0 | Orchestrator (autonomous — inline verification with grep gates) |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-08-16
