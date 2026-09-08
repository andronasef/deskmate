import { useEffect, useState } from 'react'
import {
  AbsoluteFill,
  continueRender,
  delayRender,
  interpolate,
  useCurrentFrame,
} from 'remotion'

import '@fontsource/vt323'
import '@fontsource/press-start-2p'
import './screen.css'

import { Clock } from './Clock'
import { Dots } from './Dots'
import { GithubPulse } from './GithubPulse'
import { IGNITION_FROM, IGNITION_TO, LedIgnition } from './LedIgnition'
import { Pomodoro } from './Pomodoro'
import { Wordmark } from './Wordmark'

type WidgetType = 'clock' | 'pomodoro' | 'github-pulse'

const SCENES: readonly { from: number; to: number; type: WidgetType }[] = [
  { from: 150, to: 360, type: 'clock' },
  { from: 360, to: 540, type: 'pomodoro' },
  { from: 540, to: 720, type: 'github-pulse' },
]

const MONTAGE_FROM = 720
const MONTAGE_HOLD = 40
const DESKTOP_FROM = 840
const OUTRO_FROM = 960

const ORDER: readonly WidgetType[] = ['clock', 'pomodoro', 'github-pulse']

const bodyFor = (type: WidgetType, frame: number) => {
  if (type === 'clock') return <Clock />
  if (type === 'pomodoro') {
    // The pomodoro's own race already finished by the montage; show it mid-run
    // again rather than a frozen 00:00.
    const montage = frame >= MONTAGE_FROM && frame < DESKTOP_FROM
    return <Pomodoro secondsOverride={montage ? 754 - (frame - MONTAGE_FROM) : undefined} />
  }
  return <GithubPulse />
}

/** Which widget is on screen, and which dot is lit. */
function activeWidget(frame: number): WidgetType | null {
  if (frame < IGNITION_TO || frame >= OUTRO_FROM) return null
  // Through the desktop beat the phone settles back onto the clock, so the two
  // screens read as one dashboard on two devices rather than a slideshow.
  if (frame >= DESKTOP_FROM) return 'clock'
  if (frame >= MONTAGE_FROM) {
    return ORDER[Math.floor((frame - MONTAGE_FROM) / MONTAGE_HOLD) % ORDER.length]
  }
  return SCENES.find((s) => frame >= s.from && frame < s.to)?.type ?? null
}

/** Short fade so widget swaps read as a transition, not a glitch. */
function switchFade(frame: number): number {
  const edges = [
    ...SCENES.map((s) => s.from),
    MONTAGE_FROM,
    MONTAGE_FROM + MONTAGE_HOLD,
    MONTAGE_FROM + MONTAGE_HOLD * 2,
    DESKTOP_FROM,
    OUTRO_FROM,
  ]
  const nearest = edges.reduce(
    (best, e) => (Math.abs(frame - e) < Math.abs(frame - best) ? e : best),
    edges[0],
  )
  return interpolate(Math.abs(frame - nearest), [0, 6], [0.15, 1], {
    extrapolateRight: 'clamp',
  })
}

export const ScreenContent: React.FC = () => {
  const frame = useCurrentFrame()
  const [handle] = useState(() => delayRender('fonts'))

  useEffect(() => {
    document.fonts.ready.then(() => continueRender(handle))
  }, [handle])

  const widget = activeWidget(frame)
  const showIgnition = frame >= IGNITION_FROM && frame < IGNITION_TO

  // The wordmark owns the screen during the ignition and again at the end.
  const introWordmark = interpolate(
    frame,
    [IGNITION_FROM + 28, IGNITION_TO - 8, IGNITION_TO, IGNITION_TO + 10],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  )
  // The outro wordmark lives in the 2D overlay (trailer/Captions.tsx), so the
  // screen just goes quiet here — two wordmarks at once reads as a mistake.
  const wordmarkOpacity = frame >= OUTRO_FROM ? 0 : introWordmark

  return (
    <AbsoluteFill className="screenRoot">
      <div className="panel stage" data-widget-type={widget ?? undefined}>
        {widget ? (
          <div className="body" style={{ opacity: switchFade(frame) }}>
            {bodyFor(widget, frame)}
          </div>
        ) : null}

        {wordmarkOpacity > 0 ? (
          <div className="body" style={{ position: 'absolute', inset: 0, opacity: wordmarkOpacity }}>
            <Wordmark tagline={false} />
          </div>
        ) : null}

        {showIgnition ? <LedIgnition /> : null}
      </div>

      <Dots active={widget ? ORDER.indexOf(widget) : -1} />
    </AbsoluteFill>
  )
}
