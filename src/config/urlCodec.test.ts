import { describe, expect, it } from 'vitest'
import { compressToEncodedURIComponent } from 'lz-string'
import { defaultConfig } from './defaultConfig.ts'
import { decodeConfigFromUrl, encodeConfigToUrl } from './urlCodec.ts'

describe('urlCodec (CFG-04)', () => {
  it('encode → decode round-trips the seeded config', () => {
    const config = defaultConfig()
    const encoded = encodeConfigToUrl(config)
    expect(encoded).not.toBeNull()

    const decoded = decodeConfigFromUrl(`?config=${encoded}`)
    expect(decoded).toEqual(config)
  })

  it('decode of garbage / missing payload returns null', () => {
    expect(decodeConfigFromUrl('')).toBeNull()
    expect(decodeConfigFromUrl('?other=1')).toBeNull()
    expect(decodeConfigFromUrl('?config=%zz%zz')).toBeNull()
    expect(decodeConfigFromUrl('?config=not-valid-lzstring')).toBeNull()
  })

  it('decode of a structurally-invalid config returns null', () => {
    // Valid lz-string of invalid JSON shape → null (sanitize/validate fails cleanly).
    const garbage = compressToEncodedURIComponent('{"version":99,"theme":{},"layout":{},"widgets":[]}')
    expect(decodeConfigFromUrl(`?config=${garbage}`)).toBeNull()
  })

  it('oversized payloads are rejected by the hard cap (D-2.12)', () => {
    const big = defaultConfig()
    // Non-repetitive data (repetitive strings compress too well to reliably exceed the cap).
    big.widgets[0].settings = { data: Array.from({ length: 2600 }, (_, i) => `${i.toString(36).padStart(4, '0')}:v${i}`) }

    const encoded = encodeConfigToUrl(big)
    expect(encoded).toBeNull()
  })

  it('decoded config is sanitized (layout pruned to existing widgets)', () => {
    const payload = compressToEncodedURIComponent(
      JSON.stringify({
        version: 1,
        theme: { accent: '#112233' },
        layout: { lg: [{ i: 'ghost', x: 0, y: 0, w: 2, h: 2 }] },
        widgets: [{ id: 'w-clock-1', type: 'clock', settings: {} }],
      }),
    )
    const decoded = decodeConfigFromUrl(`?config=${payload}`)
    expect(decoded).not.toBeNull()
    expect(decoded!.layout.lg).toHaveLength(0) // ghost item pruned
    expect(decoded!.widgets).toHaveLength(1)
  })
})
