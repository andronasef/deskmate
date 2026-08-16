import { Download, Upload, X } from 'lucide-react'
import { useCallback, useRef, useState } from 'react'
import '../widgets/index.tsx' // registers native widgets into WIDGET_REGISTRY (D-3.01)
import styles from './App.module.css'
import bannerStyles from './SharedConfigBanner.module.css'
import { useConfigStore } from '../config/store.ts'
import { DashboardGrid } from '../grid/DashboardGrid.tsx'
import { useEditMode } from '../grid/useEditMode.ts'
import { AddWidgetButton } from '../grid/addWidgetFlow.tsx'
import { BYOWDrawer } from '../widgets/byow/BYOWDrawer.tsx'
import type { WidgetCode } from '../widgets/byow/template.ts'
import { exportConfig, importConfigFromFile } from '../config/transports.ts'
import { showToast } from '../components/toastStore.ts'
import { ToastHost } from '../components/ToastHost.tsx'
import { decodeConfigFromUrl } from '../config/urlCodec.ts'
import { backupRaw, safeGet, STORAGE_KEY } from '../config/storage.ts'
import type { DashboardConfig } from '../config/types.ts'

export type ByowTarget = { mode: 'create' } | { mode: 'edit'; id: string } | null

export default function App() {
  const config = useConfigStore((s) => s.config)
  const importConfig = useConfigStore((s) => s.importConfig)
  const addWidget = useConfigStore((s) => s.addWidget)
  const updateWidget = useConfigStore((s) => s.updateWidget)
  const { editMode, toggle } = useEditMode()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [byow, setByow] = useState<ByowTarget>(null)
  // Boot: decode ?config= once (CFG-04). Stored config untouched until the user saves (D-2.11).
  const [sharedConfig, setSharedConfig] = useState<DashboardConfig | null>(
    () => decodeConfigFromUrl(window.location.search),
  )

  const handleSaveShared = useCallback(() => {
    if (sharedConfig == null) {
      return
    }
    const currentRaw = safeGet(STORAGE_KEY)
    if (currentRaw != null) {
      backupRaw(currentRaw)
    }
    importConfig(sharedConfig)
    setSharedConfig(null)
    showToast('success', 'Shared dashboard saved to your device.')
  }, [sharedConfig, importConfig])

  const handleExitShared = useCallback(() => {
    setSharedConfig(null)
  }, [])

  const handleExport = useCallback(() => {
    exportConfig(config)
  }, [config])

  const handleImportFile = useCallback(
    async (file: File) => {
      const result = await importConfigFromFile(file)
      if (result.ok) {
        showToast('success', 'Dashboard imported.')
      } else {
        showToast('error', `Import failed: ${result.reason} — your current dashboard was not changed.`)
      }
    },
    [],
  )

  const handleByowSave = useCallback(
    (id: string | null, code: WidgetCode) => {
      if (id == null) {
        // Create: add a custom widget then write the code.
        const newId = addWidget('custom')
        if (newId.length > 0) {
          updateWidget(newId, { ...code })
          showToast('success', 'Custom widget added.')
        }
      } else {
        updateWidget(id, { ...code })
        showToast('success', 'Custom widget saved.')
      }
      setByow(null)
    },
    [addWidget, updateWidget],
  )

  return (
    <>
      <header className={styles.header}>
        <span className={styles.wordmark}>DeskMate</span>
        <div className={styles.toolbar}>
          <button type="button" className={styles.toolButton} title="Export config" onClick={handleExport}>
            <Download size={16} />
            Export
          </button>
          <button
            type="button"
            className={styles.toolButton}
            title="Import config"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload size={16} />
            Import
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            hidden
            data-testid="import-file-input"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) {
                void handleImportFile(file)
              }
              e.target.value = ''
            }}
          />
          {editMode && sharedConfig == null && <AddWidgetButton onAddCustom={() => setByow({ mode: 'create' })} />}
          <button
            type="button"
            className={styles.editToggle}
            data-active={editMode}
            onClick={toggle}
            disabled={sharedConfig != null}
            data-edit-toggle
          >
            {editMode ? 'Done' : 'Edit'}
          </button>
        </div>
      </header>
      <main className={styles.main}>
        {sharedConfig != null && (
          <div className={bannerStyles.wrap}>
            <div className={bannerStyles.banner} data-shared-banner>
              <div className={bannerStyles.text}>
                <span className={bannerStyles.title}>Viewing a shared dashboard</span>
                <span className={bannerStyles.hint}>Save it to your dashboard or exit to keep yours.</span>
              </div>
              <div className={bannerStyles.actions}>
                <button type="button" className={bannerStyles.save} onClick={handleSaveShared} data-save-shared>
                  Save to my dashboard
                </button>
                <button type="button" className={bannerStyles.exit} onClick={handleExitShared} data-exit-shared>
                  <X size={16} />
                  Exit
                </button>
              </div>
            </div>
          </div>
        )}
        <DashboardGrid editMode={editMode} configOverride={sharedConfig} onEditCustom={(id) => setByow({ mode: 'edit', id })} />
      </main>
      {byow != null && sharedConfig == null && (
        <BYOWDrawer
          widget={byow.mode === 'edit' ? (config.widgets.find((w) => w.id === byow.id) ?? null) : null}
          theme={{ accent: config.theme.accent }}
          onSave={handleByowSave}
          onClose={() => setByow(null)}
        />
      )}
      <ToastHost />
    </>
  )
}
