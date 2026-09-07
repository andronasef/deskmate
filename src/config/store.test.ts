import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useConfigStore } from './store.ts'
import type { ConfigStore } from './store.ts'
import { GRID_COLS, GRID_ROWS } from './defaultConfig.ts'

const state = (): ConfigStore => useConfigStore.getState()

describe('config store grid actions (GRID-01…04)', () => {
  beforeEach(() => {
    localStorage.clear()
    useConfigStore.getState().reset()
    useConfigStore.setState({ hasHydrated: true })
    vi.restoreAllMocks()
  })

  it('addWidget appends a widget, returns its id, and places it at the first free slot', () => {
    const before = state().config.widgets.length
    const id = state().addWidget('clock')

    expect(id.length).toBeGreaterThan(0)
    const after = state().config.widgets
    expect(after).toHaveLength(before + 1)
    const added = after.find((w) => w.id === id)
    expect(added?.type).toBe('clock')
    const item = (state().config.layout.lg ?? []).find((li) => li.i === id)
    expect(item).toBeDefined()
    expect(item!.x).toBeGreaterThanOrEqual(0)
    expect(item!.w).toBeGreaterThanOrEqual(1)
  })

  // A breakpoint missing an entry makes RGL fall back to a 1x1 cell at the
  // origin, so the grid looks broken on every viewport but the one it was added from.
  it('addWidget places the new item on EVERY breakpoint layout', () => {
    const id = state().addWidget('clock')

    const breakpoints = Object.keys(state().config.layout)
    expect(breakpoints.length).toBeGreaterThan(1)
    for (const bp of breakpoints) {
      const item = state().config.layout[bp].find((li) => li.i === id)
      expect(item, `missing layout item on breakpoint "${bp}"`).toBeDefined()
      expect(item!.w).toBeGreaterThanOrEqual(1)
      expect(item!.h).toBeGreaterThanOrEqual(1)
    }
  })

  it('addWidget keeps new items inside the capped grid (never below the fold)', () => {
    // The grid is hard-capped to GRID_ROWS so it never scrolls. Placement used to
    // append below the lowest item, which on a full screen lands out of bounds and
    // gets clamped on top of an existing widget.
    for (let n = 0; n < 6; n++) {
      state().addWidget('clock')
    }
    for (const [bp, items] of Object.entries(state().config.layout)) {
      for (const li of items) {
        expect(li.y + li.h, `${bp}/${li.i} placed past row ${GRID_ROWS}`).toBeLessThanOrEqual(GRID_ROWS)
        expect(li.x + li.w, `${bp}/${li.i} placed past col ${GRID_COLS[bp]}`).toBeLessThanOrEqual(GRID_COLS[bp])
      }
    }
  })

  it('addWidget is blocked at the 50-widget cap', () => {
    const widgets = Array.from({ length: 50 }, (_, i) => ({ id: `w${i}`, type: 'clock', settings: {} }))
    state().importConfig({ ...state().config, widgets })

    const id = state().addWidget('clock')
    expect(id).toBe('')
    expect(state().config.widgets).toHaveLength(50)
  })

  it('removeWidget removes from widgets AND from every breakpoint layout', () => {
    const victim = state().config.widgets[0].id
    state().removeWidget(victim)

    expect(state().config.widgets.find((w) => w.id === victim)).toBeUndefined()
    for (const items of Object.values(state().config.layout)) {
      expect(items.find((li) => li.i === victim)).toBeUndefined()
    }
  })

  it('setLayout replaces the layout but rejects invalid candidates', () => {
    const first = state().config.layout.lg![0]

    state().setLayout({ lg: [{ ...first, x: 2, y: 3 }], md: [], sm: [], xs: [], xxs: [] })
    expect(state().config.layout.lg![0].x).toBe(2)
    expect(state().config.layout.lg![0].y).toBe(3)

    // Schema-invalid candidate (item missing required h) is rejected — state untouched.
    const before = JSON.stringify(state().config.layout)
    state().setLayout({ lg: [{ i: 'ghost', x: 0, y: 0, w: 4 }] as never })
    expect(JSON.stringify(state().config.layout)).toBe(before)
  })

  it('updateWidget merges settings for the target widget only', () => {
    const target = state().config.widgets[0]
    state().updateWidget(target.id, { format: '24h' })
    state().updateWidget(target.id, { showSeconds: true })

    const updated = state().config.widgets.find((w) => w.id === target.id)
    expect(updated?.settings).toEqual({ format: '24h', showSeconds: true })
    expect(
      state()
        .config.widgets.filter((w) => w.id !== target.id)
        .every((w) => Object.keys(w.settings).length === 0),
    ).toBe(true)
  })
})
