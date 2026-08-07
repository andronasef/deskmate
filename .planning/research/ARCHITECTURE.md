# Architecture Research

**Domain:** Client-side smart-dashboard / digital-signage web app (DeskMate)
**Researched:** 2026-08-07
**Confidence:** HIGH

## Standard Architecture

### System Overview

DeskMate is a **static, client-only React + Vite app** with no backend. Everything hangs off one
serializable `DashboardConfig` object (layout + widget instances + theme). The app is a pipeline:
**decode config → render grid → render widget frames → (native render | sandboxed iframe render) → persist back**.

```
┌──────────────────────────────────────────────────────────────────────────┐
│                            App Shell (bootstrap)                          │
│  ┌──────────────┐  ┌────────────────┐  ┌──────────────┐  ┌───────────┐  │
│  │  URL Codec   │  │  Import/Export │  │  localStorage │  │  Services │  │
│  │ (?config=)   │  │  (JSON files)  │  │   adapter    │  │ wakeLock  │  │
│  └──────┬───────┘  └───────┬────────┘  └──────┬───────┘  │ fullscreen│  │
│         │                  │                  │          └───────────┘  │
│         └──────────────────┼──────────────────┘                        │
│                            ▼                                            │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │              Config Store (single source of truth)              │   │
│  │     zustand: { config, setLayout, addWidget, updateWidget,      │   │
│  │                setTheme, importConfig, reset }                  │   │
│  └───────────────────────────────┬─────────────────────────────────┘   │
│                                  ▼ (subscribe)                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                      Dashboard View (layout layer)              │   │
│  │  ┌───────────────────────┐   ┌──────────────────────────────┐  │   │
│  │  │  DashboardGrid        │   │  SingleWidgetView            │  │   │
│  │  │  (react-grid-layout   │   │  (small screens: one widget  │  │   │
│  │  │   Responsive, v2)     │   │   fullscreen)                │  │   │
│  │  └───────────┬───────────┘   └──────────────┬───────────────┘  │   │
│  │              ▼                             ▼                   │   │
│  │  ┌─────────────────────────────────────────────────────────┐   │   │
│  │  │        WidgetFrame (per grid item, keyed by id)         │   │   │
│  │  │  title bar · drag handle · error fallback · frame shell │   │   │
│  │  └──────────────────────┬──────────────────────────────────┘   │   │
│  │                         ▼ (dispatch by registry type)          │   │
│  │  ┌─────────────────────────────┐   ┌─────────────────────────┐ │   │
│  │  │ NativeWidgetRenderer        │   │ IframeWidgetRenderer    │ │   │
│  │  │ React component, gets       │   │ srcdoc sandbox + Bridge │ │   │
│  │  │ {theme, config, size} props │   │ (postMessage, nonce)    │ │   │
│  │  └─────────────────────────────┘   └─────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                     Widget Registry (static map)                │   │
│  │  type → { name, defaultSize, renderer: 'native'|'iframe' }     │   │
│  │  native: clock · pomodoro · github     iframe: user custom     │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────────┘
```

