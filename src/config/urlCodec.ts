import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string'
import { validateConfig } from './schemas.ts'
import { sanitizeConfig, sanitizeLayout } from './sanitize.ts'
import type { DashboardConfig } from './types.ts'

/** Hard cap on the compressed ?config= payload (D-2.12, RESEARCH §3). */
export const URL_CONFIG_CAP = 4096

export const URL_CONFIG_PARAM = 'config'

/** CFG-04 encode: lz-string URI-safe payload; null when over the cap (caller falls back to file). */
export function encodeConfigToUrl(config: DashboardConfig): string | null {
  const compressed = compressToEncodedURIComponent(JSON.stringify(config))
  if (compressed.length > URL_CONFIG_CAP) {
    return null
  }
  return compressed
}

/**
 * CFG-04 decode: read ?config= from a search string, decompress, parse, sanitize,
 * validate. Returns null on any failure (stored config renders instead).
 */
export function decodeConfigFromUrl(search: string): DashboardConfig | null {
  const params = new URLSearchParams(search)
  const payload = params.get(URL_CONFIG_PARAM)
  if (payload == null || payload.length === 0) {
    return null
  }
  if (payload.length > URL_CONFIG_CAP) {
    return null
  }
  let json: string
  try {
    json = decompressFromEncodedURIComponent(payload)
  } catch {
    return null
  }
  if (json == null || json.length === 0) {
    return null
  }
  let parsed: unknown
  try {
    parsed = JSON.parse(json)
  } catch {
    return null
  }
  try {
    const draft = validateConfig(sanitizeConfig(parsed))
    const layout = sanitizeLayout(draft.layout, new Set(draft.widgets.map((w) => w.id)))
    return { ...draft, layout }
  } catch {
    return null
  }
}
