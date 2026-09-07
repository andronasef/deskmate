import { TriangleAlert } from 'lucide-react'
import { useStatusStore } from './statusStore.ts'
import { useWakeLockState } from './useKiosk.ts'
import styles from './StatusFooter.module.css'

/**
 * Slim status footer (KIOSK-04, D-5.09…5.12): widget failures, GitHub stale data,
 * wake-lock state — quiet kiosk health indicators.
 */
export function StatusFooter() {
  const status = useStatusStore()
  const wakeLock = useWakeLockState()

  return (
    <footer className={`matrix ${styles.footer}`} data-status-footer>
      {status.widgetFailures > 0 && (
        <span className={styles.chip} data-chip="failure" data-testid="chip-failures">
          <TriangleAlert size={12} />
          {status.widgetFailures} widget{status.widgetFailures > 1 ? 's' : ''} failed to load
        </span>
      )}
      {(status.githubStale || status.githubRateLimited) && (
        <span className={styles.chip} data-chip="stale" data-testid="chip-github">
          <TriangleAlert size={12} />
          GitHub data stale
        </span>
      )}
      {wakeLock === 'active' && (
        <span className={styles.chip} data-chip="awake" data-testid="chip-awake">
          Screen awake
        </span>
      )}
      {(wakeLock === 'unsupported' || wakeLock === 'error') && (
        <span className={styles.chip} data-chip="unavailable" data-testid="chip-unavailable">
          Screen awake unavailable
        </span>
      )}
    </footer>
  )
}
