import { interpolate, useCurrentFrame } from 'remotion'

const TOTAL_SECONDS = 25 * 60
const RACE_FROM = 375
const RACE_TO = 500

const two = (n: number) => String(n).padStart(2, '0')

export const Pomodoro: React.FC<{ readonly secondsOverride?: number }> = ({
  secondsOverride,
}) => {
  const frame = useCurrentFrame()

  const secondsLeft =
    secondsOverride ??
    Math.round(
      interpolate(frame, [RACE_FROM, RACE_TO], [TOTAL_SECONDS, 0], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      }),
    )
  const done = secondsLeft === 0
  // Hard red flash on completion, then settle.
  const flash = done && Math.floor((frame - RACE_TO) / 4) % 2 === 0

  return (
    <div className="pomodoro">
      <div className="pomodoroLabel">Focus</div>
      <div
        className="pomodoroTime glow"
        style={flash ? { color: 'var(--destructive)' } : undefined}
      >
        {two(Math.floor(secondsLeft / 60))}:{two(secondsLeft % 60)}
      </div>
      <div className="pomodoroBar">
        <div
          className="pomodoroBarFill"
          style={{ width: `${(1 - secondsLeft / TOTAL_SECONDS) * 100}%` }}
        />
      </div>
      {done ? <div className="pomodoroDone glow">Time&rsquo;s up!</div> : null}
    </div>
  )
}
