import { create } from 'zustand'
import type { StateStorage } from 'zustand/middleware'
import { createJSONStorage, persist } from 'zustand/middleware'
import { defaultConfig } from './defaultConfig.ts'
import { validateConfig } from './schemas.ts'
import { BACKUP_KEY, STORAGE_KEY, safeGet, safeRemove, safeSet } from './storage.ts'
import type { DashboardConfig, LayoutItem, LayoutMap } from './types.ts'

export interface ConfigStore {
  config: DashboardConfig
  hasHydrated: boolean
  reset: () => void
  importConfig: (raw: unknown) => void
  addWidget: (type: string) => string
  removeWidget: (id: string) => void
  setLayout: (layout: LayoutMap) => void
  updateWidget: (id: string, settings: Record<string, unknown>) => void
}

const stateStorage: StateStorage = {
  async getItem(): Promise<string | null> {
    const raw = safeGet(STORAGE_KEY)
    if (raw === null) {
      return null
    }
    let parsed: unknown
    try {
      parsed = JSON.parse(raw)
    } catch {
      backupAndWarn('unknown', 'JSON parse failed', raw)
      return null
    }
    try {
      const config = validateConfig(parsed)
      return JSON.stringify({ state: { config }, version: 0 })
    } catch (err) {
      const version = (parsed as { version?: number } | null)?.version
      backupAndWarn(String(version ?? 'unknown'), String(err instanceof Error ? err.message : err), raw)
      return null
    }
  },
  setItem(_name: string, value: string): void {
    let envelope: { state?: { config?: unknown } }
    try {
      envelope = JSON.parse(value)
    } catch {
      return
    }
    const config = envelope.state?.config
    if (config == null) {
      return
    }
    safeSet(STORAGE_KEY, JSON.stringify(config))
  },
  removeItem(): void {
    safeRemove(STORAGE_KEY)
  },
}

function backupAndWarn(version: string, reason: string, raw: string): void {
  if (safeGet(BACKUP_KEY) !== raw) {
    safeSet(BACKUP_KEY, raw)
  }
  console.warn(
    `[deskmate:storage] config rejected (version=${version}): ${reason} — raw backup preserved at ${BACKUP_KEY}`,
  )
}

/** First free grid slot on the lg layout: find the lowest y row with a free x position. */
function firstFreeSlot(layout: LayoutItem[]): { x: number; y: number } {
  const used = new Set(layout.map((li) => `${li.x},${li.y}`))
  let y = 0
  while (true) {
    for (let x = 0; x < 12; x++) {
      if (!used.has(`${x},${y}`)) {
        return { x, y }
      }
    }
    y++
  }
}

export const useConfigStore = create<ConfigStore>()(
  persist(
    (set, get) => ({
      config: defaultConfig(),
      hasHydrated: false,
      reset: () => set({ config: defaultConfig() }),
      importConfig: (raw: unknown) => set({ config: validateConfig(raw) }),
      addWidget: (type: string) => {
        const { config } = get()
        if (config.widgets.length >= 50) {
          return ''
        }
        const id = `w-${type}-${crypto.randomUUID().slice(0, 8)}`
        const widget = { id, type, settings: {} }
        const { x, y } = firstFreeSlot(config.layout.lg ?? [])
        const layout: LayoutMap = {
          ...config.layout,
          lg: [...(config.layout.lg ?? []), { i: id, x, y, w: 4, h: 2 }],
        }
        set({ config: { ...config, widgets: [...config.widgets, widget], layout } })
        return id
      },
      removeWidget: (id: string) => {
        const { config } = get()
        const layout: LayoutMap = {}
        for (const [bp, items] of Object.entries(config.layout)) {
          layout[bp] = items.filter((li) => li.i !== id)
        }
        set({
          config: {
            ...config,
            widgets: config.widgets.filter((w) => w.id !== id),
            layout,
          },
        })
      },
      setLayout: (layout: LayoutMap) => {
        const { config } = get()
        // Validate-before-commit: never store a layout that fails the schema.
        const candidate = { ...config, layout }
        try {
          validateConfig(candidate)
        } catch {
          return
        }
        set({ config: candidate })
      },
      updateWidget: (id: string, settings: Record<string, unknown>) => {
        const { config } = get()
        set({
          config: {
            ...config,
            widgets: config.widgets.map((w) => (w.id === id ? { ...w, settings: { ...w.settings, ...settings } } : w)),
          },
        })
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => stateStorage),
      partialize: (state) => ({ config: state.config }),
      merge: (persistedState, currentState) => {
        const persisted = persistedState as { config?: unknown } | null
        if (persisted?.config != null) {
          try {
            const config = validateConfig(persisted.config)
            return { ...currentState, config }
          } catch {
            backupRawValue(persisted.config)
          }
        }
        return { ...currentState, config: defaultConfig() }
      },
      onRehydrateStorage: () => () => {
        useConfigStore.setState({ hasHydrated: true })
      },
    },
  ),
)

function backupRawValue(config: unknown): void {
  const raw = JSON.stringify(config)
  if (safeGet(BACKUP_KEY) !== raw) {
    safeSet(BACKUP_KEY, raw)
  }
}
