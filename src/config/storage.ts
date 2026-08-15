import { validateConfig } from './schemas.ts'
import type { DashboardConfig } from './types.ts'

export const STORAGE_KEY = 'deskmate.config.v1'
export const BACKUP_KEY = 'deskmate.config.backup'

export type Migration = (raw: unknown) => unknown

export const MIGRATIONS: Record<number, Migration> = {
  1: (raw) => raw,
}

const PROBE_KEY = '__deskmate_probe__'

export function storageAvailable(): boolean {
  try {
    localStorage.setItem(PROBE_KEY, '1')
    localStorage.removeItem(PROBE_KEY)
    return true
  } catch {
    return false
  }
}

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function safeSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value)
  } catch {
    console.warn(`[deskmate:storage] failed to write ${key} — storage unavailable or quota exceeded`)
  }
}

export function backupRaw(raw: string): void {
  if (safeGet(BACKUP_KEY) !== raw) {
    safeSet(BACKUP_KEY, raw)
  }
}

export function loadConfig(): DashboardConfig | null {
  const raw = safeGet(STORAGE_KEY)
  if (raw === null) {
    return null
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    warnRejected('unknown', 'JSON parse failed', raw)
    return null
  }

  try {
    return validateConfig(parsed)
  } catch (err) {
    const version = (parsed as { version?: number } | null)?.version
    const migration = version != null ? MIGRATIONS[version] : undefined
    if (migration) {
      try {
        const migrated = migration(parsed)
        return validateConfig(migrated)
      } catch {
        warnRejected(String(version), String(err instanceof Error ? err.message : err), raw)
        return null
      }
    }
    warnRejected(String(version ?? 'unknown'), String(err instanceof Error ? err.message : err), raw)
    return null
  }
}

function warnRejected(version: string, reason: string, raw: string): void {
  backupRaw(raw)
  console.warn(
    `[deskmate:storage] config rejected (version=${version}): ${reason} — raw backup preserved at ${BACKUP_KEY}`,
  )
}

export function saveConfig(config: DashboardConfig): void {
  safeSet(STORAGE_KEY, JSON.stringify(config))
}
