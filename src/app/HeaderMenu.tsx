import { Download, Settings, Upload } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import styles from './HeaderMenu.module.css'

interface HeaderMenuProps {
  onExport: () => void
  onImportClick: () => void
}

/** Header overflow menu: Export/Import behind one gear icon. Edit stays a
 *  standalone always-visible button — it's the primary, frequent action. */
export function HeaderMenu({ onExport, onImportClick }: HeaderMenuProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) {
      return
    }
    const onDocMouseDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocMouseDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onDocMouseDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const runAndClose = (fn: () => void) => () => {
    fn()
    setOpen(false)
  }

  return (
    <div className={styles.root} ref={rootRef}>
      <button
        type="button"
        className={styles.trigger}
        data-active={open}
        title="Settings"
        aria-label="Settings menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <Settings size={16} />
      </button>
      {open && (
        <div className={styles.menu} data-header-menu>
          <button type="button" className={styles.item} onClick={runAndClose(onExport)}>
            <Download size={16} />
            Export
          </button>
          <button type="button" className={styles.item} onClick={runAndClose(onImportClick)}>
            <Upload size={16} />
            Import
          </button>
        </div>
      )}
    </div>
  )
}
