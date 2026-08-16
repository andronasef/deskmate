import type { ReactNode } from 'react'
import type { WidgetInstance } from '../config/types.ts'
import type { WidgetTheme } from './theme.ts'

export interface WidgetRenderContext {
  widget: WidgetInstance
  theme: WidgetTheme
  editMode: boolean
}

export interface SettingsField {
  key: string
  label: string
  type: 'text' | 'number' | 'toggle' | 'select'
  options?: string[]
  placeholder?: string
  min?: number
  max?: number
}

export interface WidgetDefinition {
  name: string
  description: string
  defaultSettings: Record<string, unknown>
  settingsFields: SettingsField[]
  render: (ctx: WidgetRenderContext) => ReactNode
}

export const WIDGET_REGISTRY: Record<string, WidgetDefinition> = {}

/** Register a widget definition (native widgets call this at module load). */
export function registerWidget(type: string, definition: WidgetDefinition): void {
  WIDGET_REGISTRY[type] = definition
}

/** Render a widget body by type; unknown types render a graceful fallback (D-3.04). */
export function renderWidget(widget: WidgetInstance, theme: WidgetTheme, editMode: boolean): ReactNode {
  const definition = WIDGET_REGISTRY[widget.type]
  if (definition == null) {
    return (
      <div data-unknown-widget>
        <span>Unknown widget type</span>
      </div>
    )
  }
  return definition.render({ widget, theme, editMode })
}

export function defaultSettingsFor(type: string): Record<string, unknown> {
  return WIDGET_REGISTRY[type]?.defaultSettings ?? {}
}
