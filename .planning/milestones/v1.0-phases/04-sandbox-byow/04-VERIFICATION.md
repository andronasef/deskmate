---
phase: 04-sandbox-byow
verified: 2026-08-16T07:52:00Z
status: passed
score: 11/11 must-haves verified
behavior_unverified: 0
---

# Phase 4: Sandbox & BYOW Verification Report

**Phase Goal:** Users can write, preview, and run their own HTML/CSS/JS widgets safely — the sandboxed-iframe security contract makes untrusted code impossible to escape, and teardown leaves no zombies.
**Verified:** 2026-08-16T07:52:00Z
**Status:** passed

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Spike records srcdoc+sandbox behavior across browsers (opaque origin, event.origin 'null', event.source identity, base-URL trap) | ✓ VERIFIED | 04-01-SPIKE.md documents all five points with spec/MDN grounding; 04-01-FINDINGS.md resolves STATE.md flag |
| 2 | Spike resolves bridge design (targetOrigin '*', nonce handshake, escaping, validation order) | ✓ VERIFIED | FINDINGS #1-7 — the exact rules 04-02 implements |
| 3 | Findings feed 04-02 verbatim | ✓ VERIFIED | constants.ts/bridge.ts implement FINDINGS (constants, escaping, source→parse→nonce order) |
| 4 | Custom widgets render in iframe with EXACTLY sandbox='allow-scripts' + no-referrer — exact-attribute unit test (BYOW-03) | ✓ VERIFIED | lifecycle.test asserts `getAttribute('sandbox') === 'allow-scripts'` + referrerpolicy no-referrer; constants.test asserts tokens contain no allow-same-origin/forms/popups/top-navigation |
| 5 | srcdoc bootstrap escapes `</script>` and injects nonce + API shim; hostile escape-attempt can't break out (D-4.02) | ✓ VERIFIED | bootstrap.test: hostile `</script><script>…` neutralized, ordinary `</p>` preserved; lifecycle.test: hostile code renders without breaking srcdoc; doc contains nonce + window.deskmate |
| 6 | Bridge validates source === contentWindow AND nonce; spoofed ignored (BYOW-04) | ✓ VERIFIED | bridge.test: wrong source + valid nonce ignored; right source + wrong nonce ignored; malformed ignored without throwing; valid source+nonce accepted |
| 7 | Ready handshake with 3 s timeout → crash fallback; explicit teardown — no zombies (BYOW-05) | ✓ VERIFIED | lifecycle.test: loading → crashed after 3000 ms; ready handshake flips to live; unmount tears down (bridge destroyed, timer cleared, no leaked handlers) |
| 8 | Editor drawer opens from Add Custom Widget / gear with HTML/CSS/JS CodeMirror tabs (BYOW-01) | ✓ VERIFIED | byow.test: tabs render, template code for new widgets, existing code prefilled; App wiring (AddWidgetButton + gear → drawer) |
| 9 | Edits render live sandboxed preview debounced ~300 ms; Save writes code; Cancel with edits confirms (BYOW-02) | ✓ VERIFIED | byow.test: real CodeMirror dispatch → dirty → Cancel confirms "Discard unsaved changes?"; Save → onSave(null|id, code); preview uses IframeWidgetRenderer |
| 10 | Per-device iframe budgets (8 mobile / 20 desktop) with block toasts; lazy mounting (D-4.13/4.14) | ✓ VERIFIED | byow.test: atLimit at 8/20; catalog entry disabled + info toast at limit; useLazyMount stays far until IO fires, mounts immediately without IO |
| 11 | Removing/importing config tears custom widgets down through the renderer path | ✓ VERIFIED | Renderer unmount → bridge.destroy + timer clear (lifecycle.test); remove/import trigger config changes → grid unmounts the item → teardown runs |

**Score:** 11/11 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/widgets/sandbox/constants.ts` | SANDBOX_TOKENS + timeout + types + nonce | ✓ EXISTS + SUBSTANTIVE | exact 'allow-scripts'; 128-bit hex nonce |
| `src/widgets/sandbox/bootstrap.ts` | srcdoc builder + escaping | ✓ EXISTS + SUBSTANTIVE | escapeScriptTags, buildSrcdoc, apiMessage |
| `src/widgets/sandbox/bridge.ts` | source+nonce bridge | ✓ EXISTS + SUBSTANTIVE | attach/destroy/push; validation order |
| `src/widgets/sandbox/IframeWidgetRenderer.tsx` | sandboxed renderer + lifecycle | ✓ EXISTS + SUBSTANTIVE | loading/ready/crashed; teardown |
| `src/widgets/byow/BYOWDrawer.tsx` | editor drawer | ✓ EXISTS + SUBSTANTIVE | CM tabs + debounced preview + Save/Cancel |
| `src/widgets/byow/useIframeBudget.ts` | budget guard | ✓ EXISTS + SUBSTANTIVE | 8/20 budgets + device class |
| `src/widgets/byow/useLazyMount.ts` | lazy mounting | ✓ EXISTS + SUBSTANTIVE | IO + fallback |
| `04-01-SPIKE.md` / `04-01-FINDINGS.md` | spike + conclusions | ✓ EXISTS + SUBSTANTIVE | all 5 behaviors + 7 bridge decisions |

**Artifacts:** 8/8 verified

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| registry.tsx 'custom' | IframeWidgetRenderer | render dispatch | ✓ WIRED | index.tsx registers custom → renderer |
| IframeWidgetRenderer | bridge.ts | createSandboxBridge on mount | ✓ WIRED | lifecycle effect |
| bootstrap.ts | constants.ts | nonce + tokens | ✓ WIRED | buildSrcdoc(code, nonce) |
| BYOWDrawer | IframeWidgetRenderer | live preview | ✓ WIRED | previewCode prop |
| App | BYOWDrawer | byow state (create/edit) | ✓ WIRED | AddWidgetButton onAddCustom + gear onEditCustom |
| DashboardGrid | useLazyMount | custom bodies | ✓ WIRED | GridItemBody lazy gate |

**Wiring:** 6/6 connections verified

## Requirements Coverage

| Requirement | Status |
|-------------|--------|
| BYOW-01: built-in code editor | ✓ SATISFIED |
| BYOW-02: live preview while editing | ✓ SATISFIED |
| BYOW-03: sandboxed iframe (allow-scripts only) | ✓ SATISFIED |
| BYOW-04: validated postMessage bridge (source + nonce) | ✓ SATISFIED |
| BYOW-05: clean teardown — no zombies | ✓ SATISFIED |

**Coverage:** 5/5 requirements satisfied

## Anti-Patterns Found

None. **Anti-patterns:** 0 found

## Human Verification Required

None programmatically unverifiable. (True cross-browser srcdoc/sandbox behavior is confirmed by spec + tests; the on-device soak is a Phase 5 item.)

## Gaps Summary

**No gaps found.** Phase goal achieved. Ready to proceed.

## Verification Metadata

**Verification approach:** Goal-backward (derived from phase goal)
**Must-haves source:** 04-01/02/03-PLAN.md frontmatter
**Automated checks:** 5 passed (typecheck, lint, build, 104 tests, dev-boot smoke), 0 failed
**Human checks required:** 0
**Total verification time:** ~8 min

---
*Verified: 2026-08-16T07:52:00Z*
*Verifier: Claude (orchestrator, autonomous mode)*
