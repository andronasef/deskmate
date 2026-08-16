/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('PWA manifest (KIOSK-03)', () => {
  it('is valid JSON with the required installability fields', () => {
    const raw = readFileSync('public/manifest.webmanifest', 'utf-8')
    const manifest = JSON.parse(raw)
    expect(manifest.name).toBe('DeskMate')
    expect(manifest.short_name).toBe('DeskMate')
    expect(manifest.display).toBe('standalone')
    expect(manifest.start_url).toBe('/')
    expect(manifest.theme_color).toBe('#0A0D12')
    expect(manifest.background_color).toBe('#0A0D12')
    expect(Array.isArray(manifest.icons)).toBe(true)
    const sizes = manifest.icons.map((i: { sizes: string }) => i.sizes)
    expect(sizes).toContain('192x192')
    expect(sizes).toContain('512x512')
  })

  it('icon files exist and are PNGs', () => {
    const icon192 = readFileSync('public/icons/icon-192.png')
    const icon512 = readFileSync('public/icons/icon-512.png')
    expect(icon192.subarray(0, 8)).toEqual(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
    expect(icon512.subarray(0, 8)).toEqual(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  })

  it('index.html links the manifest and theme color', () => {
    const html = readFileSync('index.html', 'utf-8')
    expect(html).toContain('<link rel="manifest" href="/manifest.webmanifest" />')
    expect(html).toContain('<meta name="theme-color" content="#0A0D12" />')
  })
})
