import { DEFAULT_THEME_ACCENT, GRID_COLS } from './defaultConfig.ts'
import type { LayoutItem, LayoutMap } from './types.ts'

/**
 * Layout sanitization (D-2.14, success criterion 5): imported/URL-loaded layouts
 * are deduped, clamped, and pruned so a bad layout can never break the grid.
 */
export function sanitizeLayout(layout: LayoutMap, widgetIds: ReadonlySet<string>): LayoutMap {
  const result: LayoutMap = {}
  for (const [breakpoint, items] of Object.entries(layout)) {
    if (!Array.isArray(items)) {
      continue
    }
    const cols = GRID_COLS[breakpoint] ?? 12
    const seen = new Set<string>()
    const cleaned: LayoutItem[] = []
    for (const raw of items) {
      if (raw == null || typeof raw !== 'object') {
        continue
      }
      const li = raw as Partial<LayoutItem>
      // Required fields (schema): i/x/y/w/h. Drop items missing them.
      if (typeof li.i !== 'string' || li.i.length === 0) {
        continue
      }
      if (typeof li.x !== 'number' || typeof li.y !== 'number' || typeof li.w !== 'number' || typeof li.h !== 'number') {
        continue
      }
      // Only keep items whose widget still exists in the config.
      if (!widgetIds.has(li.i)) {
        continue
      }
      // Dedupe by id — first occurrence wins.
      if (seen.has(li.i)) {
        continue
      }
      seen.add(li.i)
      cleaned.push({
        i: li.i,
        x: Math.max(0, Math.floor(li.x)),
        y: Math.max(0, Math.floor(li.y)),
        w: Math.min(cols, Math.max(1, Math.floor(li.w))),
        h: Math.max(1, Math.floor(li.h)),
      })
    }
    result[breakpoint] = cleaned
  }
  return result
}

/**
 * Mend obviously-wrong raw shapes before validation so zod either passes or fails
 * cleanly instead of throwing on malformed structures (success criterion 5).
 */
export function sanitizeConfig(raw: unknown): unknown {
  if (raw == null || typeof raw !== 'object') {
    return raw
  }
  const obj = raw as Record<string, unknown>
  const out: Record<string, unknown> = { ...obj }
  if (out.layout == null || typeof out.layout !== 'object' || Array.isArray(out.layout)) {
    out.layout = {}
  }
  if (!Array.isArray(out.widgets)) {
    out.widgets = []
  }
  if (out.theme == null || typeof out.theme !== 'object' || Array.isArray(out.theme)) {
    out.theme = { accent: DEFAULT_THEME_ACCENT }
  }
  if (typeof out.version !== 'number') {
    out.version = 1
  }
  return out
}
