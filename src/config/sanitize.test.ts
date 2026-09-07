import { describe, expect, it } from 'vitest'
import { defaultConfig } from './defaultConfig.ts'
import { sanitizeConfig, sanitizeLayout } from './sanitize.ts'
import { validateConfig } from './schemas.ts'

const WIDGET_IDS = () => new Set(defaultConfig().widgets.map((w) => w.id))

describe('sanitizeLayout (success criterion 5)', () => {
  it('drops duplicate item keys — first occurrence wins', () => {
    const ids = WIDGET_IDS()
    const id = [...ids][0]
    const cleaned = sanitizeLayout(
      {
        lg: [
          { i: id, x: 0, y: 0, w: 4, h: 4 },
          { i: id, x: 8, y: 8, w: 2, h: 2 },
        ],
      },
      ids,
    )
    expect(cleaned.lg).toHaveLength(1)
    expect(cleaned.lg![0].x).toBe(0)
  })

  it('clamps invalid w/h to valid ranges (w ≤ cols, min 1)', () => {
    const ids = WIDGET_IDS()
    const id = [...ids][0]
    const cleaned = sanitizeLayout({ lg: [{ i: id, x: -2, y: -1, w: 99, h: 0 }] }, ids)
    expect(cleaned.lg![0].x).toBe(0)
    expect(cleaned.lg![0].y).toBe(0)
    expect(cleaned.lg![0].w).toBe(12) // clamped to lg cols (12)
    expect(cleaned.lg![0].h).toBe(1) // height unbounded above, min 1 enforced
  })

  it('drops items missing required fields and items for unknown widgets', () => {
    const ids = WIDGET_IDS()
    const id = [...ids][0]
    const cleaned = sanitizeLayout(
      {
        lg: [
          { i: id, x: 0, y: 0, w: 4, h: 4 },
          { i: 'no-h-field', x: 0, y: 0, w: 4 } as never,
          { i: 'ghost-widget', x: 0, y: 0, w: 2, h: 2 },
          'garbage' as never,
        ],
      },
      ids,
    )
    expect(cleaned.lg).toHaveLength(1)
    expect(cleaned.lg![0].i).toBe(id)
  })

  it('skips non-array / unknown breakpoints', () => {
    const ids = WIDGET_IDS()
    const cleaned = sanitizeLayout({ lg: 'nope' as never, xx: [{ i: [...ids][0], x: 0, y: 0, w: 1, h: 1 }] }, ids)
    expect(cleaned.lg).toBeUndefined()
    expect(cleaned.xx).toHaveLength(1)
  })
})

describe('sanitizeConfig', () => {
  it('mends malformed shapes so validateConfig either passes or fails cleanly (never throws)', () => {
    expect(() => validateConfig(sanitizeConfig({}))).not.toThrow()
    const mended = sanitizeConfig({ version: 'x', layout: 'garbage', widgets: 'nope', theme: null })
    expect(mended).toMatchObject({ version: 1, layout: {}, widgets: [], theme: { accent: '#ff8c1a' } })
  })

  it('passes a valid config through unchanged in shape', () => {
    const good = defaultConfig()
    const mended = sanitizeConfig(good) as typeof good
    expect(mended.widgets).toHaveLength(good.widgets.length)
    expect(Object.keys(mended.layout)).toEqual(Object.keys(good.layout))
  })
})
