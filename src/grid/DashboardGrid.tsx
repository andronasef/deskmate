import { Responsive, useContainerWidth, type Layout, type ResponsiveLayouts } from 'react-grid-layout'
import { useEffect, useRef } from 'react'
import { useConfigStore } from '../config/store.ts'
import { GRID_BREAKPOINTS, GRID_COLS } from '../config/defaultConfig.ts'
import { WidgetFrame } from './WidgetFrame.tsx'
import { widgetName } from './widgetMeta.ts'
import type { DashboardConfig, LayoutMap } from '../config/types.ts'
import styles from './DashboardGrid.module.css'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'

interface DashboardGridProps {
  editMode: boolean
  /** Shared-view override (CFG-04): when set, renders this config read-only instead of the store's. */
  configOverride?: DashboardConfig | null
}

/**
 * Responsive multi-widget grid (GRID-01…04, GRID-06) bound to the config store.
 * RGL v2 hooks: useContainerWidth (mounted-gated, D-2.08) + Responsive.
 * Drag/resize enabled only in edit mode (D-2.01/D-2.02).
 */
export function DashboardGrid({ editMode, configOverride }: DashboardGridProps) {
  const storeConfig = useConfigStore((s) => s.config)
  const setLayout = useConfigStore((s) => s.setLayout)
  const removeWidget = useConfigStore((s) => s.removeWidget)
  const { width, containerRef, mounted } = useContainerWidth()

  const config = configOverride ?? storeConfig
  // In shared view the grid is read-only (the banner owns save/exit, D-2.11).
  const interactive = editMode && configOverride == null

  // Guard the onLayoutChange feedback loop: RGL fires it programmatically on
  // mount/breakpoint change; only persist layouts that differ from what we last rendered.
  // (Ref is updated in an effect — never during render.)
  const lastLayoutsRef = useRef<string>(JSON.stringify(config.layout))

  const widgets = config.widgets
  const layouts = config.layout

  useEffect(() => {
    lastLayoutsRef.current = JSON.stringify(config.layout)
  }, [config.layout])

  const handleLayoutChange = (_layout: Layout, newLayouts: ResponsiveLayouts) => {
    const serialized = JSON.stringify(newLayouts)
    if (serialized === lastLayoutsRef.current) {
      return
    }
    // RGL layouts are readonly arrays; convert to our mutable LayoutMap contract.
    const mutable: LayoutMap = {}
    for (const [bp, items] of Object.entries(newLayouts)) {
      if (items != null) {
        mutable[bp] = [...items]
      }
    }
    setLayout(mutable)
  }

  return (
    <div ref={containerRef} className={styles.container} data-edit-mode={interactive}>
      {mounted && (
        <Responsive
          width={width}
          layouts={layouts}
          breakpoints={GRID_BREAKPOINTS}
          cols={GRID_COLS}
          rowHeight={80}
          margin={[16, 16]}
          dragConfig={{ enabled: interactive }}
          resizeConfig={{ enabled: interactive }}
          onLayoutChange={handleLayoutChange}
          className={styles.grid}
        >
          {widgets.map((widget) => (
            <div key={widget.id}>
              <WidgetFrame widget={widget} editMode={interactive} onRemove={removeWidget}>
                <div className={styles.placeholderBody}>
                  <span className={styles.placeholderTitle}>{widgetName(widget)}</span>
                  <span className={styles.placeholderHint}>Widget rendering arrives in Phase 3</span>
                </div>
              </WidgetFrame>
            </div>
          ))}
        </Responsive>
      )}
      {mounted && widgets.length === 0 && (
        <div className={styles.empty} data-empty-grid>
          {interactive ? (
            <>
              <p className={styles.emptyTitle}>Your dashboard is empty</p>
              <p className={styles.emptyHint}>Add a widget to get started.</p>
            </>
          ) : (
            <p className={styles.emptyHint}>No widgets on this dashboard.</p>
          )}
        </div>
      )}
    </div>
  )
}
