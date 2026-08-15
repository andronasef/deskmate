import type { DashboardConfig } from './types.ts'

export const DEFAULT_THEME_ACCENT = '#22D3EE'

export function defaultConfig(): DashboardConfig {
  return {
    version: 1,
    theme: { accent: DEFAULT_THEME_ACCENT },
    layout: {},
    widgets: [
      { id: crypto.randomUUID(), type: 'clock', settings: {} },
      { id: crypto.randomUUID(), type: 'github-pulse', settings: {} },
      { id: crypto.randomUUID(), type: 'pomodoro', settings: {} },
    ],
  }
}
