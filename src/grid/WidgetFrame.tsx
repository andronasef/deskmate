import { Trash2 } from 'lucide-react'
import type { ReactNode } from 'react'
import { widgetName } from './widgetMeta.ts'
import type { WidgetInstance } from '../config/types.ts'
import styles from './WidgetFrame.module.css'

interface WidgetFrameProps {
  widget: WidgetInstance
  editMode: boolean
  onRemove: (id: string) => void
  children: ReactNode
}

/**
 * Widget chrome wrapper (D-2.04): renders the widget body plus an edit-mode-only
 * remove button. Phase 3's registry renders real widget bodies into `children`.
 */
export function WidgetFrame({ widget, editMode, onRemove, children }: WidgetFrameProps) {
  return (
    <div className={styles.frame} data-widget-type={widget.type}>
      <div className={styles.body}>{children}</div>
      {editMode && (
        <button
          type="button"
          className={styles.remove}
          title="Remove widget"
          aria-label={`Remove ${widgetName(widget)}`}
          onClick={() => onRemove(widget.id)}
        >
          <Trash2 size={16} />
        </button>
      )}
    </div>
  )
}
