import { Plus } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useConfigStore } from '../config/store.ts'
import { WIDGET_META } from './widgetMeta.ts'
import styles from './AddWidget.module.css'

/** "Add Widget" header button + catalog popover (D-2.03, UI-SPEC). */
export function AddWidgetButton() {
  const addWidget = useConfigStore((s) => s.addWidget)
  const widgetCount = useConfigStore((s) => s.config.widgets.length)
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) {
      return
    }
    const onDocClick = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [open])

  const atCap = widgetCount >= 50

  const handlePick = (type: string) => {
    addWidget(type)
    setOpen(false)
  }

  return (
    <div className={styles.root} ref={rootRef}>
      <button
        type="button"
        className={styles.button}
        onClick={() => setOpen((v) => !v)}
        disabled={atCap}
        title={atCap ? 'Widget limit reached (50)' : 'Add Widget'}
      >
        <Plus size={16} />
        Add Widget
      </button>
      {open && (
        <div className={styles.popover} role="menu" data-add-widget-popover>
          {Object.entries(WIDGET_META).map(([type, meta]) => (
            <button
              type="button"
              key={type}
              className={styles.row}
              role="menuitem"
              onClick={() => handlePick(type)}
            >
              <span className={styles.rowName}>{meta.name}</span>
              <span className={styles.rowDesc}>{meta.description}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
