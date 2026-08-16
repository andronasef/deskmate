import type { WidgetInstance } from '../config/types.ts'

export interface WidgetMeta {
  name: string
  description: string
}

/** Registry of known native widget types (rendering arrives Phase 3; chrome uses names now). */
export const WIDGET_META: Record<string, WidgetMeta> = {
  clock: { name: 'Clock', description: 'Time and date display' },
  'github-pulse': { name: 'GitHub Pulse', description: 'Stars, issues, and commit activity' },
  pomodoro: { name: 'Pomodoro', description: 'Focus timer with audio chime' },
}

export function widgetName(widget: WidgetInstance): string {
  return WIDGET_META[widget.type]?.name ?? widget.type
}
