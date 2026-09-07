import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { WidgetInstance } from '../config/types.ts'
import type { SettingsField, WidgetDefinition } from '../widgets/registry.tsx'
import styles from './SettingsPopover.module.css'

interface SettingsPopoverProps {
  widget: WidgetInstance
  definition: WidgetDefinition
  onSave: (id: string, settings: Record<string, unknown>) => void
  onClose: () => void
  /** Rect of the widget cell; the popover is portaled to <body> (outside the LED mask) and pinned to it. */
  anchor: DOMRect | null
}

/** Generic per-widget settings popover (D-3.03): fields from the registry definition. */
export function SettingsPopover({ widget, definition, onSave, onClose, anchor }: SettingsPopoverProps) {
  const [values, setValues] = useState<Record<string, unknown>>(() => ({
    ...definition.defaultSettings,
    ...widget.settings,
  }))
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onDocMouseDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) {
        onClose()
      }
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    document.addEventListener('mousedown', onDocMouseDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onDocMouseDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [onClose])

  // Flip above the anchor when opening downward would run past the viewport.
  const [top, setTop] = useState<number | null>(null)
  useLayoutEffect(() => {
    if (anchor == null) {
      return
    }
    const h = rootRef.current?.offsetHeight ?? 0
    const below = anchor.bottom + 6
    setTop(below + h + 8 > window.innerHeight ? Math.max(8, anchor.top - h - 6) : below)
  }, [anchor])

  const setValue = (key: string, value: unknown) => setValues((v) => ({ ...v, [key]: value }))

  const handleSave = () => {
    const merged: Record<string, unknown> = {}
    for (const field of definition.settingsFields) {
      const raw = values[field.key]
      if (field.type === 'number') {
        const n = Number(raw)
        const min = field.min ?? Number.NEGATIVE_INFINITY
        const max = field.max ?? Number.POSITIVE_INFINITY
        merged[field.key] = Number.isFinite(n) ? Math.min(max, Math.max(min, Math.round(n))) : field.min ?? 0
      } else {
        merged[field.key] = raw
      }
    }
    onSave(widget.id, merged)
    onClose()
  }

  return createPortal(
    <div
      className={styles.popover}
      ref={rootRef}
      data-settings-popover
      onClick={(e) => e.stopPropagation()}
      style={
        anchor != null
          ? {
              top: top ?? anchor.bottom + 6,
              left: Math.max(8, Math.min(anchor.right - 260, window.innerWidth - 268)),
              // Avoid a first-paint flash at the pre-measurement position.
              visibility: top == null ? 'hidden' : undefined,
            }
          : // No anchor (mobile single-widget view): center it.
            { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }
      }
    >
      <div className={styles.title}>Settings</div>
      <div className={styles.fields}>
        {definition.settingsFields.map((field) => (
          <Field key={field.key} field={field} value={values[field.key]} onChange={(v) => setValue(field.key, v)} />
        ))}
      </div>
      <div className={styles.actions}>
        <button type="button" className={styles.cancel} onClick={onClose} data-settings-cancel>
          Cancel
        </button>
        <button type="button" className={styles.save} onClick={handleSave} data-settings-save>
          Save
        </button>
      </div>
    </div>,
    document.body,
  )
}

function Field({
  field,
  value,
  onChange,
}: {
  field: SettingsField
  value: unknown
  onChange: (v: unknown) => void
}) {
  return (
    <label className={styles.field}>
      <span className={styles.fieldLabel}>{field.label}</span>
      {field.type === 'toggle' && (
        <input type="checkbox" checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)} />
      )}
      {field.type === 'number' && (
        <input
          type="number"
          min={field.min}
          max={field.max}
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.valueAsNumber)}
        />
      )}
      {field.type === 'text' && (
        <input
          type="text"
          value={String(value ?? '')}
          placeholder={field.placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
      {field.type === 'select' && (
        <select value={String(value ?? '')} onChange={(e) => onChange(e.target.value)}>
          {(field.options ?? []).map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      )}
    </label>
  )
}
