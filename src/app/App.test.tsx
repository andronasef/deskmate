import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App.tsx'

describe('App shell', () => {
  it('renders the DeskMate wordmark in the header', () => {
    render(<App />)
    expect(screen.getByText('DeskMate')).toBeInTheDocument()
  })

  it('renders the placeholder heading', () => {
    render(<App />)
    expect(screen.getByText('Your dashboard is ready')).toBeInTheDocument()
  })

  it('renders the placeholder body copy', () => {
    render(<App />)
    expect(
      screen.getByText('Widgets will render here — grid editing arrives in the next update.'),
    ).toBeInTheDocument()
  })

  it('exposes no interactive elements (zero actions in Phase 1)', () => {
    render(<App />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})
