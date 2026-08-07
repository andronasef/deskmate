# Project Research Summary

**Project:** DeskMate — Your Smart Desk Companion
**Domain:** Client-side smart-dashboard / digital-signage web app (kiosk mode, zero backend)
**Researched:** 2026-08-07
**Confidence:** HIGH

## Executive Summary

DeskMate turns idle screens (old phones, spare monitors) into customizable smart dashboards. Research confirms it is a **static, client-only React + Vite app with no backend**: the entire product is a pipeline — decode config → render grid → render widget frames → persist back. The whole app hangs off one serializable `DashboardConfig` object (layout + widget instances + theme), validated by a single zod schema and transported through **three channels that share one code path**: localStorage persistence, JSON export/import, and the unique `?config=` display URL. This single-config/three-transports design is what makes the Core Value ("one URL, opened on any device, renders the exact configuration") hold without a server.

The recommended stack is React 19.2 + Vite 8.2 (Rolldown) + **TypeScript 6.0.3 — not 7** (typescript-eslint's peer range tops out at `<6.1.0`), with react-grid-layout v2 for the grid, zustand 5 for the single config store, and zod for validation. Feature research shows the table-stakes floor is the standard widget set (clock, weather, calendar) plus drag-and-drop editing — but DeskMate's differentiation is structural: the **in-browser BYOW widget editor with sandboxed rendering** (unique in the domain) and the no-account unique-URL sharing model.

The dominant risk is security: custom widgets are untrusted code, and the sandboxed-iframe contract is non-negotiable (`sandbox="allow-scripts"` only, never `allow-same-origin`; postMessage bridge validated by source reference + per-widget nonce, never `event.origin`). The next tier of risks is operational: GitHub's 60 req/hr unauthenticated budget (ETag conditional requests are mandatory), share URLs exceeding the ~8 KB request-line limit (lz-string compression + hard cap + export fallback), wake-lock death on tab-away/iOS<16.4 (re-acquire on `visibilitychange`), and performance collapse on 2 GB target phones (iframe budgets, lazy mounting, debounced persistence). Every one of these has a known prevention and a specific phase that must own it — see the phase mapping below.

## Key Findings

### Recommended Stack

React 19 + Vite 8 + TS 6 with react-grid-layout v2 for the grid and zustand for a single serializable store. Verified against the npm registry and official docs on the research date.

**Core technologies:**
- **React 19.2.x (19.2.8)** — stable current major, locked by planning; all recommended libraries are React 19 + StrictMode compatible
- **Vite 8.2.x (8.2.1)** — current major, ships Rolldown (Rust bundler); requires Node `^20.19.0 || >=22.12.0` (dev machine is 22.12.0 ✓); ESM-only (`"type": "module"`)
- **TypeScript 6.0.3** — **NOT 7.0.2**: typescript-eslint@8.66 peer is `>=4.8.4 <6.1.0`, so TS 7 breaks the lint toolchain on day one. Pin `~6.0.3`
- **react-grid-layout 2.2.x** — answers the grid question definitively: v2 is a complete TS rewrite with hooks API, serializable/restorable layouts (required for export/import), responsive breakpoints (phone = fullscreen widget), and `compactor` for kiosk layouts. Do NOT hand-roll CSS grid; do NOT use gridstack (its React wrapper was unpublished Jan 2025)
- **zustand 5.0.x** — one global config store with built-in `persist` middleware; bridge code lives outside React and needs `getState()`/`subscribe()` without provider plumbing
- **zod 4.x** — the one source-of-truth schema, validated on every load path (URL, file, localStorage) and before `persist` rehydration
- **lz-string 1.5.x** — URL-safe compression for `?config=`; required so multi-KB configs survive URL length limits
- **@uiw/react-codemirror 4.25.x** (+ lang-html/css/javascript) — BYOW code editor; ~1/3 Monaco's weight
- **lucide-react 1.29.x**, **@fontsource-variable/inter 5.3.x** — icons + self-hosted variable font (offline-resilient)

**Native web APIs (no library — build tiny internal hooks):** Screen Wake Lock (Baseline 2025; ~40-line `useWakeLock` hook, re-acquire on `visibilitychange`), iframe `srcdoc`+`sandbox` for widget isolation, `postMessage` bridge, native `fetch` for the 3 GitHub endpoints, Blob+anchor for export. No axios, no react-query, no UI component library, no backend of any kind.

### Expected Features

**Must have (table stakes) — all P1:**
- Multi-widget drag-and-drop grid (add/remove/resize) — the core editing metaphor of the domain
- Native Clock & Date widget (typography/themes) — the first-run default; users judge the product in its first 5 seconds
- localStorage persistence + export/import JSON + unique display URL — one schema, three transports
- Fullscreen kiosk mode + Screen Wake Lock (graceful fallback) — the "always-on" promise
- Single-widget fullscreen view on phones — matches smart-display convention
- Auto-refresh of live data with graceful failure (cached/sample data, never broken UI)
- First-run default dashboard (Clock + GitHub Pulse + Pomodoro) — see a working dashboard before configuring

**Should have (differentiators — the product's identity):**
- **BYOW: in-browser HTML/CSS/JS widget editor with live preview + sandboxed rendering** — no competitor ships this; it is the open-ecosystem wedge and the prerequisite for any future marketplace
- **Unique display URL** — zero-setup sharing; instant setup on any device
- **No-account, no-install, static-host model** — removes DAKboard/HA friction; architectural but felt as a feature
- **Developer-native widget set: GitHub Pulse + Pomodoro** — no competitor ships these first-class
- **Config portability: export/import + URL = dashboard in your pocket**

**Defer (v2+):** Weather (Open-Meteo — closes the biggest table-stakes gap, add on user feedback), Calendar/ICS (DAKboard-convert gap), PWA installability, widget marketplace, cloud sync, accounts, photo frame, native apps, voice. Anti-features confirmed: accounts, cloud sync, marketplace (v1), server-side CORS proxying, telemetry.

### Architecture Approach

A **single Config Store** (zustand) owns one immutable, versioned `DashboardConfig`; every mutation is a named store action; persistence is a debounced subscription side-effect, never a call in a component. A **Widget Registry** maps `type → definition` with a discriminated renderer: native widgets render as React components, custom widgets render in sandboxed iframes — same `WidgetInstance` shape, two renderers. The **sandbox/bridge** is isolated as a standalone module (not a React component) with one versioned message contract. A **responsive split** decides presentation only (grid vs single-widget view) — same config, both modes.

**Major components:**
1. **Config Store + Validator** — single source of truth; zod schema on every load path; versioned with migration hooks
2. **Transports** — Storage Adapter (versioned key, debounced, quota-safe), URL Codec (lz-string + size cap), Import/Export (Blob + File input) — all funnel through the same validator
3. **DashboardGrid + WidgetFrame** — react-grid-layout v2 wrapper; WidgetFrame owns chrome, drag handle, error fallback, and the widget lifecycle
4. **IframeWidgetRenderer + Bridge + Bootstrap** — builds `srcdoc` from widget code + injected `window.DeskMate` API; postMessage router with source+nonce validation
5. **Theme system** — CSS custom properties on host, pushed to native props and iframe messages
6. **Services** — WakeLockService, FullscreenService, UrlParamsService (host-only; never exposed to iframes)

**The sandbox security contract (non-negotiable):**
1. `sandbox="allow-scripts"` **only** — never `allow-same-origin` (combining them lets the widget remove its own sandbox attribute = full XSS). No `allow-forms`, `allow-modals`, `allow-popups`, `allow-top-navigation`
2. Widgets render via `srcdoc` with an **opaque origin** — they cannot read host DOM, cookies, or localStorage
3. postMessage is the **only** channel: host validates `event.source === iframe.contentWindow` (exact reference) **and** a per-widget random nonce; **never trust `event.origin`** (always `"null"` from sandboxed srcdoc frames)
4. Host→frame `postMessage(msg, "*")` is *correct* because the host holds the direct `contentWindow` reference (a literal targetOrigin would silently break); inbound is verified by source+nonce
5. Widget network access goes through host-proxied **`DeskMate.fetch(url)`** — many public APIs reject `Origin: null` requests from the sandbox
6. Readiness = the widget's `ready` handshake message with a ~5 s timeout — **never** the iframe `load` event (fires even on failure)
7. Never evaluate user code in the host (`new Function`/`dangerouslySetInnerHTML` are forbidden)
8. Teardown on unmount/import: unregister from bridge map, destroy the frame (kills its timers/workers), clear timeouts

### Critical Pitfalls

1. **Sandbox escape via `allow-scripts` + `allow-same-origin`** — remote code execution on every dashboard load. Prevention: `sandbox="allow-scripts"` only, defined as one constant + a unit test asserting the exact attribute string; escape-attempt test widget in the suite. **Phase 4.**
2. **postMessage validated by origin only** — `event.origin` is always `"null"` from sandboxed frames; origin checks are useless. Prevention: source-reference match + per-widget nonce + versioned envelope; ignore malformed messages. **Phase 4.**
3. **Widget lifecycle neglect** — blank tiles (load ≠ ready), zombie iframes/timers after removal, duplicate frames on config import. Prevention: `ready` handshake + timeout fallback; explicit unmount routine; dev "widgets alive" panel. **Phase 4.**
4. **Wake Lock dies on visibility change / iOS < 16.4 / plain HTTP** — lock is auto-released when the tab hides; must re-acquire on `visibilitychange`; feature-detect + graceful fallback (progressive enhancement). **Phase 5.**
5. **GitHub 60 req/hr budget exhausted** — 3 requests per refresh × short interval = lockout in minutes; retry storms risk a per-IP ban. Prevention: ETag/If-None-Match conditional requests (304s don't count), parse `x-ratelimit-remaining/reset`, ≥3 min adaptive cadence, shared deduping client, no `/search/*` endpoints. **Phase 3.**
6. **localStorage as unguarded JSON** — corrupt/version-mismatched config bricks the dashboard. Prevention: Storage Adapter-only access, try/catch every read/write, zod validate on load, version migrations, raw-backup key, quota-safe `storageAvailable()` guard. **Phase 2.**
7. **URL configs exceed the ~8 KB request line → HTTP 414** — nginx default `large_client_header_buffers 4 8k`; percent-encoding inflates 2–3×. Prevention: lz-string compression, hard encoded-size cap (~6 KB), export/import fallback past the cap, real-host probe early. **Phase 2.**
8. **Pomodoro chime blocked by autoplay policy** — no sound on fresh kiosk profiles. Prevention: unlock audio inside the first user-gesture handler (same tap that unlocks wake lock); await `play()` and surface "tap to enable sound"; test on a fresh profile. **Phase 3.**
9. **Grid width flash + drag handles eaten by iframes** — v2 renders at 1280px default until measured; iframe swallows pointer events. Prevention: `useContainerWidth` with `mounted` gating; drag handle in host-DOM title bar (never inside the iframe); memoized children; validate imported layouts (duplicate keys, `w:0`). **Phase 2 + Phase 4 verification.**
10. **Performance collapse on target hardware** — every iframe is a full browsing context; 12 custom widgets on a 2 GB phone kills the tab. Prevention: iframe budget per device class (≤8 mobile / ≤20 desktop) surfaced in UI, lazy-mount offscreen frames, diff size/theme pushes, single 1 s interval for all clocks, debounced/on-stop persistence, 6× CPU throttle check + 24 h on-hardware soak. **Phase 4 budgets + Phase 5 soak.**

## Implications for Roadmap

### Phase 1: Scaffold & Config Core
**Rationale:** The schema is the contract for everything — transports, grid, and widgets all hang off `DashboardConfig`. Building it first means every later phase reuses one validated path instead of inventing its own. Nothing renders yet.
**Delivers:** Vite 8 + React 19 + TS 6.0.3 scaffold (`npm create vite@latest --template react-ts`, then **override TS to `~6.0.3`** — the default scaffolds TS 7 which breaks the linter); `config/types.ts`, zod `schemas.ts`, `defaultConfig.ts`, zustand `store.ts`, versioned `storage.ts` adapter. Foundation for "one schema, three transports".
**Avoids:** Pitfall 6 seed — the storage adapter + validation pattern is established before any persistence exists.
**Stack:** All core deps from the table above. **Standard patterns — skip research-phase.**

### Phase 2: Grid, Persistence & Config Transports
**Rationale:** This delivers the Core Value end-to-end ("one URL on any device" + export/import + surviving reload) *before* the hard security work, so Phase 4 lands on top of a working app rather than blocking everything else.
**Delivers:** `DashboardGrid` (RGL v2, `mounted`-gated width), `WidgetFrame`, drag-and-drop + resize with atomic store actions, URL Codec (lz-string + hard size cap + export fallback), export/import, persistence hardening (migrate + backup), layout sanitization (duplicate keys, `w < minW`), first-run default config render.
**Addresses:** FEATURES P1: grid, persistence, unique URL, export/import, first-run layout.
**Avoids:** Pitfalls 6, 7, 9 (localStorage corruption, 414 URLs, grid flash).
**Research flag:** **Yes — probe the actual deploy host's request-line limit early** (deploy a long-query-param probe page; CDNs/proxies can be stricter than nginx's 8 KB). Browser-side URL limits are community-documented (MEDIUM confidence); the deployed host is authoritative.

### Phase 3: Native Widgets
**Rationale:** Clock proves the registry contract; Pomodoro proves the gesture-unlock pattern; GitHub Pulse proves the failure-tolerant network widget. This phase also delivers the theme system the widget API needs. Widget framework contract first, then Clock, then the rest — if the framework forked into "native path" vs "iframe path" here, the ecosystem would die.
**Delivers:** Native Clock & Date (first-run default, typography + themes), Pomodoro (large countdown, audio chime unlocked on first gesture), GitHub Pulse (ETag cache, header parsing, adaptive ≥3 min backoff, stale-data rendering, shared deduping client), Theme system (tokens → CSS variables → native widget props), per-widget settings UI.
**Addresses:** FEATURES P1: Clock, Pomodoro, GitHub Pulse, themes, per-widget config, auto-refresh + graceful failure.
**Avoids:** Pitfalls 5, 8 (rate-limit lockout, autoplay-blocked chime).
**Standard patterns — skip research-phase** (RGL and GitHub REST API patterns are well-documented). Verify audio on a *fresh profile*, and verify rate-limit behavior with a 2-widget budget simulator.

### Phase 4: Sandbox & BYOW
**Rationale:** The security-critical phase, isolated so its risk can be tested in isolation. The bridge is the only component needing its own deep-dive spike. Build contract → bootstrap → bridge → renderer → editor, in that order.
**Delivers:** `sandbox/contract.ts` (versioned message envelope), `bootstrap.ts` (`window.DeskMate` API: getTheme/onThemeChange/getSize/onResize/getConfig/onConfigChange/fetch/notifyError), `bridge.ts` (source-reference + nonce router), `IframeWidgetRenderer` (`sandbox="allow-scripts"` constant + exact-attribute unit test + srcdoc builder escaping test), widget lifecycle (ready handshake, crash fallback, explicit teardown), BYOW editor (CodeMirror, live preview), iframe performance budgets + lazy mounting.
**Addresses:** FEATURES P1: BYOW editor, sandboxed rendering, DeskMate widget API — the product's identity.
**Avoids:** Pitfalls 1, 2, 3, and 10 (budgets): sandbox escape, message spoofing, zombie frames, old-hardware collapse. Verification includes a hostile escape-attempt test widget and a decoy-frame spoofing test.
**Research flag:** **Yes — multi-browser postMessage + srcdoc behavior spike** (opaque origins, nonce handshake, `targetOrigin "*"` semantics across Chrome/Safari/Firefox) before implementing the bridge.

### Phase 5: Kiosk & Polish
**Rationale:** The always-on promise completes last because it exercises long-horizon behaviors (tab-away, battery, OS reclaim) that need the finished app to test. The single-widget mobile view is a presentation decision, not a config decision — same `DashboardConfig`, second render mode.
**Delivers:** Single-widget fullscreen view on narrow screens, FullscreenService (user-gesture triggered), WakeLockService (feature-detect, visibilitychange re-acquire, sentinel release handling, visible toggle), "widget did not start" / rate-limited / stale status UI, performance budget warnings + light mode, PWA installability (manifest — cheap native substitute).
**Addresses:** FEATURES P1: fullscreen + wake lock, single-widget mobile mode; P2: PWA.
**Avoids:** Pitfall 4 (wake lock) and Pitfall 10 (on-hardware soak: 24 h run, frame-time logging, memory sampling, 6× CPU throttle check).
**Research flag:** **Yes — wake-lock behavior on actual target device classes** (old iOS < 16.4 fallback guidance, Low Power Mode rejection, HTTPS-only serving note for LAN hosting).

### Phase Ordering Rationale

- **Schema-first:** `DashboardConfig` + zod is the contract with users and future app versions; the three transports and the grid are all consumers. Build once, reuse everywhere — this is the "one validator, three transports" principle made real.
- **Core value before security:** Phase 2 delivers the unique-URL sharing story on top of a plain grid; Phase 4's risky sandbox work then extends a working app instead of gating it. Only the bridge needs a dedicated spike — schedule it, don't let it surprise the phase.
- **Widget contract before sandbox:** Clock proves the registry/renderer contract; the iframe becomes a second renderer of the same `WidgetInstance`, never a fork. This is what keeps native and BYOW widgets on one framework.
- **Kiosk behavior last:** wake lock, battery, and OS-reclaim behaviors can only be verified on real hardware with the finished app; earlier phases would guess.

### Research Flags Summary

| Phase | Research Needed | Reason |
|-------|-----------------|--------|
| 2 | Deploy-host request-line limit | Real 414 reproduction beats docs; CDNs may be stricter than nginx 8 KB |
| 4 | Multi-browser postMessage + srcdoc spike | Opaque-origin semantics, nonce handshake, `"*"` targetOrigin behavior — the one deep-dive |
| 5 | Wake lock on target device classes | iOS < 16.4 fallback, Low Power Mode rejection, HTTPS-only caveat |

Phases with standard patterns (skip research-phase): **Phase 1** (canonical Vite scaffold) and **Phase 3** (RGL + GitHub REST API patterns are well-documented).

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All versions/peer ranges verified against npm registry + official docs (Vite blog, RGL README, GitHub docs) on 2026-08-07 |
| Features | HIGH | Competitor sites and docs fetched directly (DAKboard, MagicMirror², HA, Lively Wallpaper); PROJECT.md authoritative for scope |
| Architecture | HIGH | MDN (iframe, postMessage, wake lock, localStorage) + RGL v2 docs; sandbox contract is standard browser-primitive behavior |
| Pitfalls | HIGH | MDN, Chrome docs, GitHub rate-limit docs, nginx docs; **browser-specific URL length limits marked MEDIUM** — deploy host is the authoritative number |

**Overall confidence:** HIGH — the domain is well-documented and all four research areas agree on the same shape (React + Vite static app, RGL grid, sandboxed iframes, single config schema).

### Gaps to Address

- **Actual URL length limits of the chosen deploy host:** unknown until deployed. Probe with a long-query-param page in Phase 2; treat the deployed host (not Chrome's ~2 MB) as authoritative.
- **`DeskMate.fetch` host-proxy network policy:** the host-proxied fetch is designed as an extension point (per-widget URL allow-list, request budgets). Needs concrete design + enforcement in Phase 4.
- **srcdoc base-URL inheritance:** relative URLs inside widget code resolve against the *host* URL. Must be documented for BYOW authors and enforced/tested in the editor (absolute URLs or `data:` URIs).
- **Weather (Open-Meteo) and Calendar (ICS) are P2:** the CORS-friendly keyless API choice is validated, but neither widget is integrated. Keep Open-Meteo locked in for the Weather decision; ICS parsing is the largest un-researched chunk of the P2 backlog.
- **Wake lock on iOS < 16.4:** no API at all — the app must remain fully usable dimmed; needs explicit fallback copy in Phase 5.
- **First-run offline:** GitHub Pulse must show sample data on a first run in airplane mode (cache doesn't exist yet) — a verification requirement for Phase 3, not just a code path.

## Sources

### Primary (HIGH confidence)
- npm registry (`npm view <pkg>` verified 2026-08-07) — all version numbers, peer ranges, release dates (STACK.md)
- Vite blog: "Announcing Vite 8" — Rolldown, Node requirements, plugin-react v6 (STACK.md)
- react-grid-layout v2 official README/CHANGELOG — hooks API, serializable layouts, compactors, StrictMode (STACK/ARCHITECTURE/PITFALLS)
- GitHub Docs: "Rate limits for the REST API" + "Best practices" — 60 req/hr, ETag/304 semantics, ban warning (STACK/PITFALLS)
- MDN: `<iframe>` (sandbox tokens, `allow-scripts`+`allow-same-origin` warning, srcdoc base URL, load-event behavior), Screen Wake Lock API, Window.postMessage, Using the Web Storage API (ARCHITECTURE/PITFALLS)
- Chrome docs: "Stay awake with the Screen Wake Lock API", "Autoplay policy in Chrome" (PITFALLS)
- caniuse: wake-lock (iOS Safari 16.4+, WebKit bug 205104) (PITFALLS)
- nginx `ngx_http_core_module`: `large_client_header_buffers 4 8k` → 414 (PITFALLS)
- Competitor sites/docs fetched 2026-08-07: DAKboard, MagicMirror², Home Assistant, Lively Wallpaper (FEATURES)
- PROJECT.md — authoritative scope and constraints

### Secondary (MEDIUM confidence)
- Browser-specific URL length limits (Chrome ~2 MB, Safari ~80 KB) — community-documented, varies by version; treat the server/proxy limit as authoritative (PITFALLS)
- Smart-display OS conventions (Nest Hub / Echo Show ambient clock) — domain knowledge (FEATURES)

---
*Research completed: 2026-08-07*
*Ready for roadmap: yes*
