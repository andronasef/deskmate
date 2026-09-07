import { beforeEach, describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { clampToGrid, DashboardGrid } from './DashboardGrid.tsx'
import { registerWidget } from '../widgets/registry.tsx'
import { useConfigStore } from '../config/store.ts'
import { GRID_ROWS } from '../config/defaultConfig.ts'

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

describe('clampToGrid (maxRows escape hatch)', () => {
  // Regression: maxRows caps where an item can be dropped/resized TO, but a drag
  // that bumps a second item out of the way can still push that second item past
  // the cap during collision resolution — RGL doesn't re-clamp the whole layout
  // afterward. An item left at y >= GRID_ROWS renders clipped below the fold:
  // invisible and un-draggable. Reproduced live via a real mouse-drag simulation
  // (dragging one widget onto another cascaded a third to y=8 in an 8-row grid).
  it('pulls an item pushed past GRID_ROWS back inside bounds, preserving its size when it fits', () => {
    const pushed = { i: 'w1', x: 0, y: GRID_ROWS, w: 4, h: 4 }
    const [clamped] = clampToGrid([pushed], 12)
    expect(clamped.y + clamped.h).toBeLessThanOrEqual(GRID_ROWS)
    expect(clamped.h).toBe(4)
  })

  it('shrinks an item taller than the whole grid rather than leaving it out of bounds', () => {
    const [clamped] = clampToGrid([{ i: 'w1', x: 0, y: 0, w: 4, h: GRID_ROWS + 5 }], 12)
    expect(clamped.h).toBe(GRID_ROWS)
    expect(clamped.y).toBe(0)
  })

  it('leaves an in-bounds item untouched (same object reference — no needless re-render)', () => {
    const inBounds = { i: 'w1', x: 0, y: 0, w: 4, h: 4 }
    const [clamped] = clampToGrid([inBounds], 12)
    expect(clamped).toBe(inBounds)
  })
})
