import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defaultConfig } from './defaultConfig.ts'
import type { ConfigStore } from './store.ts'

const STORAGE_KEY = 'deskmate.config.v1'
const BACKUP_KEY = 'deskmate.config.backup'

describe('config store boot path (recovery on reload)', () => {
  let warnSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    localStorage.clear()
    vi.resetModules()
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    warnSpy.mockRestore()
    vi.restoreAllMocks()
  })

  async function bootStore(): Promise<ConfigStore> {
    const { useConfigStore } = await import('./store.ts')
    await vi.waitFor(() => {
      expect(useConfigStore.getState().hasHydrated).toBe(true)
    })
    return useConfigStore.getState() as ConfigStore
  }

  it('first run: hydrates with the default-shaped config (3 seeded widgets)', async () => {
    const state = await bootStore()
    expect(state.config.widgets.map((w) => w.type)).toEqual(['clock', 'github-pulse', 'pomodoro'])
    expect(state.config.version).toBe(1)
    expect((state as { hasHydrated: boolean }).hasHydrated).toBe(true)
  })

  it('valid reload: hydrates exactly the stored config (round-trip)', async () => {
    const stored = {
      version: 1,
      theme: { accent: '#FF8800' },
      layout: { lg: [{ i: 'w1', x: 0, y: 0, w: 4, h: 4 }] },
      widgets: [{ id: 'w1', type: 'clock', settings: { format: '24h' } }],
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored))

    const state = await bootStore()
    expect(state.config).toEqual(stored)
    expect((state as { hasHydrated: boolean }).hasHydrated).toBe(true)
  })

  it('corrupt reload: recovers to default-shaped config, raw preserved in backup, warns', async () => {
    const raw = '{bad json'
    localStorage.setItem(STORAGE_KEY, raw)

    const state = await bootStore()
    expect(state.config.widgets.map((w) => w.type)).toEqual(['clock', 'github-pulse', 'pomodoro'])
    expect(localStorage.getItem(BACKUP_KEY)).toBe(raw)
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('[deskmate:storage]'))
  })

  it('version mismatch (99): recovers to default-shaped config, raw preserved in backup', async () => {
    const raw = JSON.stringify({ version: 99, theme: { accent: '#000' }, layout: {}, widgets: [] })
    localStorage.setItem(STORAGE_KEY, raw)

    const state = await bootStore()
    expect(state.config.widgets.map((w) => w.type)).toEqual(['clock', 'github-pulse', 'pomodoro'])
    expect(localStorage.getItem(BACKUP_KEY)).toBe(raw)
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('version=99'))
  })

  it('importConfig replaces the config and persists only the validated DashboardConfig (no envelope)', async () => {
    await bootStore()
    const { useConfigStore } = await import('./store.ts')
    const imported = {
      version: 1,
      theme: { accent: '#00FF00' },
      layout: {},
      widgets: [{ id: 'x', type: 'pomodoro', settings: { minutes: 25 } }],
    }
    useConfigStore.getState().importConfig(imported)

    const state = useConfigStore.getState()
    expect(state.config).toEqual(imported)
    const persisted = localStorage.getItem(STORAGE_KEY)
    expect(persisted).not.toBeNull()
    expect(JSON.parse(persisted as string)).toEqual(imported)
    expect(JSON.parse(persisted as string)).not.toHaveProperty('state')
    expect(defaultConfig().widgets.map((w) => w.type)).toEqual(['clock', 'github-pulse', 'pomodoro'])
  })
})
