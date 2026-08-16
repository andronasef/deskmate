import { Settings, Trash2 } from 'lucide-react'
import type { ReactNode } from 'react'
import { widgetName } from './widgetMeta.ts'
import { widgetAccent, type WidgetTheme } from '../widgets/theme.ts'
import type { WidgetInstance } from '../config/types.ts'
import styles from './WidgetFrame.module.css'

interface WidgetFrameProps {
  widget: WidgetInstance
  theme: WidgetTheme
  editMode: boolean
  onRemove: (id: string) => void
  onSettings?: (widget: WidgetInstance) => void
  children: ReactNode
}

/**
 * Widget chrome wrapper (D-2.04/D-3.06): renders the widget body plus edit-mode-only
 * controls (remove, settings) and binds --widget-accent from the stored theme.
 */
export function WidgetFrame({ widget, theme, editMode, onRemove, onSettings, children }: WidgetFrameProps) {
  return (
    <div
      className={styles.frame}
      data-widget-type={widget.type}
      style={{ '--widget-accent': widgetAccent(theme) } as React.CSSProperties}
    >
      <div className={styles.body}>{children}</div>
      {editMode && (
        <>
          {onSettings != null && (
            <button
              type="button"
              className={styles.settings}
              title="Settings"
              aria-label={`Settings for ${widgetName(widget)}`}
              onClick={() => onSettings(widget)}
            >
              <Settings size={16} />
            </button>
          )}
          <button
            type="button"
            className={styles.remove}
            title="Remove widget"
            aria-label={`Remove ${widgetName(widget)}`}
            onClick={() => onRemove(widget.id)}
          >
            <Trash2 size={16} />
          </button>
        </>
      )}
    </div>
  )
}