**Direction rule:** all mutation flows through the Config Store; components never write to
localStorage or the URL directly. Widget iframes communicate **only** via the postMessage bridge,
never by touching host DOM (their opaque origin prevents it, and we must keep it that way).

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| **App Shell / bootstrap** | Parse URL param → seed store → render view; hosts fullscreen + wake-lock triggers; decides Grid vs Single view | `App.tsx` + `bootstrap.ts` |
| **Config Store** | Single source of truth: layout, widget instances, theme; all mutations via actions; notifies subscribers | zustand store (small, subscribable from non-React bridge code) |
| **Config Validator** | zod schema for `DashboardConfig`; sanitize/repair/reject malformed config on every load path (URL, file, localStorage) | zod schemas in `config/validator.ts` |
| **Storage Adapter** | Load/save the one config object to localStorage; version key + migration hook; quota/`SecurityError` handling | `config/storage.ts` (sync, debounced writes) |
| **URL Codec** | Encode config → `?config=` query param and decode back; compression (lz-string + base64url); size cap | `config/urlCodec.ts` |
| **Transfer (import/export)** | Export config as downloadable `.json`; parse uploaded file through the same validator | `config/transfer.ts` (Blob + File input) |
| **Dashboard Grid** | Renders react-grid-layout `Responsive`/`ReactGridLayout` (v2 hooks API); maps store layout → grid children; reports drag/resize back via `onLayoutChange` | `grid/DashboardGrid.tsx` |
| **WidgetFrame** | Wrapper per grid item: title bar, drag handle, static styling, error/loading fallback; owns the lifecycle of its child renderer | `grid/WidgetFrame.tsx` |
| **Widget Registry** | Static map `type → WidgetDefinition` (name, default size, renderer kind, schema). Adding a widget = one entry. Custom BYOW widgets resolve to the iframe renderer | `registry/index.ts` |
| **NativeWidgetRenderer** | Renders a registered React component with `{theme, config, size}` props; re-renders on store change | `widgets/*` |
| **IframeWidgetRenderer** | Builds `srcdoc` from user's HTML/CSS/JS + injected bootstrap script; `sandbox="allow-scripts"`; owns bridge wiring; error fallback | `sandbox/IframeWidgetRenderer.tsx` |
| **Bridge (host side)** | postMessage inbound router: validates `event.source` against known iframe windows + per-widget nonce; pushes `theme`/`size`/`config` outbound | `sandbox/bridge.ts` |
| **DeskMate API (injected)** | The `window.DeskMate` object inside each sandbox: `getTheme/onThemeChange/getSize/onResize/...` implemented on top of postMessage | `sandbox/bootstrap.ts` (string template) |
| **Theme** | Theme tokens → CSS variables on host + pushed to native props and iframe messages | `theme/` |
| **Services** | `WakeLockService` (sentinel + visibilitychange re-acquire), `FullscreenService`, `UrlParamsService` | `services/` |
| **BYOW Editor** | Code editor for writing a custom widget (HTML/CSS/JS) and saving it as a widget instance; later phase | `editor/` |

## Recommended Project Structure

```
src/
├── app/                    # app shell + bootstrap wiring
│   ├── App.tsx             # view router: edit mode / display mode / single-widget mode
│   └── bootstrap.ts        # ordered boot: urlCodec → validator → store → render
├── config/                 # THE single source of truth
│   ├── types.ts            # DashboardConfig, WidgetInstance, Theme, Layout types
│   ├── schemas.ts          # zod schemas (shared by validator, urlCodec, transfer)
│   ├── store.ts            # zustand store: state + actions
│   ├── storage.ts          # localStorage adapter (versioned, debounced, safe)
│   ├── urlCodec.ts         # ?config= encode/decode (lz-string)
│   ├── transfer.ts         # export .json / import file → validator
│   └── defaultConfig.ts    # sensible first-run config (clock widget, default theme)
├── grid/                   # layout layer
│   ├── DashboardGrid.tsx   # react-grid-layout v2 wrapper (Responsive)
│   ├── SingleWidgetView.tsx# mobile fullscreen widget
│   └── WidgetFrame.tsx     # per-item chrome + fallback + lifecycle owner
├── registry/
│   ├── types.ts            # WidgetDefinition
│   └── index.ts            # built-in registry (clock, pomodoro, github) + custom resolver
├── widgets/                # native widget implementations (one folder each)
│   ├── clock/
│   ├── pomodoro/
│   └── github/
├── sandbox/                # iframe custom-widget host
│   ├── IframeWidgetRenderer.tsx
│   ├── bridge.ts           # host-side postMessage router + nonce manager
│   ├── bootstrap.ts        # srcdoc preamble: injects window.DeskMate API
│   └── contract.ts         # shared message types (host ↔ widget), imported by none (typed by hand on both sides)
├── theme/
│   ├── tokens.ts           # theme definitions (light/dark/colorways)
│   ├── ThemeProvider.tsx   # sets CSS variables on host root
│   └── useTheme.ts
├── services/
│   ├── wakeLock.ts         # request/release/visibilitychange re-acquire
│   ├── fullscreen.ts
│   └── urlParams.ts        # query param reader
├── editor/                 # BYOW code editor (built in a later phase)
│   └── WidgetEditor.tsx
└── ui/                     # shared primitives: IconButton, Modal, Dropdown, etc.
```

