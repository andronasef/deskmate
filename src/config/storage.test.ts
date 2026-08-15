import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defaultConfig } from './defaultConfig.ts'
import { BACKUP_KEY, STORAGE_KEY, loadConfig, saveConfig, storageAvailable } from './storage.ts'

function seedStorage(value: string): void {
  localStorage.setItem(STORAGE_KEY, value)
}

describe('storage adapter', () => {
  let warnSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    localStorage.clear()
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    warnSpy.mockRestore()
    vi.restoreAllMocks()
  })

  it('returns false from storageAvailable when setItem throws (quota-0/private mode), and loadConfig/saveConfig do not throw', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError')
    })

    expect(storageAvailable()).toBe(false)
    expect(() => loadConfig()).not.toThrow()
    expect(() => saveConfig(defaultConfig())).not.toThrow()
  })

  it('returns null on corrupt JSON, preserves the exact raw string in backup, and warns', () => {
    seedStorage('{broken')
    const result = loadConfig()
    expect(result).toBeNull()
    expect(localStorage.getItem(BACKUP_KEY)).toBe('{broken')
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('[deskmate:storage] config rejected'))
  })

  it('returns the parsed config for a valid stored value', () => {
    const config = defaultConfig()
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
    expect(loadConfig()).toEqual(config)
  })

  it('returns null for a future-version config (version 99) and preserves the raw backup', () => {
    const raw = JSON.stringify({ version: 99, theme: { accent: '#000000' }, layout: {}, widgets: [] })
    seedStorage(raw)
    const result = loadConfig()
    expect(result).toBeNull()
    expect(localStorage.getItem(BACKUP_KEY)).toBe(raw)
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('version=99'))
  })

  it('does not throw and warns when saveConfig hits a quota error', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError')
    })
    expect(() => saveConfig(defaultConfig())).not.toThrow()
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('[deskmate:storage]'))
  })
})
