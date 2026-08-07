# Walking Skeleton — DeskMate

**Phase:** 1
**Generated:** 2026-08-07

## Capability Proven End-to-End

A user opens the DeskMate URL on any device (dev server or any static host) and boots into a working dark dashboard shell whose boot path loads a single validated `DashboardConfig` from localStorage — recovering to factory defaults (with the raw data preserved under a backup key) when the stored config is corrupt, invalid, or from a mismatched version, and never showing a blank or broken screen.

## Architectural Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Framework | React 19.2 + Vite 8.2 (Rolldown) + TypeScript ~6.0.3, static client-only SPA | Locked by research (STACK.md). Vite 8 is the current major; TS pinned ~6.0.3 because typescript-eslint@8.66's peer range is `<6.1.0` (TS 7 breaks lint). No backend by design — the product IS a static bundle |
| Routing | None — single-page; view modes derived from state, only `?config=` query params (Phase 2) | ARCHITECTURE.md Anti-Pattern 7: a kiosk has one screen; URL paths fight the share-URL story |
| State | zustand 5 single config store (`useConfigStore`), one immutable `DashboardConfig` object | Pattern 1: all mutation is named actions; bridge code (Phase 4) needs `getState()`/`subscribe()` outside React; whole app state = one serializable blob |
| Validation | zod 4 single schema (`validateConfig`) on every load path | Pattern 4 "one schema, three transports"; the schema IS the contract with users and future versions; strip behavior kills prototype-pollution vectors |
| Data layer | localStorage via a custom safe adapter (`storage.ts`), versioned key `deskmate.config.v1`, raw backup key `deskmate.config.backup`, `storageAvailable()` guard, try/catch on every op, validate → migrate → defaults recovery | Pitfall 6: unguarded localStorage bricks dashboards. One adapter owns all storage access; migrations keyed by version live in `MIGRATIONS` |
| Auth | None — no accounts, no secrets, device-local config | Static local-first product; accounts are an anti-feature for v1 |
| Security posture | No executable input in v1 config (schema has no code fields); no `dangerouslySetInnerHTML` ever; sandboxed iframes (`sandbox="allow-scripts"` only) for untrusted widget code in Phase 4 | Sandbox contract is the non-negotiable isolation boundary; Phase 1 establishes the no-render-unvalidated-data rule |
| Deployment target | Any static host (GitHub Pages / Netlify / Vercel / LAN); local full-stack run = `npm run dev`; production build = `npm run build` + `npm run preview` | Zero-server by design; "open a URL on a target device" requires only a static host |
| Directory layout | Feature folders under `src/`: `src/app/` (shell + bootstrap), `src/config/` (types, schemas, defaults, store, storage — THE integration point), later `src/grid/`, `src/registry/`, `src/sandbox/`, `src/theme/`, `src/services/` | ARCHITECTURE.md structure: config owns all state and load paths so every transport shares one validator |
| Styling | CSS Modules + CSS custom properties; dark token set declared on `:root` in `src/index.css`; self-hosted Inter Variable (`@fontsource-variable/inter`) | UI-SPEC locked; tokens on `:root` are the single source of truth Phase 3's theme system pushes; no component library, no Google Fonts network dependency |

## Stack Touched in Phase 1

- [x] Project scaffold — Vite 8 + React 19 + TS ~6.0.3, ESLint 10.8 flat config + typescript-eslint 8.66, Prettier, vitest + Testing Library (plan 01-01)
- [x] Routing — single page, no router (deliberate: kiosk = one screen)
- [x] Data read/write — `storage.ts` safe adapter: read on boot (validate/recover), write via zustand persist of validated state (plans 01-01 deps + 01-02)
- [x] UI — dashboard shell (header + placeholder) rendered per 01-UI-SPEC, driven by the config store boot path (plans 01-01 + 01-02)
- [x] Deployment — documented local full-stack run (`npm run dev`) and static-host build (`npm run build`/`preview`); actual host deploy deferred to Phase 2 (research flag: probe request-line limit there)

## Out of Scope (Deferred to Later Slices)

- Grid, drag/resize/add/remove (Phase 2 — react-grid-layout v2)
- localStorage persistence wiring beyond boot-path recovery, JSON export/import, and `?config=` display URLs (Phase 2 — the other two transports)
- Widget rendering of any kind (native widgets Phase 3; sandboxed iframes Phase 4) — Phase 1 seeds Clock/GitHub Pulse/Pomodoro as data only
- Theme system beyond the declared token set (Phase 3)
- Fullscreen, wake lock, PWA, status indicators, kiosk polish (Phase 5)

## Subsequent Slice Plan

Each later phase adds one vertical slice on top of this skeleton without altering its architectural decisions:

- Phase 2: User can edit a responsive multi-widget grid and move their exact configuration across reloads, files, and devices via one validated config (grid + persistence + JSON export/import + display URLs)
- Phase 3: User gets native Desk Clock & Date, Pomodoro Focus Timer, and GitHub Pulse widgets with themes and failure-tolerant live data
- Phase 4: User can write, preview, and run their own HTML/CSS/JS widgets safely in sandboxed iframes (BYOW)
- Phase 5: User can run DeskMate as an always-on kiosk — fullscreen with wake lock, single-widget mobile mode, status indicators, PWA installability — verified by an on-hardware soak
