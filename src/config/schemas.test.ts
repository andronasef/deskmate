import { describe, expect, it } from 'vitest'
import { validateConfig } from './schemas.ts'
import type { DashboardConfig } from './types.ts'

function sampleConfig(): DashboardConfig {
  return {
    version: 1,
    theme: { accent: '#22D3EE' },
    layout: {
      lg: [
        { i: 'w1', x: 0, y: 0, w: 2, h: 2 },
        { i: 'w2', x: 2, y: 0, w: 2, h: 2 },
        { i: 'w3', x: 4, y: 0, w: 2, h: 2 },
      ],
    },
    widgets: [
      { id: 'w1', type: 'clock', settings: {} },
      { id: 'w2', type: 'github-pulse', settings: {} },
      { id: 'w3', type: 'pomodoro', settings: {} },
    ],
  }
}

describe('validateConfig', () => {
  it('accepts a config built from the exact DashboardConfig shape and round-trips it', () => {
    const input = sampleConfig()
    const parsed = validateConfig(JSON.parse(JSON.stringify(input)))
    expect(parsed).toEqual(input)
  })

  it('rejects version 2 and missing version (literal 1 only)', () => {
    const v2 = { ...sampleConfig(), version: 2 }
    expect(() => validateConfig(v2)).toThrow(/deskmate:config/)
    const noVersion = { ...sampleConfig() }
    delete (noVersion as { version?: number }).version
    expect(() => validateConfig(noVersion)).toThrow(/deskmate:config/)
  })

  it('rejects more than 50 widgets', () => {
    const many = sampleConfig()
    many.widgets = Array.from({ length: 51 }, (_, i) => ({
      id: `w${i}`,
      type: 'clock',
      settings: {},
    }))
    expect(() => validateConfig(many)).toThrow(/deskmate:config/)
  })

  it('rejects a widget missing id or type', () => {
    const noId = sampleConfig()
    noId.widgets = [{ type: 'clock', settings: {} } as never]
    expect(() => validateConfig(noId)).toThrow(/deskmate:config/)

    const noType = sampleConfig()
    noType.widgets = [{ id: 'w1', settings: {} } as never]
    expect(() => validateConfig(noType)).toThrow(/deskmate:config/)
  })

  it('strips __proto__ and constructor keys (prototype-pollution defense)', () => {
    const raw = JSON.parse(
      '{"__proto__":{"polluted":true},"constructor":{"prototype":{"polluted":true}},' +
        '"version":1,"theme":{"accent":"#22D3EE"},"layout":{},"widgets":[]}',
    )
    const parsed = validateConfig(raw) as unknown as Record<string, unknown>
    expect(Object.keys(parsed).sort()).toEqual(['layout', 'theme', 'version', 'widgets'])
    expect((parsed as { polluted?: unknown }).polluted).toBeUndefined()
  })

  it('rejects an invalid layout item (missing x/y/w/h)', () => {
    const bad = sampleConfig()
    bad.layout = {
      lg: [{ i: 'w1', w: 2, h: 2 } as never],
    }
    expect(() => validateConfig(bad)).toThrow(/deskmate:config/)
  })
})
