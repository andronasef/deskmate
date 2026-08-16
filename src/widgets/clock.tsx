import { useEffect, useState } from 'react'
import type { WidgetInstance } from '../config/types.ts'
import type { WidgetTheme } from './theme.ts'
import styles from './clock.module.css'

interface ClockWidgetProps {
  widget: WidgetInstance
  theme: WidgetTheme
}

const FONT_SIZE_PX: Record<string, number> = {
  small: 28,
  medium: 40,
  large: 56,
}

function secondsToTick(showSeconds: boolean): number {
  return showSeconds ? 1000 : 60_000
}

export function ClockWidget({ widget }: ClockWidgetProps) {
  const settings = widget.settings as {
    showSeconds?: boolean
    hour12?: boolean
    fontSize?: string
  }
  const showSeconds = settings.showSeconds ?? false
  const hour12 = settings.hour12 ?? true
  const fontSize = settings.fontSize ?? 'medium'

  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), secondsToTick(showSeconds))
    return () => clearInterval(timer)
  }, [showSeconds])

  const time = new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    ...(showSeconds ? { second: '2-digit' as const } : {}),
    hour12,
  }).format(now)

  const date = new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  }).format(now)

  const timeParts = time.split(':')

  return (
    <div className={styles.root}>
      <time
        className={styles.time}
        style={{ fontSize: FONT_SIZE_PX[fontSize] ?? 40 }}
        data-testid="clock-time"
      >
        {timeParts.map((part, i) => (
          <span key={i}>
            {part}
            {i < timeParts.length - 1 && <span className={styles.colon}>:</span>}
          </span>
        ))}
      </time>
      <div className={styles.date} data-testid="clock-date">
        {date}
      </div>
    </div>
  )
}
