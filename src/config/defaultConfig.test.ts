import { describe, expect, it } from 'vitest'
import { DEFAULT_THEME_ACCENT, defaultConfig, GRID_COLS, GRID_ROWS, SEEDED_WIDGETS } from './defaultConfig.ts'

describe('defaultConfig', () => {
  it('returns a fresh object each call with version 1, accent theme, per-breakpoint layout, and 3 seeded widgets', () => {
    const a = defaultConfig()
    const b = defaultConfig()

    expect(a).not.toBe(b)

    expect(a.version).toBe(1)
    expect(a.theme.accent).toBe(DEFAULT_THEME_ACCENT)
    expect(DEFAULT_THEME_ACCENT).toBe('#ff8c1a')

    // Per-breakpoint seeded layout (D-2.07): every breakpoint present, every widget placed.
    const bps = Object.keys(a.layout)
    expect(bps.sort()).toEqual(['lg', 'md', 'sm', 'xs', 'xxs'])
    for (const [bp, items] of Object.entries(a.layout)) {
      expect(items).toHaveLength(3)
      for (const li of items) {
        expect(li.w).toBeGreaterThanOrEqual(1)
        expect(li.w).toBeLessThanOrEqual(GRID_COLS[bp])
        expect(li.h).toBeGreaterThanOrEqual(1)
        // Must fit within the column count, not just be narrower than it —
        // `md` used to seed x=8,w=4 into a 10-col grid and get silently clamped.
        expect(li.x + li.w, `${bp}/${li.i} overflows ${GRID_COLS[bp]} cols`).toBeLessThanOrEqual(GRID_COLS[bp])
        // The grid is capped at GRID_ROWS (RGL maxRows) so it never scrolls;
        // a seeded item past that would be silently clamped onto another one.
        expect(li.y + li.h, `${bp}/${li.i} overflows ${GRID_ROWS} rows`).toBeLessThanOrEqual(GRID_ROWS)
      }
    }

    expect(a.widgets.map((w) => w.type)).toEqual(['clock', 'github-pulse', 'pomodoro'])
    expect(a.widgets.map((w) => w.id)).toEqual(SEEDED_WIDGETS.map((w) => w.id))
    expect(new Set(a.widgets.map((w) => w.id)).size).toBe(3)

    // Layout item ids match widget ids exactly (grid ↔ config consistency).
    const widgetIds = new Set(a.widgets.map((w) => w.id))
    for (const items of Object.values(a.layout)) {
      for (const li of items) {
        expect(widgetIds.has(li.i)).toBe(true)
      }
    }
  })

  it('keeps widget ids stable across calls (deterministic defaults)', () => {
    expect(defaultConfig().widgets.map((w) => w.id)).toEqual(defaultConfig().widgets.map((w) => w.id))
  })
})
