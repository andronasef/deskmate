import { Plus } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useConfigStore } from '../config/store.ts'
import { showToast } from '../components/toastStore.ts'
import { WIDGET_REGISTRY } from '../widgets/registry.tsx'
import { useIframeBudget, IFRAME_BUDGETS } from '../widgets/byow/useIframeBudget.ts'
import styles from './AddWidget.module.css'

interface AddWidgetButtonProps {
  /** Custom-widget entry routes to the BYOW drawer instead of addWidget. */
  onAddCustom?: () => void
}

/** "Add Widget" header button + catalog popover (D-2.03, UI-SPEC). */
export function AddWidgetButton({ onAddCustom }: AddWidgetButtonProps) {
  const addWidget = useConfigStore((s) => s.addWidget)
  const config = useConfigStore((s) => s.config)
  const widgetCount = config.widgets.length
  const customCount = config.widgets.filter((w) => w.type === 'custom').length
  const budget = useIframeBudget(customCount)
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
    if (type === 'custom') {
      if (budget.atLimit) {
        showToast('info', `Widget limit reached (${IFRAME_BUDGETS[budget.device]} on this device).`)
        return
      }
      setOpen(false)
      onAddCustom?.()
      return
    }
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
          {Object.entries(WIDGET_REGISTRY).map(([type, definition]) => {
            const budgetBlocked = type === 'custom' && budget.atLimit
            return (
              <button
                type="button"
                key={type}
                className={styles.row}
                role="menuitem"
                disabled={budgetBlocked}
                title={
                  budgetBlocked
                    ? `Widget limit reached (${IFRAME_BUDGETS[budget.device]} on this device).`
                    : undefined
                }
                onClick={() => handlePick(type)}
              >
                <span className={styles.rowName}>{definition.name}</span>
                <span className={styles.rowDesc}>{definition.description}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
