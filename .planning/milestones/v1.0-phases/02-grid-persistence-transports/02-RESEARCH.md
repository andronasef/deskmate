# Phase 2: Grid, Persistence & Config Transports — Research

**Researched:** 2026-08-16
**Source:** npm registry + node_modules inspection (RGL v2.2.4, lz-string 1.5.0), STACK.md, Phase 1 codebase

## 1. react-grid-layout v2 (2.2.4) — verified API surface

- **Exports:** `react-grid-layout` (core), `./react` (React bindings), `./extras`, `./legacy` (v1 compat), `./css/styles.css`. Tree-shakeable modular imports.
- **Hooks API (v2):** `useContainerWidth` (container width via ref, **`mounted`-gated** — returns width only after first layout effect, avoiding measure-on-mount flash; matches decision D-2.08), `useResponsiveLayout` (breakpoint-driven responsive layout state + setters).
- **Composable config:** `gridConfig` (columns/rowHeight/margin/containerPadding), `dragConfig`, `compactor` (layout compaction), `positionStrategy` (free-form kiosk layouts — not needed for the tiled v1 grid, but available).
- **Serializable/restorable layouts:** v2 layout shape is `{ breakpoint: LayoutItem[] }` — exactly the `LayoutMap` type already in `src/config/types.ts` (D-04). Round-trip safe.
- **Responsive breakpoints:** defaults lg 1200/12, md 996/10, sm 768/6, xs 480/4, xxs 0/2 (decision D-2.05).
- **React 19 + StrictMode compatible** (v2 officially targets React 18+, verified).
- **CSS:** `react-grid-layout/css/styles.css` + `react-resizable/css/styles.css` (react-resizable is a bundled dependency — do NOT install separately).
- **Peer deps:** react >= 16.3 (React 19.2.8 ✓).

**Key risk:** v2 is a recent rewrite (Dec 2025) — the hooks API is the primary surface. Executor must read the installed package README for exact hook signatures before implementing. `legacy` export exists as fallback if hooks prove insufficient (avoid unless blocked).

## 2. lz-string 1.5.0 — verified

- `compressToEncodedURIComponent` / `decompressFromEncodedURIComponent` round-trip verified locally (URI-safe, URL-legal charset).
- Dependency-free, dormant but stable — appropriate leaf util for the `?config=` transport (CFG-04, D-2.11).

## 3. URL request-line limits (STATE.md research flag)

- **Known limits:** nginx default `large_client_header_buffers` 8 KB; common CDNs (CloudFront, Cloudflare) allow long query strings on GET (16 KB+); some corporate proxies cut at 4–8 KB. Mobile carriers vary.
- **Design response:** hard cap ≈ 4 KB compressed payload (D-2.12) → safely under all common host limits. Above cap: export-to-file fallback with info toast. Plan 02-03 builds a probe page to empirically verify the *deploy host's* limit (unknown until deployed) and record the result in the plan's findings.
- **Encoding note:** lz-string URI-safe output is ~1.4x the raw base64-ish size; a 4 KB cap ≈ ~2.8 KB raw JSON — enough for the seeded 3-widget config (~1–2 KB raw), tight but workable for typical v1 configs. If larger configs are needed later, the file transport is the answer (per STACK.md pattern: prefer file export for large configs).

## 4. Existing code reuse (Phase 1)

- `useConfigStore` — add `addWidget` / `removeWidget` / `setLayout` / `updateWidget` actions; persist already writes raw config on every state change (debounce to 500 ms per D-2.13).
- `validateConfig` / `dashboardConfigSchema` — the single validation funnel for all three transports (D-2.09…2.12).
- `backupRaw` — reuse for import-before-replace backup (D-2.10) and URL "Save to my dashboard" (D-2.11).
- `defaultConfig()` — extend to seed per-breakpoint `layout` for the 3 widget instances (D-2.07); keep fresh-object-per-call semantics.
- `sanitizeLayout` (new) — dedupe keys, clamp w/h, drop items missing required fields (D-2.14, success criterion 5).

## 5. Dependencies to install (Phase 2)

- `react-grid-layout@2.2.4` (runtime)
- `lucide-react@1.29.x` (runtime, chrome icons)
- `lz-string@1.5.0` (runtime — already present in node_modules but not in package.json dependencies; add explicitly)
- No new dev deps.
