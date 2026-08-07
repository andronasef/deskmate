# Feature Research

**Domain:** Client-side smart-dashboard / digital-signage / "second screen" web apps
**Researched:** 2026-08-07
**Confidence:** HIGH

## Feature Landscape

The domain spans four overlapping product families, each with its own expectations:

1. **Digital-signage / wall-calendar dashboards** (DAKboard, ScreenCloud, Yodeck) — calendar, photos, weather, remote management, kiosk/fullscreen, "set it and forget it."
2. **Open-source smart-mirror platforms** (MagicMirror²) — modular plugin system, clock/weather/calendar/news as default modules, custom CSS.
3. **Smart-home dashboards** (Home Assistant Lovelace, ActionTiles) — drag-and-drop card editors, dozens of card types, themes, custom cards via code.
4. **Desktop ambient / wallpaper engines** (Lively Wallpaper, Rainmeter, Übersicht) — interactive web content as ambient display, developer APIs, automation.

Common thread across all: **an always-on screen showing glanceable-at-a-distance information with zero maintenance after setup.** Every competitor converges on the same core widget set (clock, weather, calendar, news) — that is the table-stakes floor. Differentiation happens in *how* users extend and share the dashboard.

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Large customizable clock & date widget | Every competitor ships one; it is the ambient default screen. MagicMirror's Clock module has 20+ options (12/24h, timezone, seconds, analog/digital, sun/moon times); DAKboard, HA Clock card, and every smart-display OS (Nest Hub/Echo Show) open with a clock. | LOW | Native Clock widget with typography/themes covers this. The **first-run default** should be a beautiful clock — users judge the product in its first 5 seconds. |
| Weather widget | Second most-requested widget after clock, in every competitor (MM Weather, DAKboard weather, HA weather-forecast card). | MEDIUM | Choose a CORS-enabled, keyless public API (Open-Meteo) to preserve the static-host constraint. Needs geolocation + unit/format config. |
| Calendar / agenda view | DAKboard's **headline feature** ("digital wall calendar", agenda + monthly views, per-calendar colors, Google/iCloud/365/ICS); MM Calendar and HA Calendar card are default options. Users converting from DAKboard expect this above all. | MEDIUM-HIGH | **Biggest table-stakes gap in the current v1 scope.** Requires ICS/iCal parsing, multiple calendar sources, and graceful offline. Likely the first post-MVP request. |
| Drag-and-drop multi-widget grid | DAKboard: "drag, drop and resizable block framework"; HA: sections view with visual drag-drop; Lovelace masonry. This is the core editing metaphor of the domain. | MEDIUM | react-grid-layout covers it. Must feel smooth on touch (tablets) as well as mouse. |
| Single-widget fullscreen / panel mode | HA Panel view (one card full-width); smart displays and kiosks are single-purpose by nature; phone mode is a fullscreen widget by default. | LOW | DeskMate's single-widget mobile mode maps directly to this expectation. |
| Layout & config persistence | Every competitor persists (DAKboard server-side, HA server-side, MM config file). Users expect their setup to survive reloads. | LOW-MEDIUM | localStorage is fine; the schema must be stable (it feeds export/import and unique URLs). |
| Export / import configuration | Expected for device portability ("move this dashboard to the kitchen tablet"). Competitors do it server-side; DeskMate's JSON export/import is the local-first equivalent. | LOW | Same JSON schema as persistence and unique URLs — build the schema once, reuse everywhere. |
| Fullscreen kiosk mode + screen wake lock | "Always-on" is the core promise of the whole domain; digital signage and smart displays must not sleep or show browser chrome. | LOW | Feature-detect Screen Wake Lock API; graceful fallback (e.g., subtle periodic animation / noop interaction loop) on browsers without it. |
| Responsive layout (portrait phone ↔ landscape TV/monitor) | DAKboard markets "works in landscape too"; tablet/IPad/monitor usage is a stated use case on their site; kiosk content must fill any aspect ratio. | MEDIUM | Layout breakpoints + single-widget collapse for narrow screens. |
| Themes & appearance customization (fonts, colors, background) | MM custom.css; HA themes (even per-card); DAKboard templates. Users treat the dashboard as decor and expect aesthetic control. | MEDIUM | Theme tokens must be exposed to the widget API so custom widgets inherit the theme (see dependencies). |
| Auto-refresh of live data with graceful failure | Signage runs unattended; DAKboard's pitch is "zero maintenance." Network drops and API rate limits must never render a broken UI. | MEDIUM | Per-widget refresh scheduling with backoff, cached/sample data on failure, visible-but-quiet error states. GitHub public API (~60 req/hr unauthenticated) makes this mandatory. |
| First-run experience (sample/default dashboard) | HA auto-generates a dashboard from devices and ships an interactive demo; DAKboard starts from templates. Users must see a working dashboard before configuring anything. | LOW | Ship a sensible default layout (Clock + GitHub Pulse + Pomodoro) so the URL-first load is immediately impressive. |
| Per-widget settings UI (config without code) | DAKboard's web config UI; HA card editors. Non-developer users expect to set clock format / weather units without editing files. | MEDIUM | Native widgets get a form-based config; BYOW widgets get the code editor (differentiator). |

