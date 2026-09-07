import { create } from 'zustand'
import type { StateStorage } from 'zustand/middleware'
import { createJSONStorage, persist } from 'zustand/middleware'
import { defaultConfig, GRID_COLS } from './defaultConfig.ts'
import { validateConfig } from './schemas.ts'
import { BACKUP_KEY, STORAGE_KEY, safeGet, safeRemove, safeSet } from './storage.ts'
import type { WakeLockState } from '../kiosk/wakeLock.ts'
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
  // Kiosk slice (D-5.02): UI state — NOT persisted.
  wakeLock: WakeLockState
  fullscreen: boolean
  setWakeLock: (s: WakeLockState) => void
  setFullscreen: (fs: boolean) => void
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

/**
 * Place a new widget on EVERY breakpoint. A breakpoint with no entry for an item
 * makes RGL fall back to a 1x1 cell at the origin, which reads as a broken grid
 * on any viewport the widget wasn't added from.
 */
function placeOnAllBreakpoints(layout: LayoutMap, id: string): LayoutMap {
  const next: LayoutMap = {}
  for (const bp of Object.keys(GRID_COLS)) {
    const items = layout[bp] ?? []
    const cols = GRID_COLS[bp]
    // Narrow breakpoints stack full-width; lg/md keep the 4-col card size.
    const w = Math.min(4, cols)
    const y = items.reduce((max, li) => Math.max(max, li.y + li.h), 0)
    const x = bp === 'lg' ? firstFreeSlot(items).x : 0
    next[bp] = [...items, { i: id, x: Math.min(x, cols - w), y, w, h: 2 }]
  }
  // Preserve any breakpoint keys not in GRID_COLS rather than dropping them.
  for (const [bp, items] of Object.entries(layout)) {
    if (next[bp] == null) {
      next[bp] = items
    }
  }
  return next
}

export const useConfigStore = create<ConfigStore>()(
  persist(
    (set, get) => ({
      config: defaultConfig(),
      hasHydrated: false,
      wakeLock: 'inactive',
      fullscreen: false,
      setWakeLock: (s) => set({ wakeLock: s }),
      setFullscreen: (fs) => set({ fullscreen: fs }),
      reset: () => set({ config: defaultConfig() }),
      importConfig: (raw: unknown) => set({ config: validateConfig(raw) }),
      addWidget: (type: string) => {
        const { config } = get()
        if (config.widgets.length >= 50) {
          return ''
        }
        const id = `w-${type}-${crypto.randomUUID().slice(0, 8)}`
        const widget = { id, type, settings: {} }
        const layout = placeOnAllBreakpoints(config.layout, id)
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
