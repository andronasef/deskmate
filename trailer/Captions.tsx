import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from 'remotion'

import '@fontsource/vt323'
import '@fontsource/press-start-2p'
import './captions.css'

import { CAPTIONS, END_CARD_FROM } from './captionScript'

const FADE = 8

export const Captions: React.FC = () => {
  const frame = useCurrentFrame()

  const active = CAPTIONS.find((c) => frame >= c.from && frame < c.to)
  const endCard = interpolate(frame, [END_CARD_FROM, END_CARD_FROM + 20], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  return (
    <AbsoluteFill className="captionRoot">
      {active ? (
        <div
          className="captionBar"
          style={{
            opacity: interpolate(
              frame,
              [active.from, active.from + FADE, active.to - FADE, active.to],
              [0, 1, 1, 0],
              { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
            ),
          }}
        >
          <div className="captionText">{active.text}</div>
        </div>
      ) : null}

      {endCard > 0 ? (
        <div className="endCard" style={{ opacity: endCard }}>
          <Img
            className="endCardLogo"
            src={staticFile('logo.svg')}
            alt=""
            style={{
              transform: `scale(${interpolate(
                frame,
                [END_CARD_FROM, END_CARD_FROM + 26],
                [0.86, 1],
                {
                  extrapolateLeft: 'clamp',
                  extrapolateRight: 'clamp',
                  easing: Easing.out(Easing.cubic),
                },
              )})`,
            }}
          />
          <div className="endCardName">DeskMate</div>
          <div className="endCardTag">Time. Focus. Pulse.</div>
        </div>
      ) : null}
    </AbsoluteFill>
  )
}