### Structure Rationale

- **`config/` owns all state and all load paths.** Every source of config (URL, file, localStorage)
  funnels through the same zod schemas. This is what makes "open one URL on any device, get the
  exact config" and export/import the *same code path* — one validator, three transports.
- **`sandbox/` is isolated from `grid/`.** The bridge is a standalone module (not a React component)
  so it can be unit-tested and so the message contract lives in one place (`contract.ts`).
- **`registry/` sits between config and renderers.** The registry is *only* a type→definition map;
  it never touches storage or the bridge. Native widgets and iframe widgets are two renderer
  implementations of the same `WidgetInstance` — adding a third widget type (e.g., a WebView widget)
  requires zero changes to grid or config code.
- **`services/` are side-effect singletons**, feature-detected and called by the shell, never by
  widgets. Wake lock, in particular, belongs to the *host* document only — sandboxed iframes must
  not get it.

## Architectural Patterns

### Pattern 1: Single Config Store (unidirectional data flow)

**What:** One immutable `DashboardConfig` object in a zustand store. All mutations are named actions.
Components subscribe and re-render; persistence is a subscription side-effect, not a call inside a component.
**When to use:** Any client-only app where layout, widget state, and theme must stay consistent and be
serializable to one blob. zustand (not Redux) because the bridge code lives *outside* React and needs
`getState()`/`subscribe()` without provider plumbing.
**Trade-offs:** Slightly more boilerplate than local component state; pays off immediately for
export/import/URL-sharing since the whole app state is one object.

```typescript
// config/store.ts
export const useConfigStore = create<ConfigStore>()((set, get) => ({
  config: defaultConfig(),

  setLayout(layout) {
    set((s) => ({ config: { ...s.config, layout } }));
  },

  updateWidget(id, patch) {
    set((s) => ({
      config: {
        ...s.config,
        widgets: s.config.widgets.map((w) => (w.id === id ? { ...w, ...patch } : w)),
      },
    }));
  },

  importConfig(raw: unknown) {
    const parsed = validateConfig(raw);      // zod: throws/repairs on malformed
    set({ config: parsed });
  },

  reset() {
    set({ config: defaultConfig() });
  },
}));

// config/storage.ts — persistence as a subscription, debounced
useConfigStore.subscribe((s) => scheduleSave(s.config));
```

### Pattern 2: Widget Registry + Discriminated Renderer

**What:** The registry maps a `type` string to a definition. The `WidgetFrame` switches on
`definition.renderer` to mount either a native React component or the iframe sandbox.
**When to use:** When the app must support both trusted first-party widgets (React components) and
untrusted third-party widgets (isolated iframes) behind one `WidgetInstance` shape.
**Trade-offs:** Native widgets get full React power but zero isolation; iframe widgets get hard
isolation but are black boxes (must hand over `theme`/`size` via messages, and lose React).

```typescript
// registry/types.ts
type WidgetDefinition =
  | { type: string; name: string; renderer: 'native'; defaultSize: { w: number; h: number } }
  | { type: string; name: string; renderer: 'iframe'; defaultSize: { w: number; h: number } };

// WidgetFrame decides:
//   type CustomWidget = typeof CustomWidgetDef;   // resolved via dynamic import / static map
//   renderer === 'native'  → <NativeWidgetRenderer def={def} /> (React.lazy for code-splitting)
//   renderer === 'iframe'  → <IframeWidgetRenderer instance={instance} />
```

### Pattern 3: Sandboxed Iframe + postMessage Bridge (the DeskMate API contract)

