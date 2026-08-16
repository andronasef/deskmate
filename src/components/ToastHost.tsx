import { CheckCircle2, Info, XCircle } from 'lucide-react'
import { dismissToast, useToastItems } from './toastStore.ts'
import styles from './Toast.module.css'

/** Bottom-center toast stack (UI-SPEC). Mount once at app root. */
export function ToastHost() {
  const items = useToastItems()

  return (
    <div className={styles.host} role="region" aria-live="polite">
      {items.map((t) => (
        <button type="button" key={t.id} className={styles.toast} data-kind={t.kind} onClick={() => dismissToast(t.id)}>
          {t.kind === 'success' && <CheckCircle2 size={16} className={styles.icon} />}
          {t.kind === 'error' && <XCircle size={16} className={styles.icon} />}
          {t.kind === 'info' && <Info size={16} className={styles.icon} />}
          <span className={styles.message}>{t.message}</span>
        </button>
      ))}
    </div>
  )
}
