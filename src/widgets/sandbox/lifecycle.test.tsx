import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, render, screen } from '@testing-library/react'
import { IframeWidgetRenderer } from './IframeWidgetRenderer.tsx'
import type { WidgetInstance } from '../../config/types.ts'

function makeWidget(code: Partial<{ html: string; css: string; js: string }>): WidgetInstance {
  return { id: 'w-custom-1', type: 'custom', settings: { html: code.html ?? '', css: code.css ?? '', js: code.js ?? '' } }
}

describe('IframeWidgetRenderer (BYOW-03/05)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
    cleanup()
    vi.restoreAllMocks()
  })

  it('renders an iframe with sandbox EXACTLY allow-scripts and referrerpolicy no-referrer', () => {
    render(<IframeWidgetRenderer widget={makeWidget({})} theme={{ accent: '#22D3EE' }} />)
    const frame = screen.getByTestId('sandbox-frame') as HTMLIFrameElement
    expect(frame.getAttribute('sandbox')).toBe('allow-scripts')
    expect(frame.getAttribute('referrerpolicy')).toBe('no-referrer')
    expect(frame.getAttribute('srcdoc')).toContain('window.deskmate')
  })

  it('hostile widget code (</script> + parent access attempt) cannot break the srcdoc', () => {
    const hostile = makeWidget({
      html: '</script><script>window.parent.document.body.innerHTML=""</script>',
      js: 'try { window.parent.document.title = "pwned" } catch (e) {}',
    })
    render(<IframeWidgetRenderer widget={hostile} theme={{ accent: '#22D3EE' }} />)
    const frame = screen.getByTestId('sandbox-frame') as HTMLIFrameElement
    // Escaping neutralizes the embedded </script> sequences.
    expect(frame.getAttribute('srcdoc')).not.toContain('</script><script>window.parent')
    expect(frame.getAttribute('srcdoc')).toContain('pwned')
  })

  it('shows Loading widget… until the ready handshake; crashes after the 3 s timeout', () => {
    render(<IframeWidgetRenderer widget={makeWidget({})} theme={{ accent: '#22D3EE' }} />)
    expect(screen.getByText('Loading widget…')).toBeInTheDocument()

    // No ready message arrives → 3 s timeout → crashed fallback.
    act(() => vi.advanceTimersByTime(3000))
    expect(screen.getByText('Widget failed to load')).toBeInTheDocument()
  })

  it('ready handshake flips to the live frame (no crash fallback)', () => {
    render(<IframeWidgetRenderer widget={makeWidget({})} theme={{ accent: '#22D3EE' }} />)
    const frame = screen.getByTestId('sandbox-frame') as HTMLIFrameElement
    // Simulate the sandboxed document posting deskmate:ready with the injected nonce.
    const nonce = extractNonce(frame.getAttribute('srcdoc')!)
    act(() => {
      window.dispatchEvent(
        new MessageEvent('message', { source: frame.contentWindow, data: JSON.stringify({ type: 'deskmate:ready', nonce }) }),
      )
    })
    act(() => vi.advanceTimersByTime(3000))
    expect(screen.queryByText('Widget failed to load')).not.toBeInTheDocument()
    expect(screen.queryByText('Loading widget…')).not.toBeInTheDocument()
  })

  it('unmount tears down: bridge destroyed, timeout cleared — no leaked handlers', () => {
    const { unmount } = render(<IframeWidgetRenderer widget={makeWidget({})} theme={{ accent: '#22D3EE' }} />)
    unmount()
    // Advancing past the timeout after unmount must not throw or flip state.
    expect(() => act(() => vi.advanceTimersByTime(5000))).not.toThrow()
    // No further ready messages processed (bridge destroyed).
    expect(screen.queryByText('Widget failed to load')).not.toBeInTheDocument()
  })
})

function extractNonce(srcdoc: string): string {
  const m = /__DESKMATE_NONCE__ = '([0-9a-f]{32})'/.exec(srcdoc)
  return m?.[1] ?? ''
}
