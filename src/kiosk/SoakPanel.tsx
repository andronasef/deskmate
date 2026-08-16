import { useEffect } from 'react'
import { getWakeLockState } from './wakeLock.ts'
import { notifySoakListeners, runSoakSample, useSoakSample } from './soak.ts'
import styles from './SoakPanel.module.css'

/**
 * Kiosk diagnostics panel (D-5.15): frame-time, heap, wake-lock, visibility.
 * Samples on a 1 s interval while mounted.
 */
export function SoakPanel() {
  const sample = useSoakSample()

  useEffect(() => {
    const timer = setInterval(() => {
      runSoakSample(getWakeLockState)
      notifySoakListeners()
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className={styles.panel} data-soak-panel>
      <div className={styles.title}>Kiosk diagnostics</div>
      <dl className={styles.rows}>
        <div className={styles.row}>
          <dt>Frame rate</dt>
          <dd>{sample.fps > 0 ? `${sample.fps} fps` : '—'}</dd>
        </div>
        <div className={styles.row}>
          <dt>Heap</dt>
          <dd>{sample.heapMB > 0 ? `${sample.heapMB} MB` : '—'}</dd>
        </div>
        <div className={styles.row}>
          <dt>Wake lock</dt>
          <dd>{sample.wakeLock}</dd>
        </div>
        <div className={styles.row}>
          <dt>Visibility</dt>
          <dd>{sample.visibility}</dd>
        </div>
      </dl>
    </div>
  )
}
