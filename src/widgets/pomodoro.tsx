import { useCallback, useEffect, useRef, useState } from 'react'
import { Pause, Play, RotateCcw } from 'lucide-react'
import type { WidgetInstance } from '../config/types.ts'
import styles from './pomodoro.module.css'

interface PomodoroWidgetProps {
  widget: WidgetInstance
}

function clampMinutes(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(n)) {
    return 25
  }
  return Math.min(120, Math.max(1, Math.round(n)))
}

/** Two-tone chime via Web Audio (D-3.10) — no asset. Must be called from a user gesture. */
function playChime(): void {
  try {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (Ctor == null) {
      return
    }
    const ctx = new Ctor()
    const now = ctx.currentTime
    const playTone = (start: number, freq: number, dur: number) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0.0001, start)
      gain.gain.exponentialRampToValueAtTime(0.3, start + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, start + dur)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(start)
      osc.stop(start + dur + 0.05)
    }
    playTone(now, 880, 0.35)
    playTone(now + 0.4, 660, 0.5)
    void ctx.close().catch(() => {})
  } catch {
    // Audio unavailable (test env / restricted context) — silently skip the chime.
  }
}

function formatMMSS(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function PomodoroWidget({ widget }: PomodoroWidgetProps) {
  const minutes = clampMinutes(widget.settings.minutes)
  const total = minutes * 60

  const [secondsLeft, setSecondsLeft] = useState(total)
  const [running, setRunning] = useState(false)
  const [done, setDone] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  // Reset when the configured minutes change (settings edit) — adjust state during
  // render (sanctioned derived-state pattern; avoids a setState-in-effect cascade).
  const [appliedTotal, setAppliedTotal] = useState(total)
  if (appliedTotal !== total) {
    setAppliedTotal(total)
    setSecondsLeft(total)
    setDone(false)
  }

  const stopTicking = useCallback(() => {
    if (intervalRef.current != null) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const start = useCallback(() => {
    // The click handler doubles as the autoplay unlock gesture (D-3.10).
    stopTicking()
    setRunning(true)
    setDone(false)
    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          stopTicking()
          setRunning(false)
          setDone(true)
          playChime()
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [stopTicking])

  const pause = useCallback(() => {
    stopTicking()
    setRunning(false)
  }, [stopTicking])

  const reset = useCallback(() => {
    stopTicking()
    setRunning(false)
    setDone(false)
    setSecondsLeft(total)
  }, [stopTicking, total])

  // No zombie timers (STATE.md verify flag): clear on unmount.
  useEffect(() => stopTicking, [stopTicking])

  return (
    <div className={styles.root} data-pomodoro>
      <div
        className={`glow ${styles.countdown}`}
        data-running={running}
        data-done={done}
        data-testid="pomodoro-countdown"
        role="timer"
      >
        {done ? '00:00' : formatMMSS(secondsLeft)}
      </div>
      {done && <div className={styles.doneLabel}>Time's up!</div>}
      <div className={styles.controls}>
        {!running ? (
          <button type="button" className={styles.control} onClick={start} aria-label="Start" title="Start" data-start>
            <Play size={16} />
          </button>
        ) : (
          <button type="button" className={styles.control} onClick={pause} aria-label="Pause" title="Pause" data-pause>
            <Pause size={16} />
          </button>
        )}
        <button type="button" className={styles.control} onClick={reset} aria-label="Reset" title="Reset" data-reset>
          <RotateCcw size={16} />
        </button>
      </div>
    </div>
  )
}
