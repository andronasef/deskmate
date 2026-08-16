import { create } from 'zustand'
import type { StateStorage } from 'zustand/middleware'
import { createJSONStorage, persist } from 'zustand/middleware'
import { defaultConfig } from './defaultConfig.ts'
import { validateConfig } from './schemas.ts'
import { BACKUP_KEY, STORAGE_KEY, safeGet, safeRemove, safeSet } from './storage.ts'
import type { DashboardConfig } from './types.ts'

export interface ConfigStore {
  config: DashboardConfig
  hasHydrated: boolean
  reset: () => void
  importConfig: (raw: unknown) => void
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

export const useConfigStore = create<ConfigStore>()(
  persist(
    (set) => ({
      config: defaultConfig(),
      hasHydrated: false,
      reset: () => set({ config: defaultConfig() }),
      importConfig: (raw: unknown) => set({ config: validateConfig(raw) }),
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
