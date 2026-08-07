# Stack Research

**Domain:** Client-side smart-dashboard / digital-signage web app (kiosk mode)
**Project:** DeskMate
**Researched:** 2026-08-07
**Confidence:** HIGH (versions verified against npm registry + official docs on research date)

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| React | 19.2.x (19.2.8) | UI framework | Stable major since Dec 2024 (19.0.0); 19.2.8 patched Jul 2026. Locked by planning. All recommended libraries (react-grid-layout v2, zustand 5, @uiw/react-codemirror, lucide-react) are React 19 compatible. Use `<StrictMode>` — react-grid-layout v2 explicitly supports it. |
| Vite | 8.2.x (8.2.1) | Build tool / dev server | Vite 8 (Mar 2026) is the current major — 6 and 7 are superseded (6 = Nov 2024, 7 = Jun 2025). Ships Rolldown, the unified Rust bundler (10-30x faster builds, full plugin compat). Requires Node `^20.19.0 \|\| >=22.12.0` — the dev machine runs Node 22.12.0 ✓. |
| @vitejs/plugin-react | 6.0.x (6.0.5) | JSX/React Refresh transform | v6 pairs with Vite 8 (peer `vite ^8.0.0`). Uses Oxc for React Refresh; Babel is no longer a dependency. React Compiler is opt-in via `reactCompilerPreset` — do NOT enable it for v1 (no need; it's a perf optimization, adds a build dependency). |
| TypeScript | **6.0.x (6.0.3)** | Typed language | **NOT 7.0.2.** TS 7 is the Go-native compiler (released Jul 2026) and the ecosystem hasn't caught up: `typescript-eslint@8.66.0` peer is `>=4.8.4 <6.1.0`, so TS 7 breaks the lint toolchain. TS 6.0.3 (Apr 2026) is the newest version the toolchain supports. Pin `~6.0.3`. |
| react-grid-layout | 2.2.x (2.2.4) | Multi-widget draggable/resizable grid | **Answers the grid question: RGL v2, not hand-rolled CSS grid.** v2 (Dec 2025) is a complete TypeScript rewrite: hooks API (`useContainerWidth`, `useResponsiveLayout`), composable config (`gridConfig`, `dragConfig`, `compactor`), tree-shakeable modular imports, serializable/restorable layouts (core requirement for export/import), responsive breakpoints (needed for the phone=fullscreen-widget mode), `positionStrategy` + `compactor` for free-form kiosk layouts. React 18+/StrictMode compatible. Actively maintained (22.4k stars, v2.2.4 Jul 2026). The old `@types/react-grid-layout` package is deprecated (stub) — v2 ships its own types. |
| zustand | 5.0.x (5.0.14) | State management (layout + widget config store) | v5 stable since Oct 2024, peer `react >=18`. Single global store is the right shape for a config-driven dashboard: one `useStore` for layout, widget configs, and UI mode, with the built-in `persist` middleware writing to localStorage. Zero boilerplate vs Redux; more structured than a pile of `useState`+effects. No context-provider nesting. |
| Node.js | >=22.12.0 | Runtime for build tooling | Required by Vite 8 (`^20.19.0 \|\| >=22.12.0`). Dev machine already on 22.12.0. ESM-only toolchain — scaffold as `"type": "module"`. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @uiw/react-codemirror | 4.25.x (4.25.11) | BYOW built-in code editor | The custom-widget editor needs syntax highlighting for HTML/CSS/JS. CodeMirror 6 via this React wrapper: ~1/3 of Monaco's weight, React 19 compatible (peer `>=17`), language modes tree-shakeable. Add `@codemirror/lang-html` / `-css` / `-javascript`. |
| lucide-react | 1.29.x (1.29.0) | Icons for app chrome (settings, drag handle, close, fullscreen) | Peer supports React ^19. Lightweight, tree-shakeable icon set; do not add a full icon library. |
| @fontsource-variable/inter | 5.3.x (5.3.0) | Self-hosted variable font | The clock widget is typography-driven. Self-hosted fonts keep the static app offline-resilient and consistent — no Google Fonts network dependency. Variable font = unlimited weights in one file. |
| zod | 4.x (4.4.3) | Config schema validation | One source-of-truth schema for the exported/imported JSON and the query-param config. Validate on import, on display-URL decode, and before `persist` rehydration. Prevents a corrupt JSON file or hand-edited URL from breaking the dashboard. |
| lz-string | 1.5.x (1.5.0) | URL-safe compression of query-param configs | The unique display URL (`?config=...`) must survive browser URL length limits. lz-string's `compressToEncodedURIComponent` shrinks a multi-KB JSON config (including widget code) to a URL-safe string. Mature and dormant (last publish 2023) but stable and dependency-free — acceptable for a leaf util. |
| react-resizable | (comes with RGL) | Resize handles for the grid | **Do not install separately** — it's a dependency of react-grid-layout; you only import its CSS (`react-resizable/css/styles.css`). |

### Native Web APIs (no library — build tiny internal hooks)

| API | Use | Notes |
|-----|-----|-------|
| Screen Wake Lock API | Keep display on in kiosk/fullscreen mode | **Baseline 2025 (Mar 2025) — works across current browsers.** HTTPS-only (secure context). Write a ~40-line `useWakeLock` hook: feature-detect `"wakeLock" in navigator`, `navigator.wakeLock.request("screen")` → `WakeLockSentinel`, **re-acquire on `visibilitychange`→visible** (browser auto-releases when tab hidden), release on unmount/exit-fullscreen. Do NOT use a third-party wake-lock package. |
| iframe `srcdoc` + `sandbox` | Sandboxed rendering of untrusted custom widgets | `srcdoc` renders widget HTML/CSS/JS as a full document with an opaque (unique) origin; `sandbox="allow-scripts"` runs JS with **no `allow-same-origin`** (see Pitfalls — combining them voids the sandbox). No `allow-forms`, `allow-modals`, `allow-popups`, `allow-top-navigation`. Add `referrerpolicy="no-referrer"`. This is the security boundary — it is what makes the BYOW ecosystem safe. |
| `window.postMessage` | DeskMate API bridge (theme colors, screen size) to widgets | The only sanctioned communication channel across the sandbox boundary. Parent→widget `postMessage({type:'deskmate:theme', ...})`; widget→parent `postMessage({type:'deskmate:ready'})`. Validate `event.origin`/`event.source` on the parent side. Do not use a messaging library. |
| `fetch` | GitHub REST API client | Native `fetch` is sufficient for 2-3 public endpoints. No axios, no octokit for v1 (octokit@22 is worth it only if the endpoint surface grows). |
| `localStorage` | Persistence | Via zustand `persist` middleware with `version` + `migrate` for schema evolution. |
| Blob + `<a download>` / `<input type="file">` | JSON export/import | `URL.createObjectURL(new Blob([json]))` → anchor click for export; File input + `file.text()` + zod parse for import. No library needed. |
| Web Audio API | Pomodoro audio chime | Generate the chime with an `AudioContext` oscillator (~15 lines) or bundle a tiny WAV asset — no library, no asset pipeline. |

### Development Tools

| Tool | Version | Purpose | Notes |
|------|---------|---------|-------|
| ESLint | 10.8.x | Linting | Use flat config (`eslint.config.js`), the current standard. |
| typescript-eslint | 8.66.x | TS-aware linting | **Pin TypeScript < 6.1.0** — this package's peer range is `>=4.8.4 <6.1.0`. This is the hard constraint behind the TS 6.0.3 recommendation. |
| Prettier | 3.9.x | Formatting | Integrate via `eslint-config-prettier` to avoid rule conflicts. |
| Vite Devtools | built into Vite 8 | Dev-server debugging | Enable via `devtools: true` in Vite config; useful for inspecting module graph. |
| create-vite | 9.1.x | Scaffolding | `npm create vite@latest deskmate -- --template react-ts` gives the canonical baseline (Vite 8 + React 19 + TS 6). |
| npm | 10.9.x | Package manager | Ships with Node 22. Fine for v1. (pnpm/bun are drop-in alternatives; not required.) |

## Installation

```bash
# Scaffold (canonical baseline: Vite 8 + React 19 + TS 6)
npm create vite@latest deskmate -- --template react-ts

# Core
npm install react react-dom react-grid-layout zustand
npm install zod lz-string lucide-react @fontsource-variable/inter

# BYOW code editor (CodeMirror 6)
npm install @uiw/react-codemirror @codemirror/lang-html @codemirror/lang-css @codemirror/lang-javascript

# Dev dependencies
npm install -D typescript@~6.0.3 eslint typescript-eslint @eslint/js prettier eslint-config-prettier @types/react @types/react-dom
```

Note: `create-vite` scaffolds TS 7 if left to its default at time of writing — **override to `typescript@~6.0.3`** to stay inside the typescript-eslint peer range.

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| react-grid-layout v2 | Hand-rolled CSS Grid + dnd-kit | If you need a fundamentally different interaction model (e.g., a free-canvas pinboard rather than a tiled grid). Cost: you re-implement drag/resize collision, compaction, and responsive breakpoints — weeks of work and a class of edge-case bugs. CSS grid alone has no drag/resize/compaction; not viable for the MVP grid requirement. |
| react-grid-layout v2 | gridstack.js (13.x) | If you preferred a framework-agnostic engine or already own gridstack expertise. But `gridstack-react` was **unpublished from npm Jan 2025** — there is no official React wrapper, so you'd write your own integration layer. RGL is native React, TypeScript-typed, and built exactly for this dashboard pattern (it powers Grafana/Metabase/Kibana). |
| zustand 5 | jotai (2.20.x) | If you prefer atom-based granular state and component-local reactivity. For DeskMate, config is one document (layout + widgets + theme) — a single zustand store with `persist` models that better and keeps export/import trivial (serialize the whole store). |
| CSS Modules + CSS custom properties | Tailwind CSS 4.3.x | If the team strongly prefers utility-first authoring. Tailwind v4 (CSS-first config) works fine with Vite 8. Default choice is CSS Modules + custom properties because: (a) zero extra tooling, (b) the theme system *is* CSS custom properties — widgets receive theme colors as variables, (c) app CSS can never leak into widgets anyway (they live in sandboxed iframes), so scoping pressure is low. |
| @uiw/react-codemirror (CodeMirror 6) | Monaco (0.56.x) | If the editor needs IDE-class features (multi-cursor, minimap, IntelliSense). Monaco is ~3x the bundle weight for features a widget editor doesn't need. CodeMirror is the right size for HTML/CSS/JS in a kiosk tool. |
| Custom ~60-line GitHub fetch hook | @tanstack/react-query (5.101.x) | If the widget count and external-API surface grow (more endpoints, caching/refetch requirements). For v1 — 3 GitHub endpoints, 60 req/hr budget — a small hook with ETag conditional requests + localStorage cache is simpler and dependency-free. Revisit in a later phase. |
| Plain `fetch` for GitHub | @octokit/rest (22.0.x) | If you later add many endpoints, pagination, or OAuth. For unauthenticated public data with 2-3 endpoints, octokit's auth/pagination machinery is unused weight. |
| TypeScript 6.0.3 | TypeScript 7.0.2 (Go-native) | Revisit after typescript-eslint ships support (peer currently `<6.1.0`). TS 7's speed is appealing but breaking the linter on day one of a greenfield project is not. |
| React 19.2 | React 18 | No reason to start a new project on 18 in 2026. 19 is the stable current major, and every library above supports it. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Heavy UI component libraries (MUI, Chakra, shadcn/ui) for widget chrome | Kiosk dashboards need tiny, themeable chrome (a widget chrome, a settings popover, a grid handle). These libraries ship 100KB+ of CSS-in-JS/theme machinery, fight the CSS-variable theme system, and bloat the static bundle. | ~10 small custom components (WidgetFrame, SettingsPopover, IconButton) + CSS custom properties + lucide-react. |
| Shadow DOM for widget isolation | (a) Does **not** isolate JavaScript — widget JS would run in the main app context and can exfiltrate localStorage/state. (b) CSS isolation is partial: inherited properties and custom properties still pierce the shadow boundary. (c) No network/resource isolation. The planning decision to use sandboxed iframes is validated — this is the only real isolation boundary. | Sandboxed iframe: `srcdoc` + `sandbox="allow-scripts"` + `postMessage`. |
| `sandbox="allow-scripts allow-same-origin"` | MDN: "strongly discouraged" — a document with both can remove its own sandbox attribute, making the widget as dangerous as no sandbox at all. | `sandbox="allow-scripts"` only. Widgets get an opaque origin; `postMessage` is the communication path. |
| `dangerouslySetInnerHTML` / rendering widget code in the app DOM | Any widget HTML/CSS/JS rendered in the main document can script the whole app. Even "sanitized" HTML is a losing game against CSS/JS-based escapes. | Always render custom widgets inside the sandboxed iframe. |
| Supabase / Firebase / any backend | PROJECT.md explicitly scopes v1 as static, local-first, zero-backend. Adding a backend re-introduces deployment complexity and contradicts the "one URL renders the exact config" model. | localStorage + JSON export/import + query-param display URLs. |
| axios | One external API + native APIs; `fetch` is built into every target browser. An HTTP client dependency buys nothing here. | Native `fetch` (wrapped in a tiny `githubClient` module). |
| dayjs / date-fns | The clock widget only needs `Intl.DateTimeFormat` + `Intl.RelativeTimeFormat`, both native and tree-shake-free. | Native `Intl` API. |
| react-grid-layout v1.x (1.5.x) | v1 lacks first-class TS types, has a flat legacy prop API, and its types come from a deprecated stub package. v2 is a drop-in migration path (`react-grid-layout/legacy` exists) with hooks and composable config. | react-grid-layout **2.2.x** with the v2 hooks API. |
| react-query/SWR in v1 | Overkill for 3 endpoints with a 60 req/hr budget; adds ~13KB and a conceptual layer. | Small custom hook + ETag caching. Revisit when API surface grows. |
| Webpack / CRA / other bundlers | Dead-ends in 2026: CRA is unmaintained, webpack setup is manual. Vite is the React ecosystem standard with the fastest dev loop. | Vite 8 (Rolldown). |
| Service Worker / PWA manifest in v1 | Adds offline/install complexity before the core dashboard works. The app is local-first already; the only network dependency is the GitHub widget, which degrades to cached data. | Defer PWA/offline to a later phase. |

## Stack Patterns by Variant

**If custom widgets grow large (code > ~8KB per widget):**
- Prefer JSON file export/import over query-param display URLs for those configs
- Because: even lz-string-compressed, a long config can exceed practical URL length limits in some clients/proxies; a file has no size limit. Keep query URLs for compact configs, file import for full ones. The two paths share the same zod schema.

**If the widget/API surface grows beyond ~5 endpoints:**
- Introduce @tanstack/react-query (or SWR) for the GitHub data layer
- Because: cache invalidation and refetch windows become real problems; react-query's staleTime/refetchInterval and query cache map 1:1 to "poll GitHub widget on a fixed schedule without wasting the rate limit."

**If fullscreen Wake Lock must also hold while widgets are interactively edited:**
- Keep wake-lock state in the zustand store (not a component-local hook), so both Dashboard and Edit views share the same sentinel
- Because: the lock is app-level (the screen must stay on in kiosk mode regardless of which view is active); re-acquiring on `visibilitychange` must be a single global handler.

**If a widget needs to be updated without reloading the dashboard (future "widget marketplace"):**
- Keep the widget registry data-driven: `{ id, type: 'native' | 'custom', src/config }` in the store, and mount custom widgets only via the `<WidgetFrame>` sandbox component
- Because: adding a marketplace later then only adds a fetch + import step; the render path stays unchanged. Never let widget code touch the app bundle.

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| react@19.2.x | react-grid-layout@2.2.x | Peer `react >= 16.3.0`; v2 officially targets React 18+ and StrictMode. Verified active. |
| vite@8.2.x | @vitejs/plugin-react@6.0.x | Plugin peer requires `vite ^8.0.0`. (plugin-react v5 also still works with Vite 8, but start on v6.) |
| vite@8.2.x | node | `^20.19.0 \|\| >=22.12.0`; dev machine is 22.12.0 ✓. Vite 8 is ESM-only — set `"type": "module"`. |
| typescript@6.0.3 | typescript-eslint@8.66.x | Peer `>=4.8.4 <6.1.0`. **typescript@7.0.2 is NOT supported — do not upgrade until typescript-eslint raises the peer range.** |
| typescript@6.0.3 | @types/react@19.2.x | Fine — @types/react 19 targets TS >=5.x. |
| zustand@5.0.x | react@19 | Peer `react >=18.0.0` ✓. |
| @uiw/react-codemirror@4.25.x | react@19 | Peer `react >=17.0.0` ✓. |
| lucide-react@1.29.x | react@19 | Peer `^16.5.1 \|\| ^17 \|\| ^18 \|\| ^19` ✓. |
| react-grid-layout@2.2.x | react-resizable | Bundled dependency; import its CSS (`react-resizable/css/styles.css`) plus `react-grid-layout/css/styles.css`. |

## Sources

- npm registry (`npm view <pkg> version/peerDependencies/time`, verified 2026-08-07) — HIGH — all version numbers, peer ranges, release dates
- Vite blog: "Announcing Vite 8" (https://vite.dev/blog/announcing-vite8, 2026-03-12) — HIGH — Rolldown bundler, Node requirements, plugin-react v6 (Oxc refresh, React Compiler opt-in)
- react-grid-layout README/CHANGELOG (https://github.com/react-grid-layout/react-grid-layout, active Jul 2026) — HIGH — v2 TypeScript rewrite, hooks API, React 18+/StrictMode, migration path, maintenance status, 22.4k stars
- GitHub Docs: "Rate limits for the REST API" (https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api, current) — HIGH — unauthenticated limit = 60 req/hr per IP; x-ratelimit-* headers; 403/429 handling
- GitHub Docs: "Best practices for using the REST API" (https://docs.github.com/en/rest/using-the-rest-api/best-practices-for-using-the-rest-api, current) — HIGH — conditional requests (ETag/If-None-Match → 304), fixed polling schedule, serialize requests, stable params
- MDN: Screen Wake Lock API (https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API, last modified 2026-07-27) — HIGH — Baseline 2025, secure-context requirement, sentinel lifecycle, visibilitychange re-acquire, Permissions-Policy `screen-wake-lock`
- MDN: `<iframe>` element (https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/iframe, last modified 2026-08-04) — HIGH — sandbox token semantics, `srcdoc`, `allow-same-origin`+`allow-scripts` hazard, `csp` attribute, no `error` event
- npm registry: `@types/react-grid-layout` deprecated notice — HIGH — stub types; RGL v2 ships its own
- npm registry: `gridstack-react` unpublished (2025-01-14) — HIGH — no official React wrapper for gridstack

---
*Stack research for: DeskMate — static client-side smart dashboard*
*Researched: 2026-08-07*
