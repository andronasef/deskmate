import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createSandboxBridge } from './bridge.ts'
import { BRIDGE_TYPES } from './constants.ts'
import type { DeskMateApiPayload } from './bootstrap.ts'

function makeIframe(): HTMLIFrameElement {
  const iframe = document.createElement('iframe')
  const cw = { postMessage: vi.fn() } as unknown as Window
  Object.defineProperty(iframe, 'contentWindow', { value: cw, configurable: true })
  return iframe
}

function makeEvent(iframe: HTMLIFrameElement, data: unknown, source?: unknown): MessageEvent {
  return new MessageEvent('message', {
    data: typeof data === 'string' ? data : JSON.stringify(data),
    source: (source === undefined ? iframe.contentWindow : source) as Window | null,
  })
}

describe('SandboxBridge (BYOW-04)', () => {
  let iframe: HTMLIFrameElement
  let onApi: ReturnType<typeof vi.fn<(api: DeskMateApiPayload) => void>>

  beforeEach(() => {
    iframe = makeIframe()
    onApi = vi.fn()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('accepts a ready message with the correct source AND nonce', () => {
    const bridge = createSandboxBridge(iframe, 'secret', onApi)
    bridge.attach()
    window.dispatchEvent(makeEvent(iframe, { type: BRIDGE_TYPES.READY, nonce: 'secret' }))
    expect(onApi).toHaveBeenCalledTimes(1)
    bridge.destroy()
  })

  it('ignores a valid-nonce message from the WRONG source (spoofed)', () => {
    const bridge = createSandboxBridge(iframe, 'secret', onApi)
    bridge.attach()
    const otherWindow = {} as unknown as Window
    window.dispatchEvent(makeEvent(iframe, { type: BRIDGE_TYPES.READY, nonce: 'secret' }, otherWindow))
    expect(onApi).not.toHaveBeenCalled()
    bridge.destroy()
  })

  it('ignores a wrong-nonce message from the right source', () => {
    const bridge = createSandboxBridge(iframe, 'secret', onApi)
    bridge.attach()
    window.dispatchEvent(makeEvent(iframe, { type: BRIDGE_TYPES.READY, nonce: 'wrong' }))
    expect(onApi).not.toHaveBeenCalled()
    bridge.destroy()
  })

  it('ignores malformed payloads without throwing', () => {
    const bridge = createSandboxBridge(iframe, 'secret', onApi)
    bridge.attach()
    window.dispatchEvent(makeEvent(iframe, '{not json'))
    window.dispatchEvent(makeEvent(iframe, 42))
    window.dispatchEvent(makeEvent(iframe, null))
    expect(onApi).not.toHaveBeenCalled()
    bridge.destroy()
  })

  it('destroy() removes the listener — further messages are ignored', () => {
    const bridge = createSandboxBridge(iframe, 'secret', onApi)
    bridge.attach()
    bridge.destroy()
    window.dispatchEvent(makeEvent(iframe, { type: BRIDGE_TYPES.READY, nonce: 'secret' }))
    expect(onApi).not.toHaveBeenCalled()
  })

  it('push() posts the API payload to the iframe with targetOrigin *', () => {
    const bridge = createSandboxBridge(iframe, 'secret', onApi)
    bridge.attach()
    bridge.push({ theme: { accent: '#fff' }, size: { w: 10, h: 20 }, config: null })
    const [message, targetOrigin] = (iframe.contentWindow as unknown as { postMessage: ReturnType<typeof vi.fn> }).postMessage.mock.calls[0]
    expect(targetOrigin).toBe('*')
    expect(JSON.parse(message)).toMatchObject({ type: BRIDGE_TYPES.API, nonce: 'secret' })
    bridge.destroy()
  })
})
