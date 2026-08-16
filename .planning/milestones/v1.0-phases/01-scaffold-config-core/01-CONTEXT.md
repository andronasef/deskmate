# Phase 1: Scaffold & Config Core - Context

**Gathered:** 2026-08-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 1 delivers the static app foundation every later phase reuses: (1) a Vite 8 + React 19 + TypeScript 6.0.3 scaffold with lint/type toolchain and a bootable static app shell that renders a default dashboard shell; (2) the single validated `DashboardConfig` contract — zod schema, `defaultConfig.ts`, zustand store, and a versioned storage adapter with validate-on-load + recovery/backup. Requirement CFG-05: corrupt, invalid, or version-mismatched configs never brick the dashboard. "One schema, three transports" (localStorage / JSON export-import / unique display URL) is the contract Phase 2 consumes; nothing renders widgets yet.

</domain>

<decisions>
## Implementation Decisions

### Config contract shape
- **D-01:** Top-level v1 `DashboardConfig` fields = `{ version, theme, layout, widgets }` — `theme` is included now as a minimal/default value so the schema is complete and Phase 3's theme system doesn't force a v2 schema migration (ARCHITECTURE.md Pattern 4).
- **D-02:** `WidgetInstance` = `{ id, type, settings }` — uuid id, registry-key type, freeform `settings` record (validated per-widget when the registry lands in Phase 3).
- **D-03:** Widget count capped at `.max(50)` in the zod schema (theoretical iframe-memory ceiling).
- **D-04:** Layout = responsive record `{ breakpoint: LayoutItem[] }` matching react-grid-layout v2's serializable layout shape (consumed in Phase 2).

### Recovery & backup
- **D-05:** On corrupt/invalid/version-mismatched stored config: validate → attempt migration → fall back to factory defaults. Never throw, never render unvalidated data.
- **D-06:** Raw bad data is preserved under a single backup key (`deskmate.config.backup`) before any overwrite — the user's config is never silently destroyed.
- **D-07:** Recovery is silent (console warning) in v1 — user-facing status indicators are deferred to Phase 5 (KIOSK-04).
- **D-08:** Unknown/future schema versions: preserve raw backup + fall back to defaults — future versions degrade safely, never blank-screen.

### Default shell & persistence wiring
- **D-09:** `defaultConfig.ts` pre-seeds the 3 widget instances (Clock + GitHub Pulse + Pomodoro) as data — exercising the contract now; rendered by Phases 2/3. First-run default dashboard ready.
- **D-10:** Phase 1 boot view = minimal dark dashboard shell (header + placeholder), no grid until Phase 2.
- **D-11:** Persistence = zustand `persist` middleware + custom safe storage adapter: versioned key (`deskmate.config.v1`), `storageAvailable()` guard, try/catch on every storage op, zod revalidation on rehydrate, fall back to defaults on failure.

### Test setup
- **D-12:** Add vitest to the Phase 1 scaffold (Vite-native, zero extra config).
- **D-13:** Test scope = config core: schema validation, recovery/backup, migrations, storage-adapter guards (try/catch, quota-0/private-mode, corrupt-value reload).
- **D-14:** Tests colocated `*.test.ts` next to source.

### the agent's Discretion
- Technical implementation details of the scaffold (exact tsconfig strictness, ESLint flat config shape), storage adapter internals beyond the decisions above, and the shell's placeholder styling are at the agent's discretion.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Roadmap & requirements
- `.planning/ROADMAP.md` §Phase 1 — Phase goal, success criteria, plan outline (01-01 scaffold, 01-02 config core)
- `.planning/REQUIREMENTS.md` §CFG-05 — The single Phase 1 requirement (graceful failure + recovery)

### Research (locked stack & architecture)
- `.planning/research/STACK.md` — Locked stack: Vite 8.2 + React 19.2 + TS ~6.0.3 (NOT 7), ESLint 10.8 flat config, typescript-eslint 8.66, Prettier, zustand 5, zod 4, CSS Modules + custom properties
- `.planning/research/ARCHITECTURE.md` — Pattern 1 (single config store), Pattern 4 (versioned config codec — schema shape, `{ version, theme, layout, widgets }`), recommended `src/` structure, build order steps 1–2, data-flow/boot flow
- `.planning/research/PITFALLS.md` — Pitfall 6 (localStorage corruption — versioned keys, validate-on-load, migrations, raw-backup key, `storageAvailable()` guard), Recovery Strategies table, "Looks Done But Isn't" localStorage checklist item, Integration Gotchas (storage keys, getItem/setItem-only)
- `.planning/research/SUMMARY.md` — Phase 1 rationale ("schema is the contract"), deliverables list
- `.planning/PROJECT.md` — Core value, constraints (localStorage-only persistence, no backend), Key Decisions

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- None — greenfield repository. Only `.planning/` docs and AGENTS.md exist.

### Established Patterns
- No source code yet. All patterns come from research docs (see canonical refs).

### Integration Points
- The config core (`src/config/*`) is the integration point every later phase consumes: Phase 2 grid/persistence/transports, Phase 3 widget registry/theme, Phase 4 sandbox.

</code_context>

<specifics>
## Specific Ideas

No specific requirements beyond the accepted decisions above — standard approaches per research docs.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 1-Scaffold & Config Core*
*Context gathered: 2026-08-07*
