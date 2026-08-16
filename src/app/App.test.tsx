import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App.tsx'

// App hydrates the persist store async; default (empty) localStorage yields the seeded
// default config → the grid renders the 3 seeded widgets with real registry bodies.

describe('App shell', () => {
  it('renders the DeskMate wordmark in the header', async () => {
    render(<App />)
    expect(screen.getByText('DeskMate')).toBeInTheDocument()
    await waitFor(() => expect(screen.getByTestId('clock-time')).toBeInTheDocument())
  })

  it('renders the seeded widget bodies in the grid (clock ticks, pomodoro controls)', async () => {
    render(<App />)
    await waitFor(() => expect(screen.getByTestId('clock-time')).toBeInTheDocument())
    expect(screen.getByTestId('clock-date')).toBeInTheDocument()
    expect(screen.getByTestId('pomodoro-countdown')).toBeInTheDocument()
    expect(screen.getByLabelText('Start')).toBeInTheDocument()
  })

  it('positions widget cells via RGL — wrappers receive the react-grid-item class and inline style', async () => {
    // Regression: GridItemBody must forward RGL's cloned className/style onto the DOM.
    // If a custom child component drops those props, items render unpositioned full-width
    // stacked (the bug jsdom can't catch via layout — only via the missing class).
    render(<App />)
    await waitFor(() => expect(screen.getByTestId('clock-time')).toBeInTheDocument())
    const items = document.querySelectorAll('.react-grid-layout > .react-grid-item')
    expect(items.length).toBe(3)
    items.forEach((el) => {
      expect(el.getAttribute('style')).toMatch(/transform|top|width/)
    })
  })

  it('renders the transport toolbar (Export / Import / Edit)', async () => {
    render(<App />)
    expect(screen.getByTitle('Export config')).toBeInTheDocument()
    expect(screen.getByTitle('Import config')).toBeInTheDocument()
    expect(screen.getByText('Edit')).toBeInTheDocument()
  })

  it('reveals Add Widget and widget chrome only in edit mode', async () => {
    render(<App />)
    await waitFor(() => expect(screen.getByTestId('clock-time')).toBeInTheDocument())
    expect(screen.queryByText('Add Widget')).not.toBeInTheDocument()

    screen.getByText('Edit').click()
    await waitFor(() => expect(screen.getByText('Add Widget')).toBeInTheDocument())
    expect(screen.getAllByTitle('Remove widget')).toHaveLength(3)
    expect(screen.getAllByLabelText(/Settings for/)).toHaveLength(3)
    expect(screen.getByText('Done')).toBeInTheDocument()
  })
})
