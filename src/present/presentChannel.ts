export interface PresentMessage {
  type: 'widget-update' | 'config-import'
  widgetId?: string
  payload?: Record<string, unknown>
  config?: unknown
}

const CHANNEL_NAME = 'deskmate-present'
const STORAGE_KEY = 'deskmate-present-broadcast'

function makeChannel(): BroadcastChannel | null {
  if (typeof BroadcastChannel !== 'undefined') {
    try {
      return new BroadcastChannel(CHANNEL_NAME)
    } catch {
      return null
    }
  }
  return null
}

/** Broadcast a present message to other DeskMate windows/tabs. */
export function broadcastPresent(msg: PresentMessage): void {
  const ch = makeChannel()
  if (ch != null) {
    ch.postMessage(msg)
    ch.close()
  } else {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...msg, ts: Date.now() }))
  }
}