**What:** Custom widgets are rendered into an iframe whose document is built from the user's
HTML/CSS/JS plus a small bootstrap script that defines `window.DeskMate`. The iframe is a black box
with an **opaque origin**; the only channel is postMessage. **This is the single most security-critical
part of the architecture.**
**When to use:** Rendering untrusted code (BYOW). Never use Shadow DOM or `dangerouslySetInnerHTML`
for untrusted script execution — they cannot sandbox JS. Iframes are the only browser primitive that
isolates script, styles, and storage at once.

**Sandbox attribute (non-negotiable):**
```html
<iframe
  sandbox="allow-scripts"        <!-- ONLY this. Never add allow-same-origin. -->
  srcdoc="{bootstrappedHtml}"
  title="Custom widget"
></iframe>
```

> **Why no `allow-same-origin`:** per MDN, combining `allow-scripts` + `allow-same-origin` lets the
> embedded document remove its own `sandbox` attribute — zero isolation. Without
> `allow-same-origin`, the frame has an opaque origin: it cannot read the host's DOM, cookies,
> localStorage, or anything else; its `fetch()` sends `Origin: null`; and `event.origin` seen by the
> host is the string `"null"`.

**Consequences the bridge must handle (these drive the contract below):**
1. `event.origin` from a sandboxed srcdoc frame is always `"null"` — the host **cannot** use origin
   checks to tell widgets apart. It must verify `event.source === iframe.contentWindow` and a
   per-widget **nonce** embedded in each srcdoc.
2. Sending to the frame must use `iframe.contentWindow.postMessage(msg, "*")` — a `"null"`/specific
   targetOrigin cannot be matched reliably for opaque origins, and `"*"` is safe *here* because we
   hold the direct `contentWindow` reference and the only risk of `"*"` is navigation interception.
3. Widgets that need network access call **`DeskMate.fetch(url)`** (host-proxied) because many public
   APIs reject `Origin: null` requests from sandboxed frames.

**Message envelope (single shared shape, versioned):**
```typescript
// sandbox/contract.ts
interface BridgeEnvelope<D = unknown> {
  v: 1;                       // protocol version
  from: string;               // "host" | "widget"
  nonce: string;              // per-widget random secret injected at srcdoc build
  type: string;
  payload?: D;
}

// Host → Widget (host posts to iframe.contentWindow with targetOrigin "*")
type HostPush =
  | { type: 'theme';  payload: Theme }                       // tokens: colors, fonts, radii
  | { type: 'size';   payload: { width: number; height: number } } // px of the frame content box
  | { type: 'config'; payload: Record<string, unknown> }     // this widget's own config slice
  | { type: 'ping' };                                        // liveness probe

// Widget → Host (widget posts to window.parent; host validates source + nonce)
type WidgetReport =
  | { type: 'ready';   payload: { apiVersion: 1 } }           // handshake after boot
  | { type: 'error';   payload: { message: string } }         // widget crashed → show fallback
  | { type: 'log';     payload: { level: 'info'|'warn'|'error'; args: unknown[] } }
  | { type: 'request-theme' }                                 // re-push (rare, for robustness)
  | { type: 'request-size' };
```

**`window.DeskMate` API surface (injected by bootstrap into every srcdoc):**
```typescript
// sandbox/bootstrap.ts — prepended to user code inside the srcdoc
interface DeskMateAPI {
  getTheme(): Theme;                                          // sync snapshot
  onThemeChange(cb: (t: Theme) => void): () => void;          // returns unsubscribe
  getSize(): { width: number; height: number };
  onResize(cb: (s: { width: number; height: number }) => void): () => void;
  getConfig(): Record<string, unknown>;                       // this widget's settings
  onConfigChange(cb: (c: Record<string, unknown>) => void): () => void;
  fetch(url: string, init?: RequestInit): Promise<Response>;  // host-proxied (extension point)
  notifyError(err: unknown): void;                            // forwards to host fallback UI
}
```

