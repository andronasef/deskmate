import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, render, screen } from '@testing-library/react'
import { ClockWidget } from './clock.tsx'
import type { WidgetInstance } from '../config/types.ts'

function makeWidget(settings: Record<string, unknown>): WidgetInstance {
  return { id: 'w1', type: 'clock', settings }
}

function renderClock(settings: Record<string, unknown> = {}) {
  return render(<ClockWidget widget={makeWidget(settings)} theme={{ accent: '#22D3EE' }} />)
}

const tick = (ms: number) => act(() => vi.advanceTimersByTime(ms))

describe('ClockWidget (WID-01)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-16T12:34:56'))
  })
  afterEach(() => {
    vi.useRealTimers()
    cleanup()
  })

  it('renders the time and locale date', () => {
    renderClock({ hour12: true, showSeconds: false })
    expect(screen.getByTestId('clock-time')).toBeInTheDocument()
    expect(screen.getByTestId('clock-date').textContent).toContain('August')
  })

  it('shows seconds when enabled and hides them by default', () => {
    renderClock({ hour12: true, showSeconds: false })
    expect(screen.getByTestId('clock-time').textContent).not.toMatch(/:\d{2}:\d{2}$/)
  })

  it('ticks to the next second', () => {
    renderClock({ showSeconds: true, hour12: true })
    const first = screen.getByTestId('clock-time').textContent
    tick(1000)
    expect(screen.getByTestId('clock-time').textContent).not.toBe(first)
  })

  it('applies the fontSize scale (large → 56px)', () => {
    renderClock({ fontSize: 'large' })
    expect(screen.getByTestId('clock-time')).toHaveStyle({ fontSize: '56px' })
  })

  it('cleans up its interval on unmount', () => {
    const { unmount } = renderClock({ showSeconds: true })
    unmount()
    expect(() => tick(5000)).not.toThrow()
  })
})
