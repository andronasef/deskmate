import { Easing, interpolate, useCurrentFrame } from 'remotion'

export const IGNITION_FROM = 90
export const IGNITION_TO = 150

/**
 * The power-on: LEDs bloom radially outward from the centre of the panel, then
 * fade to reveal the wordmark. Done with the app's own dot-grid background plus
 * an expanding radial mask — same primitive as `.matrix` in src/index.css.
 */
export const LedIgnition: React.FC = () => {
  const frame = useCurrentFrame()

  // Wave front sweeps past the corners (>100% so the last dots light).
  const radius = interpolate(frame, [IGNITION_FROM, IGNITION_FROM + 34], [0, 130], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  })
  const opacity = interpolate(frame, [IGNITION_FROM + 34, IGNITION_TO], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  const mask = `radial-gradient(circle at 50% 50%, #000 ${radius}%, transparent ${radius + 18}%)`

  return (
    <div
      className="ignition"
      style={{ opacity, maskImage: mask, WebkitMaskImage: mask }}
    />
  )
}
