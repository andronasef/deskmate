import { useEffect, useMemo } from 'react'
import { useConfigStore } from '../config/store.ts'
import { renderWidget } from '../widgets/registry.tsx'
import { useKiosk } from '../kiosk/useKiosk.ts'
import { usePresentListener } from './usePresentListener.ts'
import styles from './PresentView.module.css'

/** Full-bleed widget view for casting to a secondary screen (CAST-01/02). */
export default function PresentView({ search = window.location.search }: { search?: string }) {
  const config = useConfigStore((s) => s.config)
  const { toggleFullscreen } = useKiosk()
  const params = useMemo(() => new URLSearchParams(search), [search])
  const widgetId = params.get('present')
  const widget = config.widgets.find((w) => w.id === widgetId)

  usePresentListener()

  // Auto-fullscreen the popup if the browser allows it from the window.open gesture.
  useEffect(() => {
    void toggleFullscreen().catch(() => {})
  }, [toggleFullscreen])

  if (widget == null) {
    return (
      <div className={styles.root} data-present-error>
        <span>Widget not found</span>
      </div>
    )
  }

  return (
    <div className={styles.root} data-present-view>
      {renderWidget(widget, { accent: config.theme.accent }, false)}
    </div>
  )
}
