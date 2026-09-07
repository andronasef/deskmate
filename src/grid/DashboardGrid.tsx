import { Responsive, useContainerWidth, type Layout, type ResponsiveLayouts } from 'react-grid-layout'
import { forwardRef, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useConfigStore } from '../config/store.ts'
import { GRID_BREAKPOINTS, GRID_COLS } from '../config/defaultConfig.ts'
import { WidgetFrame } from './WidgetFrame.tsx'
import { SettingsPopover } from './SettingsPopover.tsx'
import { renderWidget, WIDGET_REGISTRY } from '../widgets/registry.tsx'
import { useLazyMount } from '../widgets/byow/useLazyMount.ts'
import type { DashboardConfig, LayoutItem, LayoutMap, WidgetInstance } from '../config/types.ts'
import styles from './DashboardGrid.module.css'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'

interface DashboardGridProps {
  editMode: boolean
  /** Shared-view override (CFG-04): when set, renders this config read-only instead of the store's. */
  configOverride?: DashboardConfig | null
  /** Custom widgets route their gear to the BYOW editor drawer. */
  onEditCustom?: (id: string) => void
}

const GRID_MARGIN = 8
const MIN_ROW_HEIGHT = 40
/** One screen = this many rows. Fixed, so `h` maps to a real fraction of the
 *  viewport (h=8 fills it, h=4 is half) and RESIZING ACTUALLY CHANGES HEIGHT.
 *  Deriving rowHeight from the layout's own row count instead would cancel every
 *  resize out — halving `h` would just double rowHeight and look identical. */
const ROWS_PER_VIEWPORT = 8

/**
 * Tracks the available content height for the grid (excluding the container's own
 * padding). Measures the container's PARENT, not the container itself — the
 * container's height grows with its own content (it isn't min-height: 0), so
 * measuring it directly would feed back into rowHeight: bigger rowHeight → taller
 * content → bigger measured height → bigger rowHeight again. The parent (`.main`)
 * is sized by the page shell independent of the grid's content, so it's stable.
 */
function useContainerHeight(containerRef: React.RefObject<HTMLDivElement | null>) {
  const [height, setHeight] = useState(0)
  useEffect(() => {
    const container = containerRef.current
    const parent = container?.parentElement
    if (container == null || parent == null) {
      return
    }
    const measure = () => {
      const cs = getComputedStyle(container)
      const paddingY = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom)
      setHeight(Math.max(0, parent.clientHeight - paddingY))
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(parent)
    return () => observer.disconnect()
  }, [containerRef])
  return height
}

/**
 * Responsive multi-widget grid (GRID-01…06) bound to the config store.
 * RGL v2 hooks: useContainerWidth (mounted-gated, D-2.08) + Responsive.
 * Widget bodies render via the registry (D-3.04); chrome gated to edit mode.
 */
