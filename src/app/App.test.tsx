import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App.tsx'

// Note: App hydrates the persist store async; the default (empty) localStorage
// yields the seeded default config, so the grid renders the 3 seeded widgets.

describe('App shell', () => {
  it('renders the DeskMate wordmark in the header', async () => {
    render(<App />)
    expect(screen.getByText('DeskMate')).toBeInTheDocument()
    await waitFor(() => expect(screen.getByText('Clock')).toBeInTheDocument())
  })

  it('renders the seeded widgets in the grid (default first-run dashboard)', async () => {
    render(<App />)
    await waitFor(() => expect(screen.getByText('Clock')).toBeInTheDocument())
    expect(screen.getByText('GitHub Pulse')).toBeInTheDocument()
    expect(screen.getByText('Pomodoro')).toBeInTheDocument()
  })

  it('renders the transport toolbar (Export / Import / Edit)', async () => {
    render(<App />)
    expect(screen.getByTitle('Export config')).toBeInTheDocument()
    expect(screen.getByTitle('Import config')).toBeInTheDocument()
    expect(screen.getByText('Edit')).toBeInTheDocument()
  })

  it('reveals Add Widget and widget chrome only in edit mode', async () => {
    render(<App />)
    await waitFor(() => expect(screen.getByText('Clock')).toBeInTheDocument())
    expect(screen.queryByText('Add Widget')).not.toBeInTheDocument()

    screen.getByText('Edit').click()
    await waitFor(() => expect(screen.getByText('Add Widget')).toBeInTheDocument())
    expect(screen.getAllByTitle('Remove widget')).toHaveLength(3)
    expect(screen.getByText('Done')).toBeInTheDocument()
  })
})
