# Milestones

## v1.0 v1.0 (Shipped: 2026-08-16)

**Phases completed:** 5 phases, 13 plans, 6 tasks

**Key accomplishments:**

- Bootable Vite 8.2.1 + React 19.2.8 + TypeScript ~6.0.3 static app with a green lint/type/test/build toolchain and the UI-SPEC dark dashboard shell (DeskMate wordmark header + placeholder card)
- Single validated `DashboardConfig` contract (zod schema) with a versioned safe storage adapter — validate→migrate→defaults recovery with raw backup preserved, wired through a zustand persist store so corrupt, invalid, or version-mismatched stored configs never brick the dashboard (CFG-05)
- Responsive multi-widget grid with edit-mode gating, widget chrome, add-widget flow, and atomic store actions — GRID-01…04, GRID-06
- Three config transports completing "one schema, three transports": debounced localStorage, JSON export/import, and the ?config= display URL — CFG-01…04
- Empirically verified the host request-line limit and confirmed URL_CONFIG_CAP = 4096 is safe — closing the STATE.md research flag for Phase 2
- The single widget registry/renderer contract (D-3.01…3.04) and theme bridge (D-3.05/3.06) — every widget renders through one path, unknown types fail gracefully
- The two self-contained native widgets (WID-01/WID-02): a typography-driven live clock and a focus timer with a large countdown and a Web Audio chime
- The failure-tolerant live-data widget (WID-03/WID-04): shared deduping client with ETag caching and rate-limit backoff — "if everything else fails, this must work"
- Spec-derived verification of the security boundary's semantics — resolving the STATE.md Phase 4 research flag
- The security boundary of the BYOW ecosystem (BYOW-03/04/05) — implemented exactly per the 04-01 spike findings
- The authoring surface (BYOW-01/02) and the performance layer (D-4.13/4.14) — write, preview, save, and run custom widgets safely
- The always-on display promise (KIOSK-01/02): keep the screen on where supported, degrade calmly where not — with the device-class spike recorded
- The presentation layer that completes the Core Value — a phone or idle monitor runs DeskMate fullscreen, stays awake, shows exactly the config, and communicates its health quietly

---