export function DashboardGrid({ editMode, configOverride, onEditCustom }: DashboardGridProps) {
  const storeConfig = useConfigStore((s) => s.config)
  const setLayout = useConfigStore((s) => s.setLayout)
  const removeWidget = useConfigStore((s) => s.removeWidget)
  const updateWidget = useConfigStore((s) => s.updateWidget)
  const { width, containerRef, mounted } = useContainerWidth()
  const containerHeight = useContainerHeight(containerRef)
  const [openSettingsId, setOpenSettingsId] = useState<string | null>(null)

  const config = configOverride ?? storeConfig
  // In shared view the grid is read-only (the banner owns save/exit, D-2.11).
  const interactive = editMode && configOverride == null

  // Guard the onLayoutChange feedback loop: RGL fires it programmatically on
  // mount/breakpoint change; only persist layouts that differ from what we last rendered.
  const lastLayoutsRef = useRef<string>(JSON.stringify(config.layout))

  useEffect(() => {
    lastLayoutsRef.current = JSON.stringify(config.layout)
  }, [config.layout])

  const widgets = config.widgets
  const layouts = config.layout
  const theme = { accent: config.theme.accent }

  // Scale rows to the viewport (not to the layout) so a widget's `h` is a stable
  // fraction of the screen at any window size, and resizing still visibly changes it.
  const rowHeight =
    containerHeight > 0
      ? Math.max(
          MIN_ROW_HEIGHT,
          Math.floor((containerHeight - GRID_MARGIN * (ROWS_PER_VIEWPORT - 1)) / ROWS_PER_VIEWPORT),
        )
      : MIN_ROW_HEIGHT

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

  const handleSettingsSave = (id: string, settings: Record<string, unknown>) => {
    updateWidget(id, settings)
    setOpenSettingsId(null)
  }

  const openSettings = (widget: WidgetInstance) => {
    if (widget.type === 'custom') {
      // Code editing lives in the BYOW drawer, not the field popover.
      onEditCustom?.(widget.id)
      return
    }
    setOpenSettingsId(widget.id)
  }

  return (
    <div ref={containerRef} className={`matrix ${styles.container}`} data-edit-mode={interactive}>
      {mounted && (
        <Responsive
          width={width}
          layouts={layouts}
          breakpoints={GRID_BREAKPOINTS}
          cols={GRID_COLS}
          rowHeight={rowHeight}
          margin={[GRID_MARGIN, GRID_MARGIN]}
          containerPadding={[0, 0]}
          dragConfig={{ enabled: interactive }}
          resizeConfig={{ enabled: interactive, handles: ['se'] }}
          onLayoutChange={handleLayoutChange}
          className={styles.grid}
        >
          {widgets.map((widget) => (
            <GridItemBody
              key={widget.id}
              widget={widget}
              theme={theme}
              interactive={interactive}
              readOnly={configOverride != null}
              onRemove={removeWidget}
              openSettings={openSettings}
              onSettingsSave={handleSettingsSave}
              openSettingsId={openSettingsId}
              setOpenSettingsId={setOpenSettingsId}
            />
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

// Re-export for type consumers.
export type { LayoutItem, WidgetInstance }

interface GridItemBodyProps
  extends Pick<
    React.HTMLAttributes<HTMLDivElement>,
    'className' | 'style' | 'children' | 'onMouseDown' | 'onMouseUp' | 'onTouchEnd'
  > {
  widget: WidgetInstance
  theme: { accent: string }
  interactive: boolean
  readOnly: boolean
  onRemove: (id: string) => void
  openSettings: (widget: WidgetInstance) => void
  onSettingsSave: (id: string, settings: Record<string, unknown>) => void
  openSettingsId: string | null
  setOpenSettingsId: (id: string | null) => void
}

/** One grid cell: lazy-mounts custom-widget iframes until near-visible (D-4.14).
 *  RGL clones its direct child and requires it to forward ref/className/style/
 *  onMouseDown/onMouseUp/onTouchEnd AND render `children` — that's how the
 *  resize-handle spans and drag listeners reach the DOM (see RGL quick-start:
 *  "Grid children must forward refs and certain props ... children"). Dropping
 *  `children` silently ate the resize handles — no drag/resize handle rendered. */
const GridItemBody = forwardRef<HTMLDivElement, GridItemBodyProps>(function GridItemBody(props, rglRef) {
  const { widget, theme, interactive, readOnly, onRemove, openSettings, onSettingsSave, openSettingsId, setOpenSettingsId } =
    props
  const wrapRef = useRef<HTMLDivElement>(null)
  const near = useLazyMount(wrapRef)
  const isCustom = widget.type === 'custom'
  const definition = WIDGET_REGISTRY[widget.type]
  const isSettingsOpen = openSettingsId === widget.id
  const [anchor, setAnchor] = useState<DOMRect | null>(null)

  useLayoutEffect(() => {
    if (isSettingsOpen) {
      setAnchor(wrapRef.current?.getBoundingClientRect() ?? null)
    }
  }, [isSettingsOpen])

  return (
    <div
      ref={rglRef}
      className={props.className ? `${props.className} ${styles.itemWrap}` : styles.itemWrap}
      style={props.style}
      onMouseDown={props.onMouseDown}
      onMouseUp={props.onMouseUp}
      onTouchEnd={props.onTouchEnd}
    >
      <div ref={wrapRef} className={styles.itemInner}>
        <WidgetFrame
        widget={widget}
        theme={theme}
        editMode={interactive}
        onRemove={onRemove}
        onSettings={readOnly ? undefined : openSettings}
      >
        {isCustom && !near ? (
          <div className={styles.lazyPlaceholder} data-lazy-mount>
            <span>Custom widget</span>
          </div>
        ) : (
          renderWidget(widget, theme, interactive)
        )}
      </WidgetFrame>
      {isSettingsOpen && definition != null && (
        <SettingsPopover
          widget={widget}
          definition={definition}
          anchor={anchor}
          onSave={onSettingsSave}
          onClose={() => setOpenSettingsId(null)}
        />
      )}
      </div>
      {props.children}
    </div>
  )
})