**Host-side bridge router (the pattern):**
```typescript
// sandbox/bridge.ts
const frames = new Map<string, { win: Window; nonce: string }>();

window.addEventListener('message', (event) => {
  const entry = [...frames.entries()].find(([, e]) => e.win === event.source);
  if (!entry) return;                                  // 1. source identity: not one of our iframes
  const [widgetId, { nonce }] = entry;
  const msg = event.data as BridgeEnvelope;
  if (msg.nonce !== nonce) return;                     // 2. nonce: not this widget's channel
  if (msg.from !== 'widget') return;                   // 3. direction
  switch (msg.type) {
    case 'ready':  pushTheme(widgetId); pushSize(widgetId); break;
    case 'error':  useConfigStore.getState().markWidgetFailed(widgetId, msg.payload.message); break;
    case 'log':    console[msg.payload.level](`[widget:${widgetId}]`, ...msg.payload.args); break;
    default:       /* ignore unknown types */ break;
  }
});
```

**Widget lifecycle (owned by `WidgetFrame` + bridge):**

| Phase | What happens | Failure mode / guard |
|-------|--------------|----------------------|
| **Mount** | Build srcdoc from `instance.code` + bootstrap (fresh nonce); register frame in bridge map; render iframe with `sandbox="allow-scripts"` | Iframe `load` fires even on failure (spec) — rely on `ready` handshake, not `load` |
| **Boot** | Bootstrap defines `window.DeskMate`, wraps `window.onerror`, then user script runs; widget posts `ready` | `ready` timeout (e.g. 5 s) → host shows "widget did not start" fallback |
| **Update** | Host pushes `theme`/`config`/`size` via postMessage — **no iframe reload** | Reloading on every keystroke/theme change = flicker + iframe churn; avoid |
| **Resize** | Host measures RGL item box (ResizeObserver / `onLayoutChange`) → pushes `size` | Widget must re-layout on `size`; document that it's px, not grid units |
| **Crash** | Bootstrap `window.onerror` → post `error`; host swaps in error fallback UI inside the same frame shell | The iframe is not destroyed — the app and other widgets stay alive |
| **Unmount** | Remove frame from bridge map; drop iframe element (destroys browsing context + all its timers/workers) | Leaked frames = memory growth; must happen on widget remove *and* config import |

### Pattern 4: Versioned Config Codec — one schema, three transports

**What:** `DashboardConfig` has a `version` field. zod validates/sanitizes on every load path
(localStorage, URL param, imported file). Unknown widget types are preserved but not rendered
(marked "unsupported") so configs survive round-trips between app versions.
**When to use:** Any app that exports/imports config and shares it via URL — the schema *is* the
contract with users and with future app versions.
**Trade-offs:** A version bump needs a migration function; forgetting it breaks old configs. Keep
migrations in `storage.ts` keyed by `version`.

```typescript
// config/schemas.ts
const dashboardConfigSchema = z.object({
  version: z.literal(1),
  theme: themeSchema,
  layout: z.record(z.string(), z.array(layoutItemSchema)),   // breakpoint → RGL layout
  widgets: z.array(widgetInstanceSchema).max(50),            // cap: iframe memory budget
});
```

### Pattern 5: Responsive Split — Grid vs Single-Widget View

**What:** The Dashboard View picks a presentation mode from the measured container width:
multi-widget RGL grid on large screens, a single selected widget fullscreen on phones.
**When to use:** The product requirement ("single full-screen widget on small/mobile screens") is a
*presentation* decision, not a config decision — the same `DashboardConfig` must render in both.
**Trade-offs:** A bespoke `SingleWidgetView` is simpler and more battery-friendly than forcing a
12-column grid into 4 columns; but you lose drag/rearrange on mobile (acceptable — edit mode can
still be reachable).

## Data Flow

### Boot Flow (shared by every entry point — this IS the URL-any-device story)

```
Page load
  ↓
[urlParams.ts]  read ?config= (and ?mode=)
  ├─ has config param ──→ [urlCodec.decode] ──→ [validator] ──→ store.importConfig (ephemeral, no save)
  └─ no param ─────────→ [storage.load] ──→ [validator] ──→ store (first run → defaultConfig)
  ↓
[App] decide view: container width < 600px → SingleWidgetView, else DashboardGrid
  ↓
[DashboardGrid] renders layout from store → WidgetFrame per widget → renderer per registry type
  ↓
[services] wakeLock.request('screen') if display mode; fullscreen if requested
```