### Differentiators (Competitive Advantage)

Features that set the product apart. Aligned with DeskMate's Core Value: *one unique URL, opened on any device, renders the exact configuration.*

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **BYOW — in-browser HTML/CSS/JS widget editor** | The open-ecosystem wedge. HA custom cards exist but require creating JS module files, registering resources, and no in-browser editor; MM requires npm install + config.js edits; Lively renders webpages but has no editor. **Nobody ships a built-in code editor with live preview + sandboxed rendering.** | HIGH | This is the product's identity. Must include live preview and a defined `DeskMate` widget API (theme colors, screen size, refresh cycle). |
| **Unique display URL (query-param encoded config)** | Zero-setup sharing: one URL loads the exact config on any device. DAKboard requires accounts + linking codes; HA requires a server + auth. DeskMate's URL is instant setup and instant sharing. | MEDIUM | Watch URL length limits — custom widget code in a URL can exceed 2–8 KB limits on some clients/proxies. Strategy needed: localStorage-first, URL for compact configs, optional compression (see dependencies). |
| **No-account, no-install, static-host model** | "Open the URL, done." Removes the account-creation and install friction that DAKboard (account + linking code) and HA (server setup) impose. This is architectural but is itself a feature users feel. | LOW-MEDIUM | Enabled by the no-backend decision; must stay true in every feature added. |
| **Developer-native widget set (GitHub Pulse, Pomodoro)** | No competitor ships these as first-class native widgets. DAKboard's audience is families/offices; MM's defaults are clock/weather/calendar/news. DeskMate speaks to makers from the first screen. | MEDIUM | GitHub Pulse must tolerate 60 req/hr rate limits; Pomodoro needs audio chime + permission handling. The architecture must make adding native widgets trivial (user: "most basic first and I will add more soon"). |
| **Sandboxed iframe security story** | Trustworthy execution of community-written widgets. Safe to run untrusted code is the prerequisite for any future marketplace — it turns BYOW from a toy into a platform. | HIGH | Hard requirement already locked in PROJECT.md. Never let custom widget JS run in the main window. |
| **Config portability: export/import + URL = dashboard in your pocket** | Competitors hold config server-side; DeskMate's config is a file/URL you own and carry. Pairs with the maker audience's love of dotfiles. | LOW | Reuses the persistence schema. |
| **Works on anything with a browser** (old phones, spare monitors, TVs) | Matches DAKboard's "anything with a browser" breadth without needing their native apps or hardware. The upcycled-device story is the product's tagline. | LOW | PWA installability (v1.x) strengthens this — "add to home screen" is the poor-man's native app. |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| User accounts / authentication | Competitors all have them; feels like "a real product." | Requires a backend, breaks the open-a-URL model, adds friction to the zero-setup pitch. Directly contradicts Core Value. | Device-local config + unique display URLs. (Already in PROJECT.md Out of Scope.) |
| Cloud sync / live multi-device sync (WebSockets) | "I want my phone and TV to stay in sync." | Server + auth + conflict resolution; massive complexity for a personal dashboard; the URL already transfers config on demand. | Export/import + unique URL. (Out of Scope — keep it that way.) |
| Widget marketplace / community hub (v1) | Ecosystem dreams; "more widgets!" | Hosting, moderation, trust, payments, and curation burden before there are even users or widgets. Kills focus on the core loop. | Ship BYOW editor + sandbox first; marketplace becomes v2 after community demand. (Confirmed in questioning.) |
| Photo frame / media library | DAKboard's beloved feature; smart displays show photos. | Requires storage backend or heavy OAuth integrations (Dropbox/Google Photos). Contradicts no-backend constraint. | Let BYOW render an image/URL widget; revisit a native photo widget only if demanded. |
| Native apps (Fire TV / Android / iOS) | DAKboard ships them; feels more "premium." | App-store presence, linking codes, per-platform wake-lock and kiosk handling — a whole second product. | Pure web + PWA installability (v1.x) covers 90% of the value. |
| Voice assistant integration | Nest Hub/Echo Show have it. | Huge complexity (wake word, intent parsing), not web-standard, zero overlap with the maker audience's use case. | Skip entirely; the dashboard is glanceable, not conversational. |
| Server-side API proxying / CORS proxy infrastructure | "News feeds need a proxy; GitHub API is rate-limited." | Breaks the static-host zero-ops model; becomes your own backend in disguise. | Pick CORS-friendly public APIs (Open-Meteo, GitHub public API); if a widget needs a proxy, that's the widget author's problem (public CORS proxies exist) — an ecosystem answer, not a core one. |
| Telemetry / analytics tracking | "Measure engagement." | Always-on devices running third-party tracking erodes the privacy-first local product; no accounts means you can't even attribute it. | No tracking. Optional opt-in later if ever needed. |
| Multi-user roles / permissions | DAKboard Business tier and HA have them. | Personal desk dashboards have one owner; roles/ACL is enterprise scope creep. | Single-owner model; share read-only via unique URL. |

