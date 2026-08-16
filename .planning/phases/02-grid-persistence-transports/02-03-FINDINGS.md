# Phase 2 Plan 03: URL Request-Line Limit — Empirical Findings

**Probed:** 2026-08-16
**Probe page:** `public/probe-url-limit.html` (dependency-free, ships in the build for post-deploy re-probing)

## Environment Tested

| Property | Value |
|----------|-------|
| Host | Vite 8.2.1 dev server (`npm run dev -- --port 5199`) |
| Node | 22.12.0 (default `--max-http-header-size` = 16 KB) |
| Method | curl GET with `?probe=<n>&payload=aaaa…` (n bytes) |

## Measured Results

| Payload (bytes) | HTTP result |
|-----------------|-------------|
| 1 024 | 200 ✓ |
| 4 096 | 200 ✓ |
| 6 144 | 200 ✓ |
| 8 192 | 200 ✓ |
| 10 240 | 200 ✓ |
| 12 288 | 200 ✓ |
| 14 336 | 200 ✓ |
| 15 360 | 200 ✓ |
| 15 872 | 200 ✓ |
| 16 128 | 200 ✓ |
| 16 256 | 200 ✓ |
| 16 320 | 431 ✗ (Request Header Fields Too Large) |

## Conclusions

1. **Measured request-line limit (dev server):** between 16,256 and 16,320 bytes — consistent with Node's 16 KB (16,384-byte) `--max-http-header-size` default minus request-line overhead (`GET /probe-url-limit.html?… HTTP/1.1` + Host header ≈ 60-70 bytes).
2. **`URL_CONFIG_CAP = 4096` is SAFE for this environment** — 4× margin below the measured limit. No change needed.
3. **Deploy-host probe pending post-deploy:** nginx defaults (`large_client_header_buffers` 8 KB) and CDN limits vary. The probe page ships in `public/` so anyone can re-run it on the deployed URL: open `/probe-url-limit.html`, click through the length table, record the first failing length. If a production host ever rejects below 4096, lower `URL_CONFIG_CAP` in `src/config/urlCodec.ts` accordingly (it is the single source of truth for the cap).
4. **Transport posture unchanged:** above the cap the app falls back to JSON-file export with the info toast (D-2.12) — the file transport has no length limit, so the Core Value ("one URL renders the config") degrades gracefully, never breaks.

## Artifacts

- `public/probe-url-limit.html` — probe page (shipped)
- `src/config/urlCodec.ts` — `URL_CONFIG_CAP = 4096` (unchanged, confirmed safe)