### Edit → Persist Flow

```
User drags/resizes widget
  ↓
[RGL onLayoutChange] → store.setLayout(newLayout)
  ↓
[storage.ts subscription] debounced (~500ms) JSON.stringify → localStorage.setItem('deskmate:config')
  ↓
export: store.config → JSON → Blob download      import: File → validator → store.importConfig
```

Persistence is **debounced** because localStorage is synchronous and a drag fires dozens of layout
changes per second — writing every event blocks the main thread and janks the dashboard.

### Host ↔ Widget Message Flow (iframe widgets only)

```
Host                                       Widget (sandboxed srcdoc)
 │  build srcdoc (nonce N) + render frame   │
 │  ── register in bridge map ────────────→ │ bootstrap runs: defines window.DeskMate
 │  ◄──────── postMessage {ready, nonce:N} ─┤ user script runs
 │  validate source+nonce → push theme+size │
 │  ── {theme} {size} (targetOrigin "*") ──→│ DeskMate callbacks fire
 │  ◄──────── {log} / {error} ──────────────┤ onerror → notifyError
 │  on store change: push {config}/{theme}  │
 │  on layout change: push {size}           │
 │  unmount: drop frame from map + DOM      │ browsing context destroyed
```

### Key Data Flows

1. **Boot (any device, any source):** URL param OR localStorage OR imported file → validator →
   store → grid → frames. Same schema, same render path — this is what makes "one URL on any
   device renders the exact config" hold without a backend.
2. **Edit:** RGL callback → store action → re-render + debounced persistence. Layout is the only
   data that originates in the grid; everything else originates in the store.
3. **Runtime widget updates:** store change → bridge → postMessage push → DeskMate callbacks in the
   sandbox. Never reload the iframe.
4. **Failure:** widget `error` message → fallback UI in that frame only; `ready` timeout → same.

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 1 device, 1–10 widgets | Monolith as designed. One RGL grid, all iframes eager. No tuning needed. |
| 1 device, 10–50 widgets | Iframes become the bottleneck (each ≈ 5–20 MB in Chromium). Defer/lazy iframes below the fold (`loading="lazy"`), push `size`/`theme` deltas instead of reloading, memoize RGL children. Swap in fast compactors from `react-grid-layout/extras` if layout math gets slow. |
| 50+ widgets / display walls | Pause off-screen iframes (host signals `hidden`, bootstrap suspends rAF), cap concurrent custom iframe widgets in config validation, and/or batch `theme`/`size` pushes. Still zero-server. |

### Scaling Priorities

1. **First bottleneck: iframe count.** Every custom widget is a full browsing context. Mitigate by
   capping `widgets` in the schema, lazy-loading, and never recreating iframes for theme changes.
2. **Second bottleneck: main-thread jank from localStorage writes.** Synchronous `setItem` during
   drags. Mitigate with debounced saves and keeping the persisted blob small (lz-string the config
   if it exceeds ~100 KB).
3. **Third: RGL layout math with many items.** Standard compaction is O(n²); swap in the bundled
   fast compactors if a dashboard ever exceeds ~200 items (benchmarked up to 74× faster).

## Anti-Patterns

### Anti-Pattern 1: `sandbox="allow-scripts allow-same-origin"`

**What people do:** Add both tokens because "widgets need to fetch stuff."
**Why it's wrong:** With both, the embedded document can remove its own `sandbox` attribute — the
untrusted widget escapes to full host privileges (DOM, cookies, localStorage). This is a remote
code-execution hole, not a bug.
**Do this instead:** `sandbox="allow-scripts"` only. Give widgets `DeskMate.fetch()` (host-proxied)
for network needs.

### Anti-Pattern 2: Trusting `event.origin` to identify widgets

