import type { DashboardConfig, LayoutItem, LayoutMap, WidgetInstance } from './types.ts'

export const DEFAULT_THEME_ACCENT = '#22D3EE'

export const GRID_BREAKPOINTS: Record<string, number> = {
  lg: 1200,
  md: 996,
  sm: 768,
  xs: 480,
  xxs: 0,
}

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
  const [clock, pomodoro, github] = SEEDED_WIDGETS.map((w) => w.id)
  return {
    // lg (12 cols): clock 4×4, pomodoro 4×2, github 4×4
    lg: [item(clock, 0, 0, 4, 4), item(pomodoro, 4, 0, 4, 2), item(github, 8, 0, 4, 4)],
    // md (10 cols): same sizes
    md: [item(clock, 0, 0, 4, 4), item(pomodoro, 4, 0, 4, 2), item(github, 8, 0, 4, 4)],
    // sm (6 cols): full-width stacked
    sm: [item(clock, 0, 0, 6, 4), item(pomodoro, 0, 4, 6, 2), item(github, 0, 6, 6, 4)],
    // xs (4 cols): full-width stacked
    xs: [item(clock, 0, 0, 4, 4), item(pomodoro, 0, 4, 4, 2), item(github, 0, 6, 4, 4)],
    // xxs (2 cols): full-width stacked
    xxs: [item(clock, 0, 0, 2, 4), item(pomodoro, 0, 4, 2, 2), item(github, 0, 6, 2, 4)],
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
