# Pitfalls Research: DeskMate

**Domain:** Client-side smart-dashboard / digital-signage web app (React + Vite, zero backend)
**Researched:** 2026-08-07
**Confidence:** HIGH (verified against MDN, Chrome, GitHub, nginx, and react-grid-layout official docs; browser-specific URL limits marked MEDIUM)

> How to read this file: each critical pitfall names the *specific mistake* DeskMate projects
> commonly make in this domain, why it happens, how to prevent it, how to detect it early, and
> which phase must address it. "Phase" names assume the natural build order (Scaffold → Grid &
> Persistence → Native Widgets → Sandbox/BYOW → Kiosk & Polish); rename to match the actual
> roadmap but keep the dependencies.
>
> Complements `ARCHITECTURE.md` — that file defines the correct sandbox/bridge design; this file
> catalogues the mistakes that break it.

---

## Critical Pitfalls

### Pitfall 1: Over-permissioned iframe sandbox — `allow-scripts` + `allow-same-origin` together

**What goes wrong:**
A custom widget escapes its sandbox and gains full access to the host page: reads/writes the
host's `localStorage`, mutates the host DOM via `window.parent`, calls host functions, and can
persist a rogue payload that survives reloads. The "open one URL on any device" core value then
becomes "one XSS beacon on any device."

