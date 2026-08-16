import { useEffect, useRef, useState } from 'react'
import type { WidgetInstance } from '../config/types.ts'
import type { SettingsField, WidgetDefinition } from '../widgets/registry.tsx'
import styles from './SettingsPopover.module.css'

interface SettingsPopoverProps {
  widget: WidgetInstance
  definition: WidgetDefinition
  onSave: (id: string, settings: Record<string, unknown>) => void
  onClose: () => void
}

/** Generic per-widget settings popover (D-3.03): fields from the registry definition. */
export function SettingsPopover({ widget, definition, onSave, onClose }: SettingsPopoverProps) {
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

  return (
    <div className={styles.popover} ref={rootRef} data-settings-popover onClick={(e) => e.stopPropagation()}>
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
    </div>
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
