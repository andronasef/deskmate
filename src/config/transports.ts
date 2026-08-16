import { useConfigStore } from './store.ts'
import { backupRaw, safeGet, STORAGE_KEY } from './storage.ts'
import { validateConfig } from './schemas.ts'
import { sanitizeConfig, sanitizeLayout } from './sanitize.ts'
import type { DashboardConfig } from './types.ts'

export const EXPORT_FILENAME = 'deskmate-config.json'

/** CFG-02: download the raw validated DashboardConfig as JSON. */
export function exportConfig(config: DashboardConfig): void {
  const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = EXPORT_FILENAME
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

export type ImportResult = { ok: true } | { ok: false; reason: string }

/** CFG-03: parse → sanitize → validate → backup current → replace. Never mutates on failure. */
export async function importConfigFromFile(file: File): Promise<ImportResult> {
  let text: string
  try {
    text = await file.text()
  } catch {
    return { ok: false, reason: 'could not read the file' }
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    return { ok: false, reason: 'not valid JSON' }
  }

  let config: DashboardConfig
  try {
    const mended = sanitizeConfig(parsed)
    // Sanitize layout against the widgets that actually survive validation.
    const draft = validateConfig(mended)
    const sanitized = sanitizeLayout(draft.layout, new Set(draft.widgets.map((w) => w.id)))
    config = { ...draft, layout: sanitized }
    validateConfig(config)
  } catch (err) {
    return { ok: false, reason: err instanceof Error ? err.message : 'invalid configuration' }
  }

  const store = useConfigStore.getState()
  // Backup the current config before replacing (D-2.10 — never destroy user data).
  const currentRaw = safeGet(STORAGE_KEY)
  if (currentRaw != null) {
    backupRaw(currentRaw)
  }
  store.importConfig(config)
  return { ok: true }
}