**Why it happens:**
- `srcdoc` iframes resolve relative URLs and inherit the **parent's origin as their base URL**
  (MDN: `about:srcdoc` uses the embedding document's URL as base URL). Developers see a same-origin
  frame and add `allow-same-origin` so the widget "can access localStorage" or fetch without CORS
  pain.
- MDN's explicit warning is easy to miss: *"When the embedded document has the same origin as the
  embedding page, it is strongly discouraged to use both `allow-scripts` and `allow-same-origin`,
  as that lets the embedded document remove the `sandbox` attribute."* `allow-same-origin` + the
  inherited same origin = the widget can do `sandbox` attribute removal and read `window.parent`.
- Copy-paste from Stack Overflow answers that pre-date these rules (many show `sandbox="allow-scripts allow-same-origin"`).

**How to avoid:**
- **Non-negotiable:** `sandbox="allow-scripts"` *only*, per `ARCHITECTURE.md` Pattern 3. Never
  add `allow-same-origin`. The frame gets an opaque origin (`Origin: null`); it cannot see parent
  DOM, cookies, or storage.
- If a widget legitimately needs storage or theme state, expose it through the `window.DeskMate`
  postMessage API (host-proxied) — never by loosening the sandbox.
- Treat the sandbox token set as a **single constant** (`SANDBOX_TOKENS = "allow-scripts"`) defined
  in one file, and unit-test that the rendered iframe attribute equals that constant. A test that
  asserts the exact `sandbox` string prevents future "quick fix" additions.
- Add a one-line code comment at every iframe render site: `// NEVER add allow-same-origin`.

**Warning signs:**
- A code review comment asking "why can't the widget read localStorage?" → that is the moment
  someone adds the token.
- `event.origin === "null"` in the bridge logs is *correct* behavior — if you see engineers
  "fixing" origin checks, that's the smell.
- Widgets written by users that do `window.parent.document` or `document.cookie` in their code and
  "work" → the sandbox is already broken.

**Phase to address:** Phase 4 (Sandbox & BYOW) — enforced at renderer build time; regression-test
in the same phase's verification (attempt a sandbox-escape widget in tests).

---

### Pitfall 2: postMessage bridge with origin checks only — opaque origins break them

**What goes wrong:**
The host trusts messages from "any origin that looks like ours" and a widget — or any other tab/iframe
on the machine — injects fake `ready`/`error` messages, spoofs widget reports, or (worse) the host
pushes theme/config to a navigated-away iframe, leaking config to an attacker-controlled page.

**Why it happens:**
- Standard postMessage guidance says "always check `event.origin`." For **sandboxed `srcdoc`
  iframes the origin is always `"null"`** — so an origin allowlist is useless and developers either
  skip the check (dangerous) or try to compare against `"null"` (accepts any sandboxed sender).
- After a widget triggers a navigation (e.g., a link that didn't have `allow-top-navigation` still
  navigates *the iframe itself*), `event.source` is no longer the original `contentWindow`, and
  cross-frame references become cross-origin errors on the next access.
- The message contract grows ad hoc (strings like `"hi"` / `"data"`) with no direction/version/nonce,
  so nothing can be validated.

**How to avoid:**
- Follow the bridge design in `ARCHITECTURE.md` Pattern 3 exactly:
  1. **Source identity:** verify `event.source === iframe.contentWindow` (exact reference match
     against the known frame map), not `event.origin`.
  2. **Nonce:** embed a per-widget random secret in the srcdoc bootstrap; require it in every
     inbound message. A fresh nonce per mount means a captured message can't be replayed after a
     widget reloads.
  3. **Direction + version:** envelope with `{ v: 1, from: "host"|"widget", nonce, type, payload }`;
     ignore anything with the wrong `from` or unknown `type`.
  4. Ignore (don't throw on) malformed messages — attackers can flood; the handler must be cheap.
- Sending outbound: `iframe.contentWindow.postMessage(msg, "*")` is correct here *because* you hold
  the direct window reference and verify inbound by source — document this so a reviewer doesn't
  "fix" `"*"` to a literal origin and break everything silently.
- Version the contract (`v: 1`) so old persisted widget code still boots against a newer bridge.

**Warning signs:**
- Bridge code containing `event.origin` comparisons against `"null"`.
- Any `postMessage` call with a hardcoded `targetOrigin` string in host→iframe direction.
- Console errors like "Failed to execute 'postMessage' on 'DOMWindow'" appearing after theme changes.

**Phase to address:** Phase 4 (Sandbox & BYOW) — the bridge is built with the contract from day one;
verified with a spoofing test (a decoy iframe posting `ready` with a guessed nonce must be ignored).

---

### Pitfall 3: Widget lifecycle neglect — iframe `load` misuse, leaky timers, zombie frames

**What goes wrong:**
- A widget that fails to render shows a **blank tile forever** — no error fallback — because the
  iframe `load` event fires even when the content fails (MDN: user agents do not fire `error` on
  iframes, and `load` always fires), so "did the widget start?" can't be answered by `load`.
- Removing a widget leaves its iframe alive (or its `setInterval`/`fetch` loops running): memory
  grows on every edit, and a GitHub-fetching widget keeps hammering the API after being deleted.
- On config import (URL/file), the old widgets' frames aren't torn down before new ones mount —
  duplicate frames and two bridge maps fight over `event.source`.

**Why it happens:**
- Developers treat iframes like images: `onLoad` → "it's ready." The correct readiness signal for a
  scripted widget is the widget's own `ready` handshake message, but that requires building the
  bridge (Pitfall 2) first, so teams ship `onLoad` as a placeholder and never replace it.
- No explicit unmount routine: removing a React child removes the DOM node, but intervals created
  inside the frame keep running until the browsing context is destroyed — and React unmount alone
  does not guarantee immediate teardown of async work in the frame.
- Keyboard-driven dev ("it works when I refresh") masks the leak because refresh destroys frames.

**How to avoid:**
- **Readiness:** rely on the `ready` handshake (postMessage) with a timeout (e.g., 5 s) → swap in
  the "widget did not start" fallback UI inside `WidgetFrame`. `load` is never the readiness signal.
- **Crash:** bootstrap wraps `window.onerror`/`unhandledrejection` → posts `error` → host shows the
  error fallback *without destroying the frame* (so other widgets stay alive).
- **Teardown:** in `WidgetFrame` unmount: (1) unregister the frame from the bridge map, (2) null the
  `src`/remove the iframe element to destroy the browsing context and all its timers/workers,
  (3) `clearTimeout` for the ready-timeout. Do the same on config import before mounting new frames.
- Add a dev-only "widgets alive" panel (counts registered bridge frames) to make leaks visible.

**Warning signs:**
- "Widget shows blank until I refresh" bug reports.
- Memory profile climbing while repeatedly adding/removing the same widget in edit mode.
- Network tab shows repeated fetches from a deleted widget's code.
- Bridge map growing after every config import.

**Phase to address:** Phase 4 (Sandbox & BYOW) — lifecycle table in `ARCHITECTURE.md` Pattern 3 is
the spec; verified in phase tests (mount→crash→fallback, mount→unmount→no further network).

---

### Pitfall 4: Wake Lock treated as "set and forget" — dies on visibility change, unsupported on old iOS

**What goes wrong:**
The dashboard dims/locks the screen mid-use: the kiosk "goes to sleep" after the first tab switch,
minimize, or on old iPads/phones where the API doesn't exist at all. The feature appears to work in
the demo (fresh tab, developer's machine) and silently fails in production (a 2019 iPad running the
display, or Low Power Mode on).

**Why it happens:**
- **The lock is auto-released** by the browser when the document becomes hidden (MDN + Chrome docs:
  "screen wake locks are automatically released when you minimize a tab or window, or switch away").
  The classic bug: acquire once at mount, never listen for `visibilitychange`, never reacquire.
- **iOS Safari supported wake lock only from 16.4** (caniuse; WebKit bug 205104). Older iPads/iPhones
  — exactly the "old phone as a smart display" target audience — have no API. `navigator.wakeLock`
  is `undefined`, and code that doesn't feature-detect throws or silently no-ops.
- **Secure context required:** `navigator.wakeLock` only exists over HTTPS (or localhost). Serving
  the display URL over plain HTTP (old router / LAN hosting) kills the API even on new devices.
- **System rejection:** requests can be rejected or the sentinel auto-released for battery/low-power
  reasons (MDN: "battery power is too low", "power save mode"). Mobile Low Power Mode is common on
  old devices — precisely the target devices.
- No `try/catch` around `request()` → an unhandled `NotAllowedError` rejection on a stale sentinel.

**How to avoid:**
- Build a `WakeLockService` per `ARCHITECTURE.md`: feature-detect, request with `try/catch`, **keep
  the sentinel reference**, listen for its `release` event, and **reacquire on
  `visibilitychange` when `document.visibilityState === "visible"`** (the MDN-recommended pattern).
- Gate acquisition on a real **user gesture** (e.g., the "Keep screen on" toggle or the fullscreen
  button click). This satisfies gesture-sensitive implementations, and the toggle doubles as the
  audible chime unlock (see Pitfall 8) — one interaction, two unlocks.
- Show UI state: active / unsupported / blocked-by-battery, with a fallback hint ("Enable auto-lock
  off in iOS Settings" on pre-16.4 devices, "Disable Low Power Mode" when blocked).
- Never call `request()` while the document is hidden (it rejects); re-request on `visibilitychange`.
- Add a display-mode test page note: verify wake lock actually holds for 10+ minutes on each target
  device class — this is the "looks done but isn't" trap in its purest form.

**Warning signs:**
- `document.hidden` transitions during dev (switching tabs to check something) → screen sleeps after.
- Console: `NotAllowedError` from `wakeLock.request()` — almost always hidden-document or
  permissions-policy; `SecurityError`/undefined → non-HTTPS.
- Test device older than iOS 16.4 shows the "keep awake" toggle but the screen still sleeps.

**Phase to address:** Phase 5 (Kiosk & Polish) — service exists behind a feature gate from day one,
but the kiosk mode that actually exercises long-horizon visibility behavior lands here; includes
the 10-minute soak test on an old device.

---

### Pitfall 5: GitHub Pulse widget exhausts the 60 req/hr unauthenticated budget

**What goes wrong:**
After ~20 minutes of refreshing, every GitHub widget on every dashboard shows a permanent error.
Worse: the refresh loop keeps retrying on the failure, hitting secondary rate limits, and the app's
"graceful degradation" requirement (cached/sample data) is unmet because no cache exists yet.

**Why it happens:**
- **60 requests/hour, per originating IP, unauthenticated** (GitHub docs). Not per user, per app,
  per dashboard — per IP. An office/NAT household where two DeskMates run = shared budget.
- Budget math: repo stats + issues + commits = ~3 requests per refresh cycle. At a naive 1-minute
  refresh, one widget burns 180 req/hr. Even a 5-minute refresh with 2 GitHub widgets exceeds 60/hr.
- **No conditional requests:** GitHub recommends `If-None-Match` with the `ETag` from the previous
  response; a `304 Not Modified` **does not count against the primary rate limit** (GitHub docs).
  Skipping this is the single biggest budget waste.
- **No caching layer:** the widget refetches from scratch on every mount instead of showing cached
  data with a "last updated" timestamp.
- **Search endpoints** (`/search/repositories` etc.) have far stricter unauthenticated limits
  (10/min) — a "commit streak" feature built on search is a guaranteed rate-limit bomb.
- Retry storms: on `403`/`429` with `x-ratelimit-remaining: 0`, naive code retries immediately.
  GitHub's docs: continuing to make requests while rate-limited **may result in the banning of your
  integration** (per-IP ban here).

**How to avoid:**
- **Never disable the cache before disabling the retry:** cache last-good payload + timestamp;
  render stale data with "updated N min ago" on any fetch failure. This satisfies the offline
  requirement without any network calls.
- **Conditional requests:** store `ETag`; send `If-None-Match`; handle `304` (reuse cache, do not
  count it as a refresh) and `200` (replace cache, store new ETag). Same for `Last-Modified` /
  `If-Modified-Since`. Keep request params identical across polls (GitHub: changed params change the
  ETag → fewer 304s).
- **Read the headers:** parse `x-ratelimit-remaining` and `x-ratelimit-reset` (epoch seconds) from
  every response; when `remaining` hits 0, **stop polling until `reset`** and surface a countdown in
  the widget UI ("rate limit resets in 14 min").
- **Refresh cadence ≥ 3 minutes** for a single-widget config as a hard floor, and make the interval
  adaptive: `min(refreshMs, timeUntilReset / requestsPerRefresh)`.
- **Avoid search endpoints entirely** in v1; use resource endpoints (`/repos/{owner}/{repo}`,
  `/repos/{o}/{r}/issues`, `/repos/{o}/{r}/commits`).
- Serialize requests (GitHub secondary limits penalize concurrency) and never retry on `403`/`429`
  without honoring `retry-after`/`reset`.
- Document that multiple GitHub widgets share one budget; consider a single shared GitHub client
  module that dedupes identical fetches across widgets.

**Warning signs:**
- `403`/`429` with `x-ratelimit-remaining: 0` appearing in the network tab.
- Widget error text "API rate limit exceeded" shown to users as a *terminal* state.
- Two GitHub widgets refreshing at the same cadence (double fetch of the same repo).
- Poll interval shorter than the widget's request count × (60/60min).

**Phase to address:** Phase 3 (Native Widgets) — the fetch layer (ETag cache, header parsing, adaptive
backoff) is built when GitHub Pulse is built; verified by a "budget simulator" test that asserts a
2-widget config stays under 60/hr over a simulated hour.

---

### Pitfall 6: localStorage as unguarded JSON — corrupt config bricks the dashboard

**What goes wrong:**
A user's dashboard fails to load with a white screen or a grid crash. Root cause: stored JSON was
corrupted (crash mid-write, manual edit, browser sync), a key is missing, an array is `null`, or a
string is `"null"`/`"undefined"` — and `JSON.parse` / `setItem` threw, or the grid consumed a
malformed layout and threw during render.

**Why it happens:**
- **`setItem` throws** (`QuotaExceededError`) — and it throws *in private mode where quota is 0*
  (MDN: "some browsers might give us an empty localStorage object with a quota of zero"). iOS
  private browsing is exactly where a demo user tests "open on another device." Uncaught → whole app
  breaks on save.
- **`JSON.parse` throws** on any hand-edited or truncated value; calling code often doesn't wrap it.
- **No schema validation:** the app trusts the stored shape. Any future version that adds a field,
  renames a key, or changes an enum silently breaks old stored configs. `"foo"` stored where an
  array is expected → `.map is not a function` at render.
- Direct property access (`localStorage.foo = ...`) collides with built-ins and risks prototype
  pollution (MDN explicitly warns against it).
- Storage is per-origin: the same app deployed on two origins (e.g., `https://example.com` and a
  GitHub Pages alias) appears to "lose" configs — user blame lands on persistence.

**How to avoid:**
- Use the MDN `storageAvailable()` guard before any storage use (try `setItem`/`removeItem` of a
  probe key, catch `QuotaExceededError`), and **wrap every `setItem`/`getItem`/`JSON.parse` in
  try/catch** in the Storage Adapter — the adapter is the only place allowed to touch storage.
- **Versioned schema + migrations** (already in `ARCHITECTURE.md` Pattern 4): store
  `{ version: 1, ... }`; on load, run `validateConfig()` (zod); on failure, try migrations
  keyed by version, then **fall back to defaults** — never throw and never render unvalidated data.
- On any parse/validation failure, **preserve the raw string** in a `config.backup` key before
  overwriting, so a broken-but-recoverable config isn't destroyed by the repair.
- Always use `getItem`/`setItem` methods, never property access.
- Write through the debounced subscription (per `ARCHITECTURE.md`) so a crash mid-write can't leave
  a truncated value — but still validate on read, because external factors (user edit, sync
  conflicts) bypass the writer.
- Keep storage keys namespaced (`deskmate.config.v1`) to survive future app renames and to make
  manual recovery easy.

**Warning signs:**
- Any `localStorage` access outside the `config/storage.ts` adapter (grep for it in review).
- `QuotaExceededError` in test logs on a device with private browsing enabled.
- A stored `DashboardConfig` that fails `zod.safeParse` in a console one-liner.
- Users reporting "my widgets reset" after a version bump → missing migration.

**Phase to address:** Phase 2 (Grid & Persistence) — the adapter + validator + migrations are built
when persistence is first wired; hardened in Phase 4 when configs grow (custom widget code is large).

---

### Pitfall 7: URL-encoded configs exceed the request-line limit → "one URL" 414s

**What goes wrong:**
The share-a-config URL feature produces URLs that fail with **HTTP 414 (Request-URI Too Large)** on
real deployments. The URL works in dev (`localhost` has no 8KB header limit or the dev server
tolerates it) and breaks in production, or breaks when the config grows past a few widgets with
custom code.

**Why it happens:**
- **nginx default: `large_client_header_buffers 4 8k`** — "A request line cannot exceed the size of
  one buffer, or the 414 error is returned" (nginx docs). That's **8 KB for the whole request line,
  including scheme + host + path**. Apache's `LimitRequestLine` defaults to ~8190 bytes too. Many
  static hosts / CDNs / proxies sit at 8–16 KB.
- Browsers are more generous (Chrome handles ~2 MB, Safari ~80 KB in practice), so the URL renders
  and even opens locally — the failure is at the *server*, invisible in dev.
- **Percent-encoding inflates size:** JSON with quotes, braces, spaces, and non-ASCII can expand
  2–3× when `encodeURIComponent`-ed. A 20 KB config becomes a 50 KB URL instantly.
- No size budget or warning: config grows silently (custom widget HTML/CSS/JS is large), the first
  user to actually paste the URL into another device hits the wall.

**How to avoid:**
- **Compress before encoding** (lz-string → base64url is the `ARCHITECTURE.md` choice). Compression
  is not optional for this feature: a few widgets of custom code will otherwise exceed 8 KB.
- **Enforce a hard encoded-size cap** in the URL Codec (e.g., 6 KB encoded to stay under the 8 KB
  request-line with headroom for scheme/host/path). When the config is too big: **do not produce the
  URL** — show the export/import JSON path instead (already a planned feature), or a truncated
  "core config" URL plus a note.
- Make the cap **config-driven and tested**: a unit test encodes a worst-case config (max widgets ×
  max custom code) and asserts the encoded length is under the cap; a second test asserts the app
  degrades gracefully (export fallback) past the cap.
- Test the deployed host early — deploy a probe page with a long query param in Phase 2 and confirm
  the actual production limit; CDNs in front may be stricter than nginx's 8 KB.
- In the share UI, display the URL length and warn ("URL is 5.9 KB — will fail on some hosts").

**Warning signs:**
- Share URL contains visibly long percent-encoded runs of `%22` (quotes) — encoding is naive.
- A user reports "the link works on my machine but not on the TV/phone."
- 414 responses in the deploy host's access log.
- Config grows faster than the cap because custom widget code is stored verbatim in the config.

**Phase to address:** Phase 2 (Grid & Persistence) — the URL Codec + cap + export fallback land with
the share feature; re-verified in Phase 4 when custom widget code makes configs large.

---

### Pitfall 8: Pomodoro chime assumes audio will autoplay

**What goes wrong:**
The Pomodoro timer reaches zero, the session ends, and **no sound plays** — silently, in a
background-ish or first-load context. Users miss the notification; the "audio chime" requirement is
a no-op. Or: the audio plays once in the developer's browser (MEI/engagement history) and never on
the kiosk device with a fresh profile.

**Why it happens:**
- Chrome's autoplay policy: **autoplay with sound requires the user to have interacted with the
  domain**, crossed the Media Engagement Index threshold (desktop only, based on *prior* media use),
  or installed the PWA (Chrome docs). A fresh kiosk profile has none of these.
- **Web Audio is also gated** since Chrome 71: an `AudioContext` created before any user gesture
  starts in `"suspended"` state and `start()` produces silence until `resume()` after a gesture.
- iOS Safari requires a user gesture for audio playback on `<audio>` too.
- The `play()` promise rejects (`NotAllowedError`) when blocked — code that calls `play()` without
  awaiting/catching shows the failure as an unhandled rejection or, worse, an ignored one.

**How to avoid:**
- Treat the first user interaction as the unlock moment: the "Keep screen on" / fullscreen toggle
  (already needed for wake lock, Pitfall 4) or a dedicated "Test sound" button in Pomodoro settings
  **both call `audio.play().catch(...)` and `audioCtx.resume()` inside the gesture handler**. One
  gesture unlocks wake lock + audio together.
- Track unlock state (`hasUserGesture` in the store); only schedule real audio after unlock;
  show a subtle "sound enabled" hint before the first interaction.
- Use an `<audio>` element (not just Web Audio) so the unlocked state persists per page session;
  on iOS add `playsinline` to video if any; always **await the `play()` promise** and `.catch` →
  surface a "sound blocked — tap to enable" affordance rather than silence.
- For unattended kiosks on Chrome, document the enterprise policies `AutoplayAllowed` /
  `AutoplayAllowlist` (Chrome kiosk docs) as the ops-level fix — the app should still *not depend*
  on them.
- Verify the chime on a **fresh profile** during phase verification, not the developer's daily
  browser with engagement history.

**Warning signs:**
- `NotAllowedError` (or `AbortError`) in console when the timer hits zero.
- `AudioContext.state === "suspended"` after creation at module load.
- Chime works in dev but not on the "fresh" kiosk device.

**Phase to address:** Phase 3 (Native Widgets) — Pomodoro is built with the unlock-on-gesture
pattern; Phase 5 adds the kiosk/enterprise documentation.

---

### Pitfall 9: Grid renders at default width then jumps (flash), drag handles eaten by iframes

**What goes wrong:**
Two separate but related failures:
1. On first load, the grid renders at react-grid-layout's default width (1280 px in v2's
   `useContainerWidth`) then re-lays-out when the real container width is measured — a visible
   "grid jumps" flash, worst on large monitors and on every widget-size-sensitive breakpoint change.
2. **Dragging a custom widget doesn't work**: the widget is a sandboxed iframe, and the iframe
   swallows pointer/mouse events — the drag handle inside the widget never reaches react-grid-layout,
   or drags start but flicker/teleport because the iframe captures `mousemove`.

**Why it happens:**
- v2's `useContainerWidth` returns `initialWidth: 1280` until the ResizeObserver measures; rendering
  the grid before `mounted` is true renders at that placeholder. Width *is required* in v2 — there is
  no "auto" — so an unmeasured grid must pick a number.
- Drag handles that live inside the sandboxed iframe are invisible to the host: pointer events
  inside a cross-origin frame don't bubble to the host document, and a sandboxed frame's own event
  handlers can't reach out. Teams discover this only after BYOW ships.
- Additional v2 traps: creating the legacy `WidthProvider(GridLayout)` component *inside* render
  (new component identity every render → remount loop, children lose state); not memoizing children
  (grid compares children by reference → full re-render on every store change); unvalidated imported
  layouts (duplicate `i` keys, items with `w: 0` or `x` beyond cols → layout collapse or crash).

**How to avoid:**
- Use v2's `useContainerWidth` with `mounted` gating — render the grid (or a skeleton of equal
  aspect) only after width is measured; do **not** render at 1280 then correct. This is the
  CSR-equivalent of the SSR/hydration width pitfall (this app is client-only, so no literal SSR —
  the trap is the unmeasured-width flash).
- **Never put the drag handle inside the iframe.** The `WidgetFrame` owns a title bar in the host
  DOM (per `ARCHITECTURE.md`); the iframe sits below it. Drag handle = host DOM element → events
  reach RGL. Set `dragConfig.handle = ".widget-titlebar"` and `cancel` for interactive inner bits.
- Create `WidthProvider`-wrapped components once at module scope (or skip it — use the hook);
  `useMemo` grid children; pass immutable callback props (v2 makes callback params read-only).
- Validate imported/persisted layouts with the config validator: duplicate keys, `w < minW`, `h < 1`
  are repaired or rejected *before* hitting the grid (zod + a layout sanitizer in Phase 2).
- Test drag on a real touch device (RGL touch support) and with a sandboxed widget mounted, not just
  native widgets, in Phase 4 verification.

**Warning signs:**
- Console: width jumps logged by the grid hook; layout flicker on cold load.
- A "can't drag my custom widget" bug that only affects iframe widgets.
- `WidthProvider(GridLayout)` appearing inside a component body in review.
- Layout with duplicate `i` keys surviving import (grid renders one, hides the other).

**Phase to address:** Phase 2 (Grid & Persistence) — measurement gating, memoization, and layout
validation land with the grid; the drag-handle-inside-iframe fix is verified in Phase 4 (Sandbox &
BYOW) when the first custom widget ships.

---

### Pitfall 10: Performance collapse on the actual target hardware — old phones as display servers

**What goes wrong:**
The dashboard that's buttery on the dev MacBook is a slideshow on the intended hardware: an
8-year-old Android phone or a cheap laptop running the display 24/7. Grid drags lag, the clock ticks
at 2 fps, widgets reload constantly, the browser kills the tab (iOS is aggressive about reclaiming
memory), or the device runs hot and the battery drains in hours.

**Why it happens:**
- **Every iframe is a complete browsing context** (MDN's own warning: "every iframe requires
  increased memory and other computing resources"). A 12-widget custom dashboard = 12 independent
  documents + JS engines on a device with 2 GB RAM. The 50-widget cap in the config schema is a
  theoretical ceiling, not a performance budget.
- **Timer-driven updates in visible tabs are cheap, but refresh loops are not:** GitHub widgets
  polling on short intervals, clock re-renders at 60 fps (using `requestAnimationFrame` for a
  second-resolution clock), full-grid React re-renders on every store change.
- **Iframes + drag = double rendering cost:** every grid mutation can trigger re-layout of the host
  AND a `size` push message to every widget (which re-lays-out inside the frame).
- **Network on slow devices:** many small requests (fonts, favicons, widget fetches) serialize
  painfully; widgets each loading a web font re-render late.
- Battery-driven throttling: Chrome/Android energy saver throttles timers in background tabs and can
  block wake lock (ties into Pitfall 4); iOS suspends timers aggressively.

**How to avoid:**
- **Budget explicitly:** a "heavy widget" allowance (e.g., ≤ 8 iframe widgets on mobile-class
  devices, ≤ 20 on desktop) surfaced in the UI when exceeded — not a silent limit. Cap custom widget
  code size and network usage at the bridge (`DeskMate.fetch` is host-proxied → host can enforce
  request budgets per widget).
- **Clock: second-resolution via a single 1 s `setInterval` in the host** (timestamp-based render,
  not rAF); one interval drives all clock widgets.
- **Grid: persist on `onDragStop`/`onResizeStop` only**; don't write localStorage mid-drag (writes
  are debounced per `ARCHITECTURE.md` anyway). Memoize children; use transform positioning (default).
- **Widgets: only push `size`/`theme` on actual change** (diff in the bridge); never on every host
  render. Lazy-mount offscreen iframes (`loading="lazy"` on the iframe, plus mount-on-visible for
  the bottom of a long grid).
- **Fonts/network:** self-host the few fonts used; preconnect to `api.github.com`; serialize widget
  fetches; set `fetchpriority` appropriately.
- **Validate on the real target device during phase verification** — performance is a hardware
  property, not a code property. Test the Phase-4 sandbox dashboard on an old phone in edit + display
  mode and record frame times; set a "≤ N ms frame budget" acceptance criterion.
- For 200+ item grids (not expected in v1) note the fast compactors exist, but v1 scale is
  widget-count-bound, not item-bound.

**Warning signs:**
- Browser tab "is unresponsive" / auto-reloads on the target phone.
- `navigator.deviceMemory`-class symptoms (frame drops during drag) — or simpler: use DevTools CPU
  throttling 6× + a 2 GB device emulation for a quick smell test in CI-adjacent QA.
- Memory heap grows between widget add/remove cycles (ties to Pitfall 3).
- Multiple widget reloads after a tab switch (OS reclaimed the frame).

**Phase to address:** Phase 4 (Sandbox & BYOW) enforces budgets and lazy-loading; Phase 5 (Kiosk &
Polish) runs the on-hardware acceptance soak (24 h run, frame-time logging, memory sampling).

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Add `allow-same-origin` to the sandbox "so widgets can fetch without CORS" | Widget dev is easier | Full sandbox escape; the app's core security promise is void | **Never.** Proxy via `DeskMate.fetch` instead |
| Use iframe `onLoad` as the widget-ready signal | Zero bridge code | Blank tiles with no error UI; no crash detection | **Never.** Always the `ready` handshake + timeout |
| Skip ETag/conditional requests for GitHub | Less code in the fetch layer | 60 req/hr exhausted in minutes; guaranteed rate-limit errors | **Never.** Conditional requests are ~10 lines |
| `JSON.parse` without try/catch + validation | Feels faster to write | One corrupt value = white-screen dashboard; no recovery path | Only for throwaway prototypes, never for persisted config |
| Store widget code uncompressed in share URLs | Simple encode | 414s once custom widgets exist; share feature dead | **Never.** Compress (lz-string) from day one |
| Refresh GitHub widget every 60 s | Data always fresh | 60/hr gone in minutes per widget | Only during active dev with a token; never in shipped defaults |
| Persist grid layout on every drag frame | Layout always saved | Write amplification + jank on low-end devices | Acceptable only with debounce ≥ 500 ms; prefer `onDragStop` only |
| One global `setInterval` per widget instead of a shared ticker | Encapsulation feels clean | N widgets = N wakeups; battery drain on a display server | Acceptable at ≤ 3 timers; not for a 12-widget dashboard |
| Render grid at 1280 default then "fix" on measure | Zero skeleton code | Visible layout flash on every cold load | **Never.** Gate render on measured width |

---

## Integration Gotchas

Common mistakes when connecting to external services.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| GitHub REST API | Polling repos at fixed short intervals with no cache | Conditional requests (`If-None-Match`/ETag) + cached last-good payload + "updated N min ago" |
| GitHub REST API | Using `/search/*` endpoints for widget data | Use resource endpoints (`/repos/{owner}/{repo}`, `/issues`, `/commits`); search is 10/min unauthenticated |
| GitHub REST API | Ignoring `x-ratelimit-*` response headers | Parse `remaining`/`reset`; stop polling until `reset`; show countdown in widget UI |
| GitHub REST API | Retrying immediately on 403/429 | Honor `retry-after`/`x-ratelimit-reset`; exponential backoff; continued retries risk per-IP ban |
| GitHub REST API | Concurrent fetches of the same repo from multiple widgets | One shared fetch client that dedupes in-flight requests and caches by URL |
| localStorage | Direct property access (`localStorage.foo`) | `getItem`/`setItem` methods only (prototype-pollution / built-in collision safety) |
| localStorage | Trusting stored shape | zod-validate on every load; migrate by `version`; fall back to defaults; keep raw backup |
| localStorage | Writing in every component | Single Storage Adapter via store subscription, debounced (ARCHITECTURE.md) |
| Sandboxed iframe | Host→frame `postMessage` with a literal targetOrigin | `contentWindow.postMessage(msg, "*")` + inbound source-reference + nonce validation (opaque origin) |
| Sandboxed iframe | Widget doing its own `fetch()` to public APIs | Proxy via `DeskMate.fetch` — opaque-origin requests (`Origin: null`) are rejected by many APIs, and host gains a rate/allow-list choke point |
| srcdoc widget | Relative URLs (`/assets/x.png`) inside widget code | `about:srcdoc` resolves relative URLs against the **host page URL** — document that widgets must use absolute URLs or `data:` URIs |
| Wake Lock | Requesting while document is hidden | Only request when visible; reacquire on `visibilitychange` |
| Wake Lock | Serving display URLs over plain HTTP | HTTPS required for the API (secure context); document LAN-hosting caveat |
| Fullscreen | Calling `requestFullscreen()` without a user gesture | Chrome rejects without transient activation — trigger fullscreen from the same button click as wake lock |
| Audio | Creating `AudioContext` at module load | Create/resume inside the first user-gesture handler; check `state` |

---

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| One iframe per widget × many widgets | Memory growth, tab kill, jank on drag | Lazy-mount offscreen frames, cap iframe widgets per device class, diff size/theme pushes | ~6–8 iframe widgets on 2 GB phones; ~20 on mid laptops |
| Short-poll GitHub widgets | 403s, rate-limit errors, battery drain | ETag cache + adaptive interval ≥ 3 min | 2+ widgets at < 5 min intervals unauthenticated |
| Clock rendered via rAF at 60 fps | CPU/battery drain on always-on displays | Single 1 s `setInterval`, timestamp-based render, `visibilitychange` guard | Any always-on display over hours |
| Whole-grid re-render on every store change | Drag jank, widget reloads | Memoize children, immutable callbacks, diff `size`/`theme` pushes in bridge | Grids > ~10 items with iframe children |
| Persisting layout on every drag frame | Storage writes on every mousemove | Persist on `onDragStop`/`onResizeStop`; debounced writes | Always; worse on slow devices |
| Multiple webfonts loaded by widgets | Late re-layout/re-paint flashes | Self-host ≤ 2 fonts; font-display: swap; no per-widget font fetches | Low-end devices + slow networks |
| Widget fetch storms on app resume | Spike of requests after tab switch | Dedupe via shared client; stagger with jitter; cache-first | After `visibilitychange` back to visible |
| Unbounded custom-widget code size in config | Bloat URLs past 8 KB, slow srcdoc builds | Cap code size; compress URL payload; size warning in editor | Configs with >1–2 custom widgets in share URLs |

---

## Security Mistakes

Domain-specific security issues beyond general web security.

| Mistake | Risk | Prevention |
|---------|------|------------|
| `sandbox="allow-scripts allow-same-origin"` on srcdoc widgets | Total sandbox escape: host DOM, localStorage, cookie access | `sandbox="allow-scripts"` only; test asserts exact attribute string |
| Trusting `event.origin` (always `"null"`) or skipping checks entirely | Message spoofing from any frame/tab | Source-reference match + per-widget nonce + direction/version envelope (ARCHITECTURE.md Pattern 3) |
| Granting `allow-top-navigation` | Malicious widget redirects the kiosk screen to a phishing page | Never grant top-navigation tokens; verify via an escape-attempt test widget |
| Granting `allow-popups` / `allow-forms` / `allow-modals` | Widget opens popups/forms (phishing, drive-by) on a display device | Keep the token allowlist minimal; reject widgets requesting more at the editor level |
| Widgets `fetch()`-ing arbitrary URLs from inside the sandbox | Data exfiltration; widget depends on flaky third-party APIs | Host-proxied `DeskMate.fetch` with per-widget URL/rate allow-list (v2 hardening) |
| Not teardown-ing iframes on unmount/import | Zombie frames keep running user code after deletion | Explicit unmount: unregister, destroy frame, clear timeouts (Pitfall 3) |
| Storing config back to localStorage *before* validating | Validated-in, unvalidated-out; corrupted state persists | Only the validated config object is ever written (single Store Adapter) |
| Building srcdoc with string concatenation of user code + bootstrap | Bootstrap injection if escaping is wrong | Template with fixed bootstrap + user code in a separate, escaped segment; no `</iframe>`/`"` boundary leaks (unit-test the srcdoc builder) |
| Trusting imported JSON configs | Malformed layouts crash the grid; oversized configs bloat memory | Same zod validator on import as on URL/localStorage; caps on widget count/code size |

---

## UX Pitfalls

Common user experience mistakes in this domain.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Wake lock state invisible | Screen dims; user thinks the app is broken | Visible "screen will stay awake" indicator + explicit toggle (also unlocks audio) |
| Rate-limit errors as dead ends | GitHub widget permanently broken-looking | Stale-cache + "updated N min ago" + countdown to reset; sample data on first run |
| Grid flash on load (1280 default) | Feels broken on first paint | Skeleton/aspect-matched placeholder until width measured |
| Share URL that silently fails on other hosts | Link "works on my machine" only | Encode-size budget + warning; fall back to JSON export |
| Chime silent on fresh devices | Missed Pomodoro completions | Gesture unlock + "sound blocked" affordance + test button |
| No error state for failed custom widgets | Blank tiles, no explanation | "Widget did not start" fallback with a reason and a retry/reload affordance |
| No feedback when a widget is rate-limited/offline | Silent staleness | Per-widget status chip: stale / offline / rate-limited |
| Config "lost" across origins | User anger, data-loss feeling | Store import/export prominently; document per-origin storage |
| Drag of iframe widgets "not working" | Users can't rearrange their dashboard | Title-bar drag handle in host DOM; visible grab cursor on the whole bar |
| Old phone + heavy dashboard | Hot device, dead battery in hours | Performance budget warning + "light mode" (fewer frames) suggestion |

---

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **Sandbox:** `sandbox="allow-scripts"` renders — but no automated test asserts the exact
      attribute string, and no escape-attempt test widget (try `window.parent.document`,
      `localStorage`, `allow-same-origin`-style DOM read) is in the suite. Verify: add a hostile
      widget to the test fixtures and assert host isolation.
- [ ] **Bridge:** messages flow — but inbound validation checks `event.origin` against `"null"`
      instead of source reference + nonce. Verify: a decoy iframe posting a valid-looking envelope
      is ignored.
- [ ] **Wake lock:** toggle turns the indicator green — but nobody switched tabs for 10 minutes on
      an old iOS device. Verify: soak test (tab away and back; lock → unlock; Low Power Mode on)
      with the screen-stays-on assertion.
- [ ] **Pomodoro chime:** sounds in the developer's browser — but not on a fresh kiosk profile.
      Verify: fresh-profile device test that the first user gesture enables audio and the chime
      plays at session end.
- [ ] **GitHub widget:** shows data — but the fetch layer has no ETag cache, no
      `x-ratelimit-remaining` handling, and errors render as a dead state. Verify: budget simulator
      (2 widgets, 1 h, ≤ 60 requests) and an offline test that stale data + timestamp renders.
- [ ] **Share URL:** generates a URL — but nothing asserts the encoded length against the 8 KB
      request-line budget, and the too-big path (JSON export) isn't wired. Verify: worst-case config
      test + actual 414 reproduction on the deployed host.
- [ ] **localStorage:** saves and loads — but no zod validation, no migration path, no
      parse-failure fallback. Verify: hand-corrupt the stored value, reload, assert the app renders
      defaults and preserves a raw backup.
- [ ] **Drag of custom widgets:** works with native widgets only. Verify: drag a sandboxed iframe
      widget on a touch device and a mouse device.
- [ ] **Performance:** fine on the dev machine. Verify: CPU-throttled (6×) old-device emulation and
      a 24 h on-hardware soak with memory sampling.
- [ ] **Offline resilience:** GitHub data cached — but only if the widget already ran once. Verify:
      first-run offline (airplane mode before first fetch) shows sample data, not an error.

---

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Sandbox escape shipped to users | HIGH | Ship a blocked-widget update immediately; audit stored configs for injected code; purge/disable any widget whose code contains known escape patterns; inform affected users to re-import clean configs |
| Corrupt localStorage config | LOW | App-level: on parse/validation failure, render defaults + keep raw backup under `deskmate.config.backup`; user-level: export/import the JSON from the backup key or a previous export file |
| Rate-limit lockout (remaining = 0) | LOW | Wait for `x-ratelimit-reset`; render cached data; do not retry (retry risks per-IP ban); optionally switch the widget to a longer interval |
| 414 on share URLs already distributed | MEDIUM | Ship the compressed-codec + cap; keep old URLs readable if possible (support both codecs briefly); point affected users to JSON export/import |
| Zombie widget iframes after a buggy unmount | MEDIUM | Full app reload destroys frames (nuclear but safe); then fix the teardown path; add the "widgets alive" dev panel |
| Wake lock silently broken on old iOS | LOW | Feature-detect and show "enable auto-lock off" guidance; the app must still be usable (dimming) without wake lock — it's a progressive enhancement |
| Audio chime blocked | LOW | "Tap to enable sound" affordance at session end re-attempts playback within the tap gesture; persists unlock state for the session |
| Tab killed by OS (memory pressure) | MEDIUM | Config is in localStorage, so reload restores exactly; add reload-on-`pageshow` from `bfcache`/crash detection and a storage-event listener for cross-tab consistency |

---

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| 1. Sandbox over-permission (`allow-same-origin`) | Phase 4 (Sandbox & BYOW) | Unit test asserts exact `sandbox` string; escape-attempt test widget in the suite |
| 2. postMessage origin/nonce confusion | Phase 4 (Sandbox & BYOW) | Spoofing test: decoy frame with guessed nonce is ignored |
| 3. Widget lifecycle leaks / `load` misuse | Phase 4 (Sandbox & BYOW) | Crash→fallback test; unmount→no further network test |
| 4. Wake Lock lifecycle + iOS<16.4 | Phase 5 (Kiosk & Polish) | 10-min soak incl. tab-away, lock, Low Power Mode on old iOS |
| 5. GitHub 60/hr budget | Phase 3 (Native Widgets) | Budget simulator: 2 widgets / 1 h ≤ 60 requests; offline stale-cache test |
| 6. localStorage corruption/migration | Phase 2 (Grid & Persistence) | Corrupt-value reload test; migration test; quota-0 (private mode) test |
| 7. URL config > 8 KB → 414 | Phase 2 (Grid & Persistence) | Worst-case encode-length test; too-big → export fallback; real-host probe |
| 8. Autoplay-blocked chime | Phase 3 (Native Widgets) | Fresh-profile device test: gesture unlocks audio; chime at session end |
| 9. Grid width flash / drag-in-iframe | Phase 2 (Grid & Persistence) + Phase 4 verification | Cold-load no-flash check; drag iframe widget on touch + mouse |
| 10. Low-end performance collapse | Phase 4 (budgets/lazy) + Phase 5 (soak) | 6× CPU throttle check; 24 h on-hardware soak with memory + frame-time sampling |
| Imported-config validation (sec.) | Phase 2 (Grid & Persistence) | Zod rejects malformed imports; caps enforced |
| srcdoc builder escaping | Phase 4 (Sandbox & BYOW) | Unit test: user code containing `</iframe>`/`"` cannot break out of the srcdoc boundary |

---

## Sources

- **iframe / sandbox / srcdoc:** MDN `<iframe>` element — sandbox tokens, `allow-scripts` +
  `allow-same-origin` warning, srcdoc base-URL behavior, top-navigation rules, missing `error`
  event, iframe memory warning. `https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe`
  (updated 2026-08-04). [HIGH]
- **Screen Wake Lock:** MDN Screen Wake Lock API — sentinel lifecycle, visibilitychange reacquire
  pattern, low-battery release, secure context, Permissions Policy. `https://developer.mozilla.org/
  en-US/docs/Web/API/Screen_Wake_Lock_API` (updated 2026-07-27). [HIGH]
- **Screen Wake Lock (Chrome):** "Stay awake with the Screen Wake Lock API" — kiosk use case,
  release on tab switch, sentinel pattern. `https://developer.chrome.com/docs/capabilities/web-apis/
  wake-lock` [HIGH]
- **Wake Lock support:** caniuse — iOS Safari 16.4+ only; ~93% global usage; WebKit bug 205104.
  `https://caniuse.com/wake-lock` [HIGH]
- **GitHub REST API rate limits:** GitHub docs — 60/hr unauthenticated per IP, header semantics,
  403/429 handling, secondary limits, per-IP ban warning. `https://docs.github.com/en/rest/using-the-
  rest-api/rate-limits-for-the-rest-api` [HIGH]
- **GitHub REST API best practices:** GitHub docs — conditional requests (`ETag`/`If-None-Match`),
  304 not counted, stable params for cache hits, serial requests, error handling.
  `https://docs.github.com/en/rest/using-the-rest-api/best-practices-for-using-the-rest-api` [HIGH]
- **Web Storage / localStorage:** MDN Using the Web Storage API — per-origin, quota-0 private mode,
  `storageAvailable()` guard, `QuotaExceededError`, JSON round-trip, StorageEvent, prototype-
  pollution warning. `https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API/
  Using_the_Web_Storage_API` (updated 2026-05-26). [HIGH]
- **URL length (deployment constraint):** nginx `ngx_http_core_module` — `large_client_header_buffers
  4 8k`, request line > one buffer → 414. `https://nginx.org/en/docs/http/ngx_http_core_module.html`
  [HIGH]. Browser-side limits (Chrome ~2 MB, Safari ~80 KB) are community-documented and vary by
  version — treat the server/proxy limit as authoritative. [MEDIUM]
- **Autoplay policy:** Chrome blog "Autoplay policy in Chrome" — muted autoplay allowed, gesture/MEI/
  PWA gates, iframe `allow="autoplay"` delegation, Web Audio `resume()`, `NotAllowedError`, kiosk
  enterprise policies (`AutoplayAllowed`, `AutoplayAllowlist`).
  `https://developer.chrome.com/blog/autoplay` [HIGH]
- **react-grid-layout:** official README (v2) — `width` required, `useContainerWidth`
  (`measureBeforeMount`, `initialWidth: 1280`), WidthProvider misuse, memoization, fast compactors,
  immutable callbacks, SSR guidance. `https://github.com/react-grid-layout/react-grid-layout` [HIGH]

**Cross-check note:** where an official source could not be fetched (Stack Overflow was 403;
browser URL-length specifics), the claim is marked MEDIUM and the deployable, verifiable constraint
(nginx 8 KB request line) is used as the authoritative number instead.

---

*Pitfalls research for: DeskMate (client-side smart-dashboard / digital-signage web app)*
*Researched: 2026-08-07*
