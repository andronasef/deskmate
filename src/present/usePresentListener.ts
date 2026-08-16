import { useEffect } from 'react'
import { useConfigStore } from '../config/store.ts'
import type { DashboardConfig } from '../config/types.ts'
import type { PresentMessage } from './presentChannel.ts'

const STORAGE_KEY = 'deskmate-present-broadcast'

/** Listen for present broadcasts in a popup window and apply them to the store. */
export function usePresentListener(): void {
  const importConfig = useConfigStore((s) => s.importConfig)
  const updateWidget = useConfigStore((s) => s.updateWidget)

  useEffect(() => {
    function apply(msg: PresentMessage) {
      if (msg.type === 'config-import' && msg.config != null) {
        importConfig(msg.config as DashboardConfig)
      } else if (msg.type === 'widget-update' && msg.widgetId != null && msg.payload != null) {
        updateWidget(msg.widgetId, msg.payload)
      }
    }

    let ch: BroadcastChannel | null = null
    if (typeof BroadcastChannel !== 'undefined') {
      ch = new BroadcastChannel('deskmate-present')
      ch.onmessage = (event: MessageEvent<PresentMessage>) => {
        apply(event.data)
      }
    }

    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY || e.newValue == null) {
        return
      }
      try {
        const msg = JSON.parse(e.newValue) as PresentMessage
        apply(msg)
      } catch {
        // ignore malformed storage payload
      }
    }
    window.addEventListener('storage', onStorage)

    return () => {
      if (ch != null) {
        ch.onmessage = null
        ch.close()
      }
      window.removeEventListener('storage', onStorage)
    }
  }, [importConfig, updateWidget])
}
