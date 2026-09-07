import { beforeEach, describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { DashboardGrid } from './DashboardGrid.tsx'
import { registerWidget } from '../widgets/registry.tsx'
import { useConfigStore } from '../config/store.ts'

beforeEach(() => {
  registerWidget('test-widget', {
    name: 'Test',
    description: 'test',
    defaultSettings: {},
    settingsFields: [],
    render: () => <div data-testid="test-widget-body" />,
  })
  localStorage.clear()
  useConfigStore.getState().reset()
  useConfigStore.setState({ hasHydrated: true })
  useConfigStore.getState().importConfig({
    version: 1,
    theme: { accent: '#ff8c1a' },
    widgets: [{ id: 'w1', type: 'test-widget', settings: {} }],
    layout: { lg: [{ i: 'w1', x: 0, y: 0, w: 4, h: 2 }] },
  })
})

describe('DashboardGrid resize/drag chrome (GRID-01/03)', () => {
  // Regression: RGL clones its direct grid-item child and injects the resize-handle
  // spans + drag listeners via that child's `children`/`onMouseDown` etc. props.
  // GridItemBody used to build its own subtree and never render `props.children`,
  // which silently dropped the resize handles — the grid looked draggable but had
  // no way to resize a widget. See RGL quick-start: "Grid children must forward
  // refs and certain props: style, className, onMouseDown, onMouseUp, onTouchEnd, children".
  it('renders a resize handle for each widget in edit mode', () => {
    const { container } = render(<DashboardGrid editMode={true} />)
    expect(container.querySelectorAll('.react-resizable-handle').length).toBeGreaterThan(0)
  })

  it('marks the grid item non-resizable (react-resizable-hide) when not in edit mode', () => {
    const { container } = render(<DashboardGrid editMode={false} />)
    expect(container.querySelector('.react-resizable-hide')).not.toBeNull()
  })
})
