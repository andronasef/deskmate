import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, render, screen } from '@testing-library/react'
import { PomodoroWidget } from './pomodoro.tsx'
import type { WidgetInstance } from '../config/types.ts'

function makeWidget(settings: Record<string, unknown>): WidgetInstance {
  return { id: 'w1', type: 'pomodoro', settings }
}

class MockAudioContext {
  currentTime = 0
  destination = {}
  createOscillator() {
    return {
      type: '',
      frequency: { value: 0 },
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    }
  }
  createGain() {
    return {
      gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
      connect: vi.fn(),
    }
  }
  close() {
    return Promise.resolve()
  }
}

const advance = (ms: number) => act(() => vi.advanceTimersByTime(ms))

describe('PomodoroWidget (WID-02)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.stubGlobal('AudioContext', MockAudioContext)
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
    cleanup()
  })

  it('renders MM:SS from settings.minutes (25 → 25:00)', () => {
    render(<PomodoroWidget widget={makeWidget({ minutes: 25 })} />)
    expect(screen.getByTestId('pomodoro-countdown').textContent).toBe('25:00')
  })

  it('Start begins the countdown; advancing 25s shows 24:35', () => {
    render(<PomodoroWidget widget={makeWidget({ minutes: 25 })} />)
    act(() => screen.getByLabelText('Start').click())
    advance(25_000)
    expect(screen.getByTestId('pomodoro-countdown').textContent).toBe('24:35')
  })

  it('Pause stops the countdown', () => {
    render(<PomodoroWidget widget={makeWidget({ minutes: 25 })} />)
    act(() => screen.getByLabelText('Start').click())
    advance(10_000)
    act(() => screen.getByLabelText('Pause').click())
    const paused = screen.getByTestId('pomodoro-countdown').textContent
    advance(30_000)
    expect(screen.getByTestId('pomodoro-countdown').textContent).toBe(paused)
  })

  it('Reset restores the full duration', () => {
    render(<PomodoroWidget widget={makeWidget({ minutes: 25 })} />)
    act(() => screen.getByLabelText('Start').click())
    advance(60_000)
    act(() => screen.getByLabelText('Reset').click())
    expect(screen.getByTestId('pomodoro-countdown').textContent).toBe('25:00')
  })

  it('reaching 0:00 shows "Time is up" and fires the chime (gesture-unlocked)', () => {
    const startSpy = vi.spyOn(MockAudioContext.prototype, 'createOscillator')
    render(<PomodoroWidget widget={makeWidget({ minutes: 1 })} />)
    act(() => screen.getByLabelText('Start').click()) // gesture unlock
    advance(60_000)
    expect(screen.getByTestId('pomodoro-countdown').textContent).toBe('00:00')
    expect(screen.getByText("Time's up!")).toBeInTheDocument()
    expect(startSpy).toHaveBeenCalled()
  })

  it('cleans up the interval on unmount (no zombie timers)', () => {
    const { unmount } = render(<PomodoroWidget widget={makeWidget({ minutes: 25 })} />)
    act(() => screen.getByLabelText('Start').click())
    unmount()
    expect(() => advance(60_000)).not.toThrow()
  })

  it('clamps minutes to 1-120', () => {
    render(<PomodoroWidget widget={makeWidget({ minutes: 500 })} />)
    expect(screen.getByTestId('pomodoro-countdown').textContent).toBe('120:00')
  })
})