## Feature Dependencies

```
Unique display URL
    └──requires──> Config serialization (stable schema + encode/decode)
                       └──requires──> Persistence schema (shared by localStorage + export/import + URL)

BYOW widget editor
    └──requires──> Sandboxed iframe renderer
                       └──requires──> DeskMate widget API (theme tokens, screen size, refresh)
                                           └──requires──> Theme system

Native widgets (Clock / Pomodoro / GitHub Pulse)
    └──requires──> Widget framework contract (identical interface to BYOW widgets)

Multi-widget grid (drag-and-drop)
    └──requires──> Widget framework (add/remove/resize/config)
                       └──requires──> Persistence

Single-widget mobile mode
    └──enhances──> Responsive layout system

Screen Wake Lock
    └──requires──> Fullscreen mode

GitHub Pulse widget
    └──requires──> Auto-refresh scheduler
                       └──requires──> Graceful error handling (rate limits, offline)

Pomodoro audio chime
    └──requires──> Browser audio permission handling

Export/import JSON
    └──requires──> Persistence schema

Themes
    └──requires──> Widget framework contract (every widget must consume theme tokens)
```

### Dependency Notes

- **[Widget framework contract] is the keystone:** native widgets and BYOW widgets must implement the *same* interface (mount, config, refresh, theme, resize). If the framework forks into "native path" vs "iframe path," the architecture doubles and the ecosystem dies. Build the contract first, then implement Clock against it, then the iframe sandbox.
- **[Config serialization] must be designed before [unique URLs] and [export/import]:** one schema, three consumers. The schema must version (`schemaVersion`) so old configs survive future changes — localStorage configs outlive releases.
- **[BYOW editor] requires [sandboxed iframe] first:** never preview or render untrusted widget code in the main window. The editor (parent frame) and the widget (child iframe) communicate via `postMessage` with a validated, allow-listed message shape.
- **[Unique display URL] has a hard size constraint:** query params containing custom widget HTML/JS can exceed URL length limits (browsers ~2 MB, but many servers/proxies/QR codes cap at 2–8 KB). Strategy: store config in localStorage keyed by a short hash and let the URL carry either (a) the full config when compact, or (b) a config hash/pointer when large — with export/import as the escape hatch for very large configs. Consider lz-string compression for the URL payload.
- **[GitHub Pulse] depends on [graceful error handling]:** the public API is ~60 req/hr unauthenticated; a widget that hard-fails on 403/429 breaks the "always-on, no maintenance" promise. Cache last-good data and back off.
- **[News/feed widget] (table stake in competitors) is CORS-blocked for static apps:** most RSS endpoints do not send CORS headers, which is why MagicMirror has a Node helper and DAKboard a server. Do not silently promise a News widget; either defer it or use a public CORS proxy with the ecosystem-can-solve-it framing.
- **[Weather widget] depends on the API choice, not the widget:** locking the CORS-friendly keyless API (Open-Meteo) early keeps every later feature consistent with the no-backend constraint.
- **[Themes] must be designed with BYOW in mind:** theme tokens (colors, fonts, spacing) exposed in the widget API are what make community widgets look native — without this, every custom widget clashes with the dashboard.

