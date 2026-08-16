import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import '../widgets/index.tsx' // register native widgets (D-3.01)
import PresentView from './PresentView.tsx'
import { defaultConfig } from '../config/defaultConfig.ts'
import { useConfigStore } from '../config/store.ts'

describe('PresentView (CAST-01/02)', () => {
  it('renders the requested widget full-bleed without app chrome', async () => {
    useConfigStore.setState({ config: defaultConfig() })
    render(<PresentView search="?present=w-clock-1" />)
    expect(await screen.findByTestId('clock-time')).toBeInTheDocument()
    expect(document.querySelector('header')).not.toBeInTheDocument()
    expect(document.querySelector('[data-present-view]')).toBeInTheDocument()
  })

  it('shows an error when the widget id is unknown', () => {
    useConfigStore.setState({ config: defaultConfig() })
    render(<PresentView search="?present=missing" />)
    expect(screen.getByText('Widget not found')).toBeInTheDocument()
    expect(document.querySelector('[data-present-error]')).toBeInTheDocument()
  })
})
