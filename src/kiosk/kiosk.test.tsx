import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen, act } from '@testing-library/react'
import {
  __resetStatusStore,
  reportGitHubState,
  reportWidgetFailure,
  reportWidgetRecovered,
  useStatusStore,
} from './statusStore.ts'
import { SingleWidgetView } from './SingleWidgetView.tsx'
import { StatusFooter } from './StatusFooter.tsx'
import { registerWidget } from '../widgets/registry.tsx'
import type { WidgetInstance } from '../config/types.ts'

function Probe() {
  const status = useStatusStore()
  return (
    <span data-testid="probe">
      {status.widgetFailures}:{status.githubStale ? 's' : '-'}:{status.githubRateLimited ? 'r' : '-'}
    </span>
  )
}

afterEach(() => cleanup())

beforeEach(() => {
  act(() => __resetStatusStore())
})

describe('statusStore (KIOSK-04)', () => {
  it('aggregates widget failures and GitHub stale/rate-limited flags', () => {
    render(<Probe />)
    expect(screen.getByTestId('probe').textContent).toBe('0:-:-')

    act(() => reportWidgetFailure())
    act(() => reportWidgetFailure())
    expect(screen.getByTestId('probe').textContent).toBe('2:-:-')

    act(() => reportWidgetRecovered())
    expect(screen.getByTestId('probe').textContent).toBe('1:-:-')

    act(() => reportGitHubState(true, true))
    expect(screen.getByTestId('probe').textContent).toBe('1:s:r')

    act(() => reportGitHubState(false, false))
    expect(screen.getByTestId('probe').textContent).toBe('1:-:-')
  })
})

describe('SingleWidgetView (GRID-05)', () => {
  // Register a minimal renderable widget for the view.
  registerWidget('test-widget', {
    name: 'Test',
    description: 't',
    defaultSettings: {},
    settingsFields: [],
    render: ({ widget }) => <div data-testid={`body-${widget.id}`}>{widget.id}</div>,
  })

  const widgets: WidgetInstance[] = [
    { id: 'a', type: 'test-widget', settings: {} },
    { id: 'b', type: 'test-widget', settings: {} },
    { id: 'c', type: 'test-widget', settings: {} },
  ]

  it('renders the first widget full-screen with dots and arrows', () => {
    render(<SingleWidgetView widgets={widgets} theme={{ accent: '#22D3EE' }} />)
    expect(screen.getByTestId('body-a')).toBeInTheDocument()
    expect(screen.getAllByRole('button').length).toBeGreaterThanOrEqual(2) // arrows
  })

  it('arrows cycle through widgets and wrap around', () => {
    render(<SingleWidgetView widgets={widgets} theme={{ accent: '#22D3EE' }} />)
    act(() => fireEvent.click(screen.getByLabelText('Next widget')))
    expect(screen.getByTestId('body-b')).toBeInTheDocument()
    act(() => fireEvent.click(screen.getByLabelText('Next widget')))
    expect(screen.getByTestId('body-c')).toBeInTheDocument()
    act(() => fireEvent.click(screen.getByLabelText('Next widget')))
    expect(screen.getByTestId('body-a')).toBeInTheDocument()
    act(() => fireEvent.click(screen.getByLabelText('Previous widget')))
    expect(screen.getByTestId('body-c')).toBeInTheDocument()
  })

  it('renders nothing when there are no widgets', () => {
    const { container } = render(<SingleWidgetView widgets={[]} theme={{ accent: '#22D3EE' }} />)
    expect(container.firstChild).toBeNull()
  })
})

describe('StatusFooter (KIOSK-04)', () => {
  it('shows failure / stale / unavailable chips per state', () => {
    render(<StatusFooter />)
    expect(screen.queryByTestId('chip-failures')).not.toBeInTheDocument()
    expect(screen.queryByTestId('chip-github')).not.toBeInTheDocument()

    act(() => reportWidgetFailure())
    act(() => reportGitHubState(true, false))
    expect(screen.getByTestId('chip-failures').textContent).toContain('1 widget failed to load')
    expect(screen.getByTestId('chip-github').textContent).toContain('GitHub data stale')
  })
})
