import { WIDGET_REGISTRY } from '../widgets/registry.tsx'
import type { WidgetInstance } from '../config/types.ts'

/** Registry is the single source of widget names (D-3.01); this module keeps the old import surface. */
export function widgetName(widget: WidgetInstance): string {
  return WIDGET_REGISTRY[widget.type]?.name ?? widget.type
}