## MVP Definition

### Launch With (v1)

Reflects the Active requirements in PROJECT.md — these are the minimal set that proves the Core Value.

- [ ] Multi-widget grid with add/remove/resize widgets — core interaction
- [ ] Drag-and-drop grid arrangement — the expected editing metaphor
- [ ] Single full-screen widget mode on mobile/narrow screens — responsive promise
- [ ] localStorage persistence of layout + widget configs — survive reload
- [ ] Export/import JSON config — portability story
- [ ] Fullscreen mode + Screen Wake Lock (with fallback) — the always-on promise
- [ ] Unique display URL (query-param config) — instant setup + sharing story
- [ ] Native Clock & Date widget with typography/themes — table stake, first-run default
- [ ] Native Pomodoro widget (large countdown + audio chime) — differentiator
- [ ] Native GitHub Pulse widget (public API, rate-limit tolerant) — differentiator
- [ ] BYOW code editor (HTML/CSS/JS) with live preview — the identity of the product
- [ ] Sandboxed iframe rendering for custom widgets + DeskMate widget API — safety + ecosystem enabler

### Add After Validation (v1.x)

- [ ] Weather widget (Open-Meteo) — closes the biggest table-stakes gap; trigger: any user feedback mentioning weather after launch
- [ ] Calendar/agenda widget (ICS parsing) — closes the DAKboard-convert gap; trigger: demand from family/office users
- [ ] PWA installability (manifest, add-to-home-screen) — cheap native-app substitute for phones/tablets
- [ ] Widget presets / starter templates ("Clock + Weather + Calendar" one-click layout) — reduces empty-state friction
- [ ] More native widgets (world clock, countdown, quote-of-day, image/URL frame, to-do) — proves the "trivial to add" architecture
- [ ] GitHub personal-token support (optional field) — lifts rate limits for power users
- [ ] Widget sharing via URL/JSON file (without a marketplace) — the ecosystem's first distribution mechanism

### Future Consideration (v2+)

- [ ] Widget marketplace / community hub — only after BYOW traction proves demand
- [ ] Chrome extension (new-tab replacement) — already on roadmap
- [ ] Cloud sync / remote live sync — only if multi-device demand is real and users accept a backend
- [ ] Scheduling / automations (show widget X only 7–9am) — real digital-signage feature, but drags in time-based state machines
- [ ] Screensaver / OLED burn-in protection (subtle periodic content shift) — nice for always-on hardware, cheap to add later
- [ ] Photo frame via a native image widget — revisit if the maker audience asks

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Widget framework contract (keystone) | HIGH | MEDIUM | P1 |
| Multi-widget grid + drag-and-drop | HIGH | MEDIUM | P1 |
| localStorage persistence + schema | HIGH | LOW-MEDIUM | P1 |
| Native Clock widget | HIGH | LOW | P1 |
| Fullscreen + Screen Wake Lock | HIGH | LOW | P1 |
| Unique display URL | HIGH | MEDIUM | P1 |
| BYOW editor + sandboxed iframe + widget API | HIGH | HIGH | P1 |
| Native GitHub Pulse widget | MEDIUM | MEDIUM | P1 |
| Native Pomodoro widget | MEDIUM | LOW | P1 |
| Export/import JSON | MEDIUM | LOW | P1 |
| Single-widget mobile mode | HIGH | MEDIUM | P1 |
| First-run default layout | HIGH | LOW | P1 |
| Theme system + widget API tokens | MEDIUM | MEDIUM | P2 |
| Weather widget (Open-Meteo) | HIGH | MEDIUM | P2 |
| Calendar/agenda widget | HIGH | HIGH | P2 |
| PWA installability | MEDIUM | LOW | P2 |
| Widget presets/templates | MEDIUM | LOW | P2 |
| More native widgets | MEDIUM | LOW-MEDIUM | P2 |
| News/feed widget | LOW | HIGH (CORS) | P3 |
| Marketplace / cloud sync / scheduling | LOW | VERY HIGH | P3 |

