import { DEFAULT_THEME_ACCENT } from '../config/defaultConfig.ts'

export interface WidgetTheme {
  accent: string
}

/** Theme bridge (D-3.06): stored accent flows to widgets via --widget-accent. */
export function widgetAccent(theme: WidgetTheme): string {
  return theme.accent ?? DEFAULT_THEME_ACCENT
}