**What people do:** `if (event.origin !== 'https://deskmate.app') return;` in the host's message handler.
**Why it's wrong:** Sandboxed srcdoc frames report `origin === "null"` — *every* widget has the same
origin string. An origin check lets any widget impersonate any other (and any random iframe pass).
**Do this instead:** Verify `event.source` is one of the registered `iframe.contentWindow`
references, AND require the per-widget nonce echoed in every message. Only then dispatch.

### Anti-Pattern 3: Recreating the iframe on every theme/config change

**What people do:** Keying the iframe on the theme object, or re-rendering srcdoc when config edits.
**Why it's wrong:** Each recreation tears down and rebuilds a browsing context — visible flash,
lost widget state, and heavy GC pressure on a dashboard that should sit there for hours.
**Do this instead:** Build the srcdoc once per widget instance; push all updates over postMessage.

### Anti-Pattern 4: Saving to localStorage inside drag/resize callbacks

**What people do:** `onLayoutChange={(l) => localStorage.setItem('layout', JSON.stringify(l))}`.
**Why it's wrong:** Synchronous storage writes on every drag frame block rendering; multiple
keys fragment state so "one config" becomes unachievable.
**Do this instead:** Central store + debounced subscription writing one versioned key.

### Anti-Pattern 5: Storing widget code inline in the URL config

**What people do:** Put the full HTML/CSS/JS of custom widgets into `?config=`.
**Why it's wrong:** URLs hit length limits (~2–16 KB depending on server/proxy); a widget's code is
commonly 10–100 KB. The shared URL silently breaks.
**Do this instead:** Put **only the widget instance's settings** (not code) in the URL; for BYOW
dashboards, share via exported JSON. Encode `?config=` with lz-string and cap around ~8–10 KB of
decoded payload; past that, steer the user to export/import.

### Anti-Pattern 6: Evaluating user code in the host page

**What people do:** `new Function(userCode)()` or `dangerouslySetInnerHTML` + inline scripts in the app DOM.
**Why it's wrong:** Runs with full host privileges — XSS on every dashboard load.
**Do this instead:** srcdoc + sandbox iframe, always. The host never executes user code.

### Anti-Pattern 7: Full-page routing / SPA router for a kiosk app

**What people do:** Reach for react-router with distinct pages for "dashboard", "edit", "display".
**Why it's wrong:** A kiosk has effectively one screen; URL paths fight with the `?config=` sharing
story and add a reload/`beforeunload` wake-lock hazard.
**Do this instead:** Single page; view *modes* derived from state (`edit`/`display`) plus a query
flag for sharing. Only the query param changes, never the route.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| GitHub REST API (public, unauthenticated) | Native widget only (`widgets/github/`) fetches on an interval with caching | ~60 req/hr rate limit → cache last-good response + timestamp in-memory; render stale data with a "refresh failed" note; never let a failed fetch clear the widget |
| Screen Wake Lock API | `services/wakeLock.ts`: feature-detect `'wakeLock' in navigator`; request on display-mode entry; re-acquire on `visibilitychange`; `release` event → update UI indicator | Secure context only; auto-released when tab hidden; provide a visible on/off toggle (MDN guidance); do **not** expose to iframe widgets |
| Fullscreen API | `services/fullscreen.ts`: `document.documentElement.requestFullscreen()` on user gesture; track exit to restore normal chrome | Must be triggered by a user gesture; wake-lock and fullscreen are separate concerns, both optional in display mode |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Config Store ↔ Storage/URL/Transfer | Store actions + subscription side-effects | Store never touches `localStorage`/URL directly; transports import into the store |
| Store ↔ WidgetFrame/Renderers | zustand subscription (props for native; bridge pushes for iframe) | Native widgets get props; iframe widgets get messages — the registry hides which |
| Bridge ↔ iframe | `window.postMessage` (both directions) | `source` identity + nonce validation mandatory; `targetOrigin "*"` host→widget only because the target is a held `contentWindow` reference |
| Bridge ↔ Store | `useConfigStore.getState()` / subscribe | Keeps bridge React-free and unit-testable |
| Grid ↔ WidgetFrame | RGL layout items keyed by widget id | `layout[i]` (`i` = widget id) must equal child `key`; layout and widget list are two arrays in the config that must stay in sync — the store action `addWidget`/`removeWidget` updates both atomically |

