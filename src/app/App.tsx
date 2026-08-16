import styles from './App.module.css'
import { useConfigStore } from '../config/store.ts'

export default function App() {
  useConfigStore((s) => s.config)

  return (
    <>
      <header className={styles.header}>
        <span className={styles.wordmark}>DeskMate</span>
      </header>
      <main className={styles.main}>
        <section className={styles.placeholder}>
          <h1 className={styles.placeholderHeading}>Your dashboard is ready</h1>
          <p className={styles.placeholderBody}>
            Widgets will render here — grid editing arrives in the next update.
          </p>
        </section>
      </main>
    </>
  )
}
