import { BRIDGE_TYPES } from './constants.ts'
import type { DeskMateApiPayload } from './bootstrap.ts'

type MessageHandler = (event: MessageEvent) => void

/**
 * Source+nonce validated postMessage bridge (BYOW-04, 04-01-FINDINGS #2/#5).
 * Validation order: source identity → safe parse → nonce → act. targetOrigin '*' (opaque origin).
 */
export class SandboxBridge {
  private readonly iframe: HTMLIFrameElement
  private readonly nonce: string
  private readonly onApi: (api: DeskMateApiPayload) => void
  private handler: MessageHandler | null = null
  private destroyed = false

  constructor(iframe: HTMLIFrameElement, nonce: string, onApi: (api: DeskMateApiPayload) => void) {
    this.iframe = iframe
    this.nonce = nonce
    this.onApi = onApi
  }

  attach(): void {
    if (this.handler != null) {
      return
    }
    this.handler = (event: MessageEvent) => this.handle(event)
    window.addEventListener('message', this.handler)
  }

  destroy(): void {
    this.destroyed = true
    if (this.handler != null) {
      window.removeEventListener('message', this.handler)
      this.handler = null
    }
  }

  /** Push an API payload to the widget (targetOrigin '*' — opaque origin, FINDINGS #1). */
  push(api: DeskMateApiPayload): void {
    if (this.destroyed || this.iframe.contentWindow == null) {
      return
    }
    this.iframe.contentWindow.postMessage(
      JSON.stringify({ type: BRIDGE_TYPES.API, nonce: this.nonce, ...api }),
      '*',
    )
  }

  private handle(event: MessageEvent): void {
    if (this.destroyed) {
      return
    }
    // 1) Source identity FIRST — never trust origin strings (FINDINGS #2).
    if (event.source !== this.iframe.contentWindow) {
      return
    }
    // 2) Safe parse — malformed payloads are ignored, never thrown.
    let data: unknown
    try {
      data = JSON.parse(String(event.data))
    } catch {
      return
    }
    if (data == null || typeof data !== 'object') {
      return
    }
    const msg = data as Record<string, unknown>
    // 3) Nonce check — the per-widget secret (FINDINGS #4/#5).
    if (msg.nonce !== this.nonce) {
      return
    }
    // 4) Act.
    if (msg.type === BRIDGE_TYPES.READY || msg.type === BRIDGE_TYPES.UPDATE) {
      this.onApi({
        theme: { accent: typeof msg.themeAccent === 'string' ? msg.themeAccent : '' },
        size: { w: 0, h: 0 },
        config: null,
      })
    }
  }
}

export function createSandboxBridge(
  iframe: HTMLIFrameElement,
  nonce: string,
  onApi: (api: DeskMateApiPayload) => void,
): SandboxBridge {
  return new SandboxBridge(iframe, nonce, onApi)
}
