import type { DashboardConfig, LayoutItem, LayoutMap, WidgetInstance } from './types.ts'

export const DEFAULT_THEME_ACCENT = '#ff8c1a'

export const GRID_BREAKPOINTS: Record<string, number> = {
  lg: 1200,
  md: 996,
  sm: 768,
  xs: 480,
  xxs: 0,
}

/**
 * Rows in one screenful. The grid is hard-capped to this many rows (RGL `maxRows`)
 * and rowHeight is derived from it, so a widget's `h` is a fraction of the viewport
 * and nothing can be resized or dragged past the bottom edge — the dashboard never
 * grows a scrollbar. Every seeded layout below fits within it.
 */
export const GRID_ROWS = 8

export const GRID_COLS: Record<string, number> = {
  lg: 12,
  md: 10,
  sm: 6,
  xs: 4,
  xxs: 2,
}

/** Stable seeded widget ids — deterministic across reloads so the default layout keys match. */
export const SEEDED_WIDGETS: ReadonlyArray<{ id: string; type: string }> = [
  { id: 'w-clock-1', type: 'clock' },
  { id: 'w-github-1', type: 'github-pulse' },
  { id: 'w-pomodoro-1', type: 'pomodoro' },
]

function item(id: string, x: number, y: number, w: number, h: number): LayoutItem {
  return { i: id, x, y, w, h }
}

function defaultLayout(): LayoutMap {
  // Destructure in SEEDED_WIDGETS order — clock, github, pomodoro.
  const [clock, github, pomodoro] = SEEDED_WIDGETS.map((w) => w.id)
  // Heights are in viewport rows (GRID_ROWS = 8). Widgets fill only the top half
  // by default — the bottom half is left genuinely empty, not just visually spare,
  // so there's room to drag/resize into. A grid seeded to 100% capacity has nowhere
  // for a collision to resolve to and every drag snaps right back where it started.
  return {
    // lg (12 cols): three widgets side by side, all half-height.
    lg: [item(clock, 0, 0, 4, 4), item(pomodoro, 4, 0, 4, 4), item(github, 8, 0, 4, 4)],
    // md (10 cols): narrower so x+w stays within 10 (was x=8,w=4 → overflowed to 12)
    md: [item(clock, 0, 0, 4, 4), item(pomodoro, 4, 0, 3, 4), item(github, 7, 0, 3, 4)],
    // Narrow breakpoints stack full-width, 3+2+3 rows so the stack still fits one screen.
    sm: [item(clock, 0, 0, 6, 3), item(pomodoro, 0, 3, 6, 2), item(github, 0, 5, 6, 3)],
    xs: [item(clock, 0, 0, 4, 3), item(pomodoro, 0, 3, 4, 2), item(github, 0, 5, 4, 3)],
    xxs: [item(clock, 0, 0, 2, 3), item(pomodoro, 0, 3, 2, 2), item(github, 0, 5, 2, 3)],
  }
}

export function defaultConfig(): DashboardConfig {
  return {
    version: 1,
    theme: { accent: DEFAULT_THEME_ACCENT },
    layout: defaultLayout(),
    widgets: SEEDED_WIDGETS.map(
      (w): WidgetInstance => ({ id: w.id, type: w.type, settings: {} }),
    ),
  }
}
