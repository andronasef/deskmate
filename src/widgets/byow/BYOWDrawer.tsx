import { useEffect, useRef, useState } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { html } from '@codemirror/lang-html'
import { css } from '@codemirror/lang-css'
import { javascript } from '@codemirror/lang-javascript'
import { IframeWidgetRenderer } from '../sandbox/IframeWidgetRenderer.tsx'
import { WIDGET_CODE_TEMPLATE, type WidgetCode } from './template.ts'
import type { WidgetInstance } from '../../config/types.ts'
import type { WidgetTheme } from '../theme.ts'
import styles from './BYOWDrawer.module.css'

interface BYOWDrawerProps {
  widget: WidgetInstance | null // null = creating a new custom widget
  theme: WidgetTheme
  onSave: (id: string | null, code: WidgetCode) => void
  onClose: () => void
}

const TABS = [
  { key: 'html', label: 'HTML', lang: html() },
  { key: 'css', label: 'CSS', lang: css() },
  { key: 'js', label: 'JS', lang: javascript() },
] as const

/**
 * BYOW editor drawer (D-4.09…4.11): CodeMirror HTML/CSS/JS tabs, debounced live
 * sandboxed preview, Save/Cancel with unsaved-changes guard, Escape close.
 */
export function BYOWDrawer({ widget, theme, onSave, onClose }: BYOWDrawerProps) {
  const existing: WidgetCode = {
    html: typeof widget?.settings.html === 'string' ? widget.settings.html : '',
    css: typeof widget?.settings.css === 'string' ? widget.settings.css : '',
    js: typeof widget?.settings.js === 'string' ? widget.settings.js : '',
  }
  const [code, setCode] = useState<WidgetCode>(() =>
    widget == null
      ? { ...WIDGET_CODE_TEMPLATE }
      : existing,
  )
  const [tab, setTab] = useState<(typeof TABS)[number]['key']>('html')
  const [preview, setPreview] = useState<WidgetCode>(code)
  const [dirty, setDirty] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)

  const updateCode = (key: keyof WidgetCode, value: string) => {
    setCode((c) => ({ ...c, [key]: value }))
    setDirty(true)
    // Debounced live preview (~300 ms, D-4.10).
    if (debounceRef.current != null) {
      clearTimeout(debounceRef.current)
    }
    debounceRef.current = setTimeout(() => {
      setCode((c) => {
        setPreview(c)
        return c
      })
    }, 300)
  }

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (dirty && !confirming) {
          setConfirming(true)
        } else {
          onClose()
        }
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      if (debounceRef.current != null) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [dirty, confirming, onClose])

  const handleSave = () => {
    onSave(widget?.id ?? null, code)
  }

  const handleCancel = () => {
    if (dirty && !confirming) {
      setConfirming(true)
      return
    }
    onClose()
  }

  return (
    <div className={styles.backdrop} ref={rootRef} data-byow-drawer>
      <div className={styles.drawer}>
        <div className={styles.header}>
          <span className={styles.title}>Custom Widget</span>
          <div className={styles.actions}>
            <button type="button" className={styles.cancel} onClick={handleCancel} data-byow-cancel>
              {confirming ? 'Discard unsaved changes?' : 'Cancel'}
            </button>
            <button type="button" className={styles.save} onClick={handleSave} data-byow-save>
              Save
            </button>
          </div>
        </div>
        <div className={styles.tabs} role="tablist">
          {TABS.map((t) => (
            <button
              type="button"
              key={t.key}
              role="tab"
              aria-selected={tab === t.key}
              className={styles.tab}
              data-active={tab === t.key}
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </button>
          ))}
          <span className={styles.previewBadge}>Live preview</span>
        </div>
        <div className={styles.editor}>
          {TABS.map((t) =>
            tab === t.key ? (
              <CodeMirror
                key={t.key}
                value={code[t.key]}
                height="100%"
                extensions={[t.lang]}
                theme="dark"
                onChange={(value) => updateCode(t.key, value)}
                data-testid={`byow-editor-${t.key}`}
              />
            ) : null,
          )}
        </div>
        <div className={styles.preview}>
          <IframeWidgetRenderer
            widget={{ id: 'preview', type: 'custom', settings: { ...preview } }}
            theme={theme}
            previewCode={preview}
          />
        </div>
      </div>
    </div>
  )
}
