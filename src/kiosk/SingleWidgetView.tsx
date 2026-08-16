import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { renderWidget } from '../widgets/registry.tsx'
import type { WidgetInstance } from '../config/types.ts'
import styles from './SingleWidgetView.module.css'

interface SingleWidgetViewProps {
  widgets: WidgetInstance[]
  theme: { accent: string }
}

/**
 * Single full-screen widget view on narrow screens (GRID-05, D-5.05/5.06):
 * full-bleed body, arrow buttons + dots cycle through widgets, read-only.
 */
export function SingleWidgetView({ widgets, theme }: SingleWidgetViewProps) {
  const [index, setIndex] = useState(0)

  if (widgets.length === 0) {
    return null
  }

  const safeIndex = index % widgets.length
  const widget = widgets[safeIndex]

  return (
    <div className={styles.root} data-single-widget-view>
      <div className={styles.body}>{renderWidget(widget, theme, false)}</div>
      {widgets.length > 1 && (
        <>
          <button
            type="button"
            className={styles.arrow}
            style={{ left: 0 }}
            aria-label="Previous widget"
            onClick={() => setIndex((i) => (i - 1 + widgets.length) % widgets.length)}
          >
            <ChevronLeft size={24} />
          </button>
          <button
            type="button"
            className={styles.arrow}
            style={{ right: 0 }}
            aria-label="Next widget"
            onClick={() => setIndex((i) => (i + 1) % widgets.length)}
          >
            <ChevronRight size={24} />
          </button>
          <div className={styles.dots}>
            {widgets.map((w, i) => (
              <button
                type="button"
                key={w.id}
                className={styles.dot}
                data-active={i === safeIndex}
                aria-label={`Widget ${i + 1}`}
                onClick={() => setIndex(i)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
