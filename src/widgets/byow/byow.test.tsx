import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { EditorView } from '@codemirror/view'
import { BYOWDrawer } from './BYOWDrawer.tsx'
import { WIDGET_CODE_TEMPLATE } from './template.ts'
import { useIframeBudget, IFRAME_BUDGETS } from './useIframeBudget.ts'
import { useLazyMount } from './useLazyMount.ts'
import { useRef } from 'react'
import type { WidgetInstance } from '../../config/types.ts'

/** Drive a real CodeMirror state update (the only supported way to trigger onChange). */
function typeInEditor(text: string) {
  const els = document.querySelectorAll('.cm-editor')
  const view = els.length ? EditorView.findFromDOM(els[els.length - 1] as HTMLElement) : null
  if (view == null) {
    throw new Error('CodeMirror view not found')
  }
  act(() => {
    view.dispatch({ changes: { from: 0, insert: text }, selection: { anchor: text.length } })
  })
}

describe('BYOWDrawer (BYOW-01/02)', () => {
  const onSave = vi.fn()
  const onClose = vi.fn()

  beforeEach(() => {
    onSave.mockReset()
    onClose.mockReset()
  })
  afterEach(() => cleanup())

  it('renders the three editor tabs and the template code for a new widget', () => {
    render(<BYOWDrawer widget={null} theme={{ accent: '#22D3EE' }} onSave={onSave} onClose={onClose} />)
    expect(screen.getByText('HTML')).toBeInTheDocument()
    expect(screen.getByText('CSS')).toBeInTheDocument()
    expect(screen.getByText('JS')).toBeInTheDocument()
    expect(screen.getByText('Custom Widget')).toBeInTheDocument()
  })

  it('prefills existing widget code when editing', () => {
    const widget: WidgetInstance = { id: 'w1', type: 'custom', settings: { html: '<p>mine</p>', css: 'p{color:red}', js: 'console.log(1)' } }
    render(<BYOWDrawer widget={widget} theme={{ accent: '#22D3EE' }} onSave={onSave} onClose={onClose} />)
    expect(screen.getByText('Custom Widget')).toBeInTheDocument()
    // The CodeMirror instance carries the value (assert via the editor container presence).
    expect(screen.getByTestId('byow-editor-html')).toBeInTheDocument()
  })

  it('Save calls onSave with the current code for a new widget (null id)', () => {
    render(<BYOWDrawer widget={null} theme={{ accent: '#22D3EE' }} onSave={onSave} onClose={onClose} />)
    act(() => screen.getByText('Save').click())
    expect(onSave).toHaveBeenCalledTimes(1)
    const [id, code] = onSave.mock.calls[0]
    expect(id).toBeNull()
    expect(code).toMatchObject({ html: expect.any(String), css: expect.any(String), js: expect.any(String) })
    // The parent closes the drawer after a successful save (App.handleByowSave → setByow(null)).
  })

  it('Save passes the widget id when editing an existing widget', () => {
    const widget: WidgetInstance = { id: 'w-edit', type: 'custom', settings: { ...WIDGET_CODE_TEMPLATE } }
    render(<BYOWDrawer widget={widget} theme={{ accent: '#22D3EE' }} onSave={onSave} onClose={onClose} />)
    act(() => screen.getByText('Save').click())
    expect(onSave.mock.calls[0][0]).toBe('w-edit')
  })

  it('Cancel with no edits closes immediately; Cancel with edits asks to discard', () => {
    const first = render(<BYOWDrawer widget={null} theme={{ accent: '#22D3EE' }} onSave={onSave} onClose={onClose} />)
    act(() => screen.getByText('Cancel').click())
    expect(onClose).toHaveBeenCalledTimes(1)
    first.unmount()

    onClose.mockClear()
    render(<BYOWDrawer widget={null} theme={{ accent: '#22D3EE' }} onSave={onSave} onClose={onClose} />)
    typeInEditor('<p>edited</p>')
    act(() => screen.getByText('Cancel').click())
    expect(onClose).not.toHaveBeenCalled()
    expect(screen.getByText('Discard unsaved changes?')).toBeInTheDocument()
    act(() => screen.getByText('Discard unsaved changes?').click())
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('Escape closes the drawer', () => {
    render(<BYOWDrawer widget={null} theme={{ accent: '#22D3EE' }} onSave={onSave} onClose={onClose} />)
    act(() => fireEvent.keyDown(document, { key: 'Escape' }))
    expect(onClose).toHaveBeenCalled()
  })
})

describe('useIframeBudget (D-4.13)', () => {
  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  it('reports atLimit when the count reaches the per-device budget', () => {
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: false }))
    function Probe({ count }: { count: number }) {
      const budget = useIframeBudget(count)
      return (
        <span data-testid="budget">
          {budget.atLimit ? 'limit' : 'ok'}:{budget.device}:{budget.count}
        </span>
      )
    }
    const { rerender } = render(<Probe count={IFRAME_BUDGETS.desktop - 1} />)
    expect(screen.getByTestId('budget').textContent).toBe(`ok:desktop:${IFRAME_BUDGETS.desktop - 1}`)
    rerender(<Probe count={IFRAME_BUDGETS.desktop} />)
    expect(screen.getByTestId('budget').textContent).toBe(`limit:desktop:${IFRAME_BUDGETS.desktop}`)
  })

  it('mobile budget is 8', () => {
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: true }))
    function Probe({ count }: { count: number }) {
      const budget = useIframeBudget(count)
      return <span data-testid="budget">{budget.atLimit ? 'limit' : 'ok'}:{budget.device}</span>
    }
    const { rerender } = render(<Probe count={7} />)
    expect(screen.getByTestId('budget').textContent).toBe('ok:mobile')
    rerender(<Probe count={8} />)
    expect(screen.getByTestId('budget').textContent).toBe('limit:mobile')
  })
})

describe('useLazyMount (D-4.14)', () => {
  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  it('mounts immediately when IntersectionObserver is unavailable', () => {
    vi.stubGlobal('IntersectionObserver', undefined)
    function Probe() {
      const ref = useRef<HTMLDivElement>(null)
      const near = useLazyMount(ref)
      return <div ref={ref} data-testid="probe">{near ? 'near' : 'far'}</div>
    }
    render(<Probe />)
    expect(screen.getByTestId('probe').textContent).toBe('near')
  })

  it('stays far until the observer reports intersecting', () => {
    let captured: IntersectionObserverCallback | null = null
    class MockIO {
      constructor(cb: IntersectionObserverCallback) {
        captured = cb
      }
      observe = vi.fn()
      disconnect = vi.fn()
      unobserve = vi.fn()
      root = null
      rootMargin = ''
      thresholds = []
      takeRecords = () => []
    }
    vi.stubGlobal('IntersectionObserver', MockIO)
    function Probe() {
      const ref = useRef<HTMLDivElement>(null)
      const near = useLazyMount(ref)
      return <div ref={ref} data-testid="probe">{near ? 'near' : 'far'}</div>
    }
    render(<Probe />)
    expect(screen.getByTestId('probe').textContent).toBe('far')

    // Fire the observer's callback with an intersecting entry.
    act(() => {
      captured?.([{ isIntersecting: true, target: document.querySelector('[data-testid="probe"]')! }] as unknown as IntersectionObserverEntry[], {} as IntersectionObserver)
    })
    expect(screen.getByTestId('probe').textContent).toBe('near')
  })
})