**Priority key:**
- P1: Must have for launch
- P2: Should have, add when possible
- P3: Nice to have, future consideration

## Competitor Feature Analysis

| Feature | DAKboard | MagicMirror² | Home Assistant | Lively Wallpaper | Glance (Android) | **DeskMate** |
|---------|----------|--------------|----------------|------------------|------------------|--------------|
| Clock/date widget | Yes (default) | Yes (default, 20+ options, analog+digital) | Yes (Clock card) | No (webpage wallpapers can) | Yes (lock-screen clock) | **Native Clock, typography/themes** |
| Weather | Yes | Yes (default module) | Yes (weather-forecast card) | No | Yes | **P2 (Open-Meteo)** |
| Calendar/agenda | Yes (**headline feature**) | Yes (default module) | Yes (Calendar card) | No | Partial | **P2 (ICS)** |
| Drag-and-drop grid editor | Yes (custom screen editor) | No (config.js text) | Yes (sections view) | No | No | **Yes, core (P1)** |
| Fullscreen + stay-awake | Yes (kiosk/Casting) | Yes (Electron autostart) | Yes (kiosk mode) | Yes (wallpaper/screensaver) | Yes (lock screen) | **Yes, Web Wake Lock (P1)** |
| Custom/extensible widgets | Blocks only (no code) | 3rd-party modules (npm + config edits) | Custom cards (JS module files + registration) | Webpage wallpapers (drag-drop) | No | **BYOW: in-browser editor + sandbox (P1)** |
| In-browser widget code editor | No | No | No | No | No | **Yes — unique in domain** |
| Zero-account / unique URL share | No (account + linking codes) | No (self-hosted) | No (server + auth) | No (local app) | N/A | **Yes — unique in domain** |
| Developer-focused widgets (GitHub, Pomodoro) | No | No | GitHub card exists via custom cards | No | No | **Yes, native (P1)** |
| Photo frame | Yes (many integrations) | Via 3rd-party modules | Via custom cards | Yes (webpage/video) | No | **Anti-feature for v1** |
| Native apps | Yes (Fire TV, Android) | Electron | Companion apps | Yes (Windows) | Yes | **No — PWA later** |
| Offline/graceful degradation | Partial (server-dependent) | Partial | Partial | N/A | N/A | **Must be first-class (P1)** |
| Config portability | Server-side account | Config file | Server-side + backups | Local profiles | N/A | **Export/import + URL (P1)** |
| Cost / account model | Freemium account | Free, self-hosted | Free, self-hosted | Free, open-source | Free (ad-supported lock screen) | **Free, no account** |

## Sources

- DAKboard official site (features, integrations, screen editor, landscape support) — fetched 2026-08-07 — HIGH
- MagicMirror² documentation (default modules: Clock/Calendar/Weather/Newsfeed; module config; custom CSS) — fetched 2026-08-07 — HIGH
- Home Assistant dashboards documentation (view types, card types, themes, auto-generated dashboards) — fetched 2026-08-07 — HIGH
- Home Assistant custom card developer docs (custom element API: setConfig/getCardSize/getGridOptions/customCards registry) — fetched 2026-08-07 — HIGH
- Lively Wallpaper GitHub README (webpage wallpapers, developer API, automation, pause rules, screensaver) — fetched 2026-08-07 — HIGH
- DuckDuckGo search results: "Glance" identified as Android lock-screen content service (glance.com) + HA Glance card; articles on repurposing old Android phones/tablets as smart displays (expectations: stay-awake, kiosk launcher, clock/weather/calendar) — MEDIUM
- Smart-display OS conventions (Nest Hub / Echo Show ambient clock + glanceable cards) — domain knowledge — MEDIUM
- PROJECT.md (DeskMate scope, Active requirements, Out of Scope decisions) — authoritative for MVP boundaries

---
*Feature research for: DeskMate — client-side smart-dashboard / digital-signage web app*
*Researched: 2026-08-07*