## Build Order

Component dependency graph (arrow = "depends on"):

```
schemas/validator ──→ storage ──→ store ──→ DashboardGrid ──→ WidgetFrame
      │                    │        │                              │
      │                    ▼        ▼                              ▼
      └──→ urlCodec ──→ transfer   theme ───────────────→ NativeWidgetRenderer
                                         registry ───────→ IframeWidgetRenderer → bridge → bootstrap
                                         services (wakeLock, fullscreen) ← App shell
```

Suggested build order (each step is independently testable):

1. **Config core:** `types.ts` + zod `schemas.ts` + `defaultConfig.ts`. Nothing renders yet.
2. **Store + storage:** `store.ts`, `storage.ts` (load/save/debounce/migrate). Persist a hardcoded
   config; reload the page and see it survive. (RGL's official localStorage demos confirm this
   pattern.)
3. **Grid + frame:** `DashboardGrid.tsx` + `WidgetFrame.tsx` rendering one native widget type from
   the registry. Now the app visualizes config.
4. **Native widgets:** clock (trivial, proves registry), then pomodoro, then GitHub Pulse (proves
   failure-tolerant network widget).
5. **Theme:** `theme/` tokens + provider; push into native widget props.
6. **URL + transfer:** `urlCodec.ts` (lz-string), `transfer.ts`, `urlParams.ts` in the shell. Now
   "one URL on any device" and export/import work — the core value is testable end-to-end.
7. **Sandbox + bridge:** `contract.ts`, `bootstrap.ts`, `bridge.ts`, `IframeWidgetRenderer.tsx`
   with the nonce handshake and fallback UI. The BYOW differentiator.
8. **Services + display mode:** `wakeLock.ts`, `fullscreen.ts`, edit/display mode toggle.
9. **BYOW editor** (later phase): code editor → save as widget instance → registry's iframe path renders it.

**Ordering rationale:** steps 1–3 make the config→grid pipeline real before any widget exists;
step 4 proves extensibility with the registry; step 6 delivers the core "unique URL on any device"
value *before* the sandbox, so the risky security work (7) lands on top of a working app rather
than blocking everything else. The bridge (7) is the only step that needs its own deep-dive spike
(multi-browser postMessage + srcdoc behavior) — schedule it as a research flag, not a surprise.

## Sources

- **react-grid-layout v2** (official README): v2 hooks API, Responsive breakpoints, layout
  serialization + localStorage demos, compactor performance benchmarks, Grafana/Kibana/Metabase usage.
  Confidence: HIGH — https://github.com/react-grid-layout/react-grid-layout
- **MDN — Window.postMessage()**: mandatory origin/source verification, `targetOrigin "*"` risks,
  opaque origins of `data:`/`javascript:` documents, structured-clone serialization.
  Confidence: HIGH — https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage
- **MDN — `<iframe>`**: `sandbox` token semantics, the `allow-scripts` + `allow-same-origin`
  escape warning, `srcdoc` mechanism (about:srcdoc location, base URL inheritance), `load` event
  fires even on failed loads, memory cost of iframes.
  Confidence: HIGH — https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe
- **MDN — Screen Wake Lock API**: `WakeLockSentinel` lifecycle, `visibilitychange` re-acquisition,
  secure-context requirement, Permissions Policy, "release when activity ends" guidance.
  Confidence: HIGH — https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API
- **MDN — Window.localStorage**: synchronous API, origin + protocol scoping, `SecurityError` when
  storage is blocked (cookies disabled / `file:` scheme).
  Confidence: HIGH — https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage

---
*Architecture research for: DeskMate — client-side smart-dashboard / kiosk web app*
*Researched: 2026-08-07*

