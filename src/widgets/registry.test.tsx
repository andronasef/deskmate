import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import './index.tsx' // populate the registry with native widgets
import { registerWidget, renderWidget, WIDGET_REGISTRY, defaultSettingsFor } from './registry.tsx'
import type { WidgetInstance } from '../config/types.ts'

function makeWidget(type: string, settings: Record<string, unknown> = {}): WidgetInstance {
  return { id: 'w1', type, settings }
}

describe('WIDGET_REGISTRY (D-3.01/3.02)', () => {
  it('maps all three native types to definitions with render + settings fields', () => {
    expect(Object.keys(WIDGET_REGISTRY).sort()).toEqual(['clock', 'custom', 'github-pulse', 'pomodoro'])
    for (const def of Object.values(WIDGET_REGISTRY)) {
      expect(typeof def.render).toBe('function')
      expect(def.name.length).toBeGreaterThan(0)
      expect(Array.isArray(def.settingsFields)).toBe(true)
    }
  })

  it('renderWidget dispatches to the registry render', () => {
    const clock = WIDGET_REGISTRY.clock
    const node = clock.render({ widget: makeWidget('clock'), theme: { accent: '#fff' }, editMode: false })
    expect(node).not.toBeNull()
  })

  it('renderWidget renders a graceful fallback for unknown types (D-3.04)', () => {
    const node = renderWidget(makeWidget('mystery-widget'), { accent: '#fff' }, false)
    expect(node).not.toBeNull()
  })

  it('registerWidget + defaultSettingsFor', () => {
    registerWidget('test-widget', {
      name: 'Test',
      description: 't',
      defaultSettings: { a: 1 },
      settingsFields: [],
      render: () => <div>hi</div>,
    })
    expect(defaultSettingsFor('test-widget')).toEqual({ a: 1 })
    expect(defaultSettingsFor('nope')).toEqual({})
    const node = renderWidget(makeWidget('test-widget'), { accent: '#fff' }, false)
    expect(node).not.toBeNull()
  })

  it('registered widgets render bodies (smoke)', () => {
    const { getByText } = render(WIDGET_REGISTRY.pomodoro.render({ widget: makeWidget('pomodoro', { minutes: 25 }), theme: { accent: '#22D3EE' }, editMode: false }))
    expect(getByText('25:00')).toBeInTheDocument()
  })

  it('unknown-widget fallback renders "Unknown widget type"', () => {
    const { getByText } = render(renderWidget(makeWidget('mystery'), { accent: '#fff' }, false))
    expect(getByText('Unknown widget type')).toBeInTheDocument()
  })
})
