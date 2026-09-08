import { useCurrentFrame, useVideoConfig } from 'remotion'

/** Fixed wall-clock start, so every render of frame N is identical. */
const BASE = new Date(2026, 8, 7, 9, 41, 0)

const two = (n: number) => String(n).padStart(2, '0')

export const Clock: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const now = new Date(BASE.getTime() + Math.floor(frame / fps) * 1000)
  const hours = now.getHours() % 12 || 12
  const colonLit = Math.floor(frame / 15) % 2 === 0

  return (
    <div className="clock">
      <div className="clockTime glow">
        {two(hours)}
        <span style={{ opacity: colonLit ? 1 : 0.15 }}>:</span>
        {two(now.getMinutes())}
      </div>
      <div className="clockMeta">
        {now.getHours() < 12 ? 'AM' : 'PM'} &middot; Mon 7 Sep
      </div>
    </div>
  )
}
