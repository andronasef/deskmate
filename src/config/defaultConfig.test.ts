import { describe, expect, it } from 'vitest'
import { DEFAULT_THEME_ACCENT, defaultConfig } from './defaultConfig.ts'

describe('defaultConfig', () => {
  it('returns a fresh object each call with version 1, accent theme, empty layout, and 3 seeded widgets', () => {
    const a = defaultConfig()
    const b = defaultConfig()

    expect(a).not.toBe(b)

    expect(a.version).toBe(1)
    expect(a.theme.accent).toBe(DEFAULT_THEME_ACCENT)
    expect(DEFAULT_THEME_ACCENT).toBe('#22D3EE')
    expect(a.layout).toEqual({})
    expect(a.widgets.map((w) => w.type)).toEqual(['clock', 'github-pulse', 'pomodoro'])
    expect(a.widgets.map((w) => w.id)).toEqual([
      expect.stringMatching(/.+/),
      expect.stringMatching(/.+/),
      expect.stringMatching(/.+/),
    ])
    expect(new Set(a.widgets.map((w) => w.id)).size).toBe(3)
  })
})
