import { Cast, ChevronLeft, ChevronRight, Maximize, Settings, Trash2, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { renderWidget, WIDGET_REGISTRY } from '../widgets/registry.tsx'
import { SettingsPopover } from '../grid/SettingsPopover.tsx'
import { widgetName } from '../grid/widgetMeta.ts'
import { useConfigStore } from '../config/store.ts'
import type { WidgetInstance } from '../config/types.ts'
import styles from './SingleWidgetView.module.css'

interface SingleWidgetViewProps {
  widgets: WidgetInstance[]
  theme: { accent: string }
  /** Custom widgets edit their code in the BYOW drawer, not the field popover. */
  onEditCustom?: (id: string) => void
}

/**
 * Single full-screen widget view on narrow screens (GRID-05, D-5.05/5.06):
 * one widget at a time, arrows + dots to cycle, and per-widget actions
 * (zoom, settings, present) since there is no hover chrome on touch.
 */
export function SingleWidgetView({ widgets, theme, onEditCustom }: SingleWidgetViewProps) {
  const [index, setIndex] = useState(0)
  const [settingsOpen, setSettingsOpen] = useState(false)
  // "Full" zooms just this widget to fill the screen — chrome-free — not the
  // browser Fullscreen API (that's the separate kiosk toggle in the header).
  const [zoomed, setZoomed] = useState(false)
  const updateWidget = useConfigStore((s) => s.updateWidget)
  const removeWidget = useConfigStore((s) => s.removeWidget)

  useEffect(() => {
    if (!zoomed) {
      return
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setZoomed(false)
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [zoomed])

  if (widgets.length === 0) {
    return null
  }

  const safeIndex = index % widgets.length
  const widget = widgets[safeIndex]
  const definition = WIDGET_REGISTRY[widget.type]

  const go = (delta: number) => {
    setSettingsOpen(false)
    setIndex((i) => (i + delta + widgets.length) % widgets.length)
  }

  const openSettings = () => {
    if (widget.type === 'custom') {
      onEditCustom?.(widget.id)
      return
    }
    setSettingsOpen(true)
  }

  const present = () => {
    const url = new URL(window.location.href)
    url.search = new URLSearchParams({ present: widget.id }).toString()
    window.open(url.toString(), `deskmate-present-${widget.id}`, 'popup,width=800,height=600')
  }

  if (zoomed) {
    return createPortal(
      <div className={`panel ${styles.zoomOverlay}`} data-widget-type={widget.type} data-widget-zoomed>
        <div className={styles.body}>{renderWidget(widget, theme, false)}</div>
        <button
          type="button"
          className={styles.zoomExit}
          onClick={() => setZoomed(false)}
          aria-label="Exit full screen"
        >
          <X size={20} />
        </button>
      </div>,
      document.body,
    )
  }

  return (
    <div className={styles.root} data-single-widget-view>
      <div className={`panel ${styles.stage}`} data-widget-type={widget.type}>
        <div className={styles.body}>{renderWidget(widget, theme, false)}</div>
        {widgets.length > 1 && (
          <>
            <button
              type="button"
              className={styles.arrow}
              style={{ left: 0 }}
              aria-label="Previous widget"
              onClick={() => go(-1)}
            >
              <ChevronLeft size={24} />
            </button>
            <button
              type="button"
              className={styles.arrow}
              style={{ right: 0 }}
              aria-label="Next widget"
              onClick={() => go(1)}
            >
              <ChevronRight size={24} />
            </button>
          </>
        )}
      </div>

      <div className={styles.label} data-widget-label>
        {widgetName(widget)}
      </div>

      {widgets.length > 1 && (
        <div className={styles.dots}>
          {widgets.map((w, i) => (
            <button
              type="button"
              key={w.id}
              className={styles.dot}
              data-active={i === safeIndex}
              aria-label={`Widget ${i + 1}`}
              aria-current={i === safeIndex}
              onClick={() => {
                setSettingsOpen(false)
                setIndex(i)
              }}
            />
          ))}
        </div>
      )}

      <div className={styles.actions}>
        <button type="button" className={styles.action} onClick={() => setZoomed(true)} data-widget-zoom>
          <Maximize size={16} />
          Full
        </button>
        {definition != null && (
          <button type="button" className={styles.action} onClick={openSettings} data-mobile-settings>
            <Settings size={16} />
            Edit
          </button>
        )}
        <button type="button" className={styles.action} onClick={present} data-mobile-present>
          <Cast size={16} />
          Cast
        </button>
        <button
          type="button"
          className={styles.action}
          onClick={() => removeWidget(widget.id)}
          aria-label={`Remove ${widgetName(widget)}`}
          data-mobile-remove
        >
          <Trash2 size={16} />
          Delete
        </button>
      </div>

      {settingsOpen && definition != null && (
        <SettingsPopover
          widget={widget}
          definition={definition}
          anchor={null}
          onSave={(id, settings) => {
            updateWidget(id, settings)
            setSettingsOpen(false)
          }}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </div>
  )
}
