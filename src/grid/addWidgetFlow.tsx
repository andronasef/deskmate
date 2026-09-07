import { Clock4, Code2, GitBranch, Plus, Timer, X, type LucideIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useConfigStore } from '../config/store.ts'
import { showToast } from '../components/toastStore.ts'
import { WIDGET_REGISTRY } from '../widgets/registry.tsx'
import { useIframeBudget, IFRAME_BUDGETS } from '../widgets/byow/useIframeBudget.ts'
import styles from './AddWidget.module.css'

interface AddWidgetButtonProps {
  /** Custom-widget entry routes to the BYOW drawer instead of addWidget. */
  onAddCustom?: () => void
}

// ponytail: registry has no icon field (would ripple through every widget definition
// for a purely cosmetic gallery need) — a small local lookup covers it instead.
const CATALOG_ICONS: Record<string, LucideIcon> = {
  clock: Clock4,
  pomodoro: Timer,
  'github-pulse': GitBranch,
  custom: Code2,
}

/** "Add Widget" header button + catalog gallery modal (D-2.03, UI-SPEC). */
export function AddWidgetButton({ onAddCustom }: AddWidgetButtonProps) {
  const addWidget = useConfigStore((s) => s.addWidget)
  const config = useConfigStore((s) => s.config)
  const widgetCount = config.widgets.length
  const customCount = config.widgets.filter((w) => w.type === 'custom').length
  const budget = useIframeBudget(customCount)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) {
      return
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
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
    <div className={styles.root}>
      <button
        type="button"
        className={styles.button}
        onClick={() => setOpen(true)}
        disabled={atCap}
        title={atCap ? 'Widget limit reached (50)' : 'Add Widget'}
      >
        <Plus size={16} />
        Add Widget
      </button>
      {open &&
        createPortal(
          <div
            className={styles.backdrop}
            onClick={() => setOpen(false)}
            data-add-widget-gallery
            role="presentation"
          >
            <div
              className={styles.gallery}
              role="dialog"
              aria-modal="true"
              aria-label="Add a widget"
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.galleryHeader}>
                <span className={styles.galleryTitle}>Add Widget</span>
                <button
                  type="button"
                  className={styles.galleryClose}
                  onClick={() => setOpen(false)}
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>
              <div className={styles.grid} role="menu">
                {Object.entries(WIDGET_REGISTRY).map(([type, definition]) => {
                  const budgetBlocked = type === 'custom' && budget.atLimit
                  const Icon = CATALOG_ICONS[type] ?? Code2
                  return (
                    <button
                      type="button"
                      key={type}
                      className={styles.card}
                      role="menuitem"
                      disabled={budgetBlocked}
                      title={
                        budgetBlocked
                          ? `Widget limit reached (${IFRAME_BUDGETS[budget.device]} on this device).`
                          : undefined
                      }
                      onClick={() => handlePick(type)}
                    >
                      <Icon className={styles.cardIcon} size={22} />
                      <span className={styles.cardName}>{definition.name}</span>
                      <span className={styles.cardDesc}>{definition.description}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  )
}
