import { Easing, interpolate, useCurrentFrame } from 'remotion'

import type { MediabunnyMetadata } from './helpers/get-media-metadata'
import { PlaceholderPlane } from './PlaceholderPlane'
import { VideoPlane } from './VideoPlane'

export const DESKTOP_FROM = 840
export const DESKTOP_TO = 960

const WIDTH = 2.4
const HEIGHT = (WIDTH * 900) / 1600
const RADIUS = 0.045
/** Behind and to the left of the phone, so the phone overlaps its corner. */
const CENTRE: [number, number, number] = [-0.62, 1.02, -1.5]

/**
 * The desktop beat: a browser window rises behind the phone showing the same
 * dashboard as a start page. Fed by the DesktopContent composition.
 */
export const Desktop: React.FC<{
  readonly source: { src: string; meta: MediabunnyMetadata } | null
}> = ({ source }) => {
  const frame = useCurrentFrame()

  if (frame < DESKTOP_FROM) return null

  const reveal = interpolate(frame, [DESKTOP_FROM, DESKTOP_FROM + 34], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  })
  // Rises into place rather than popping in.
  const y = CENTRE[1] - (1 - reveal) * 0.35

  return (
    <group position={[CENTRE[0], y, CENTRE[2]]} scale={0.94 + reveal * 0.06}>
      {/* Bezel: a slightly larger dark plane a hair behind the screen. */}
      <mesh position={[0, 0, -0.004]}>
        <planeGeometry args={[WIDTH + 0.05, HEIGHT + 0.05]} />
        <meshStandardMaterial
          color="#17181c"
          metalness={0.5}
          roughness={0.4}
          transparent
          opacity={reveal}
        />
      </mesh>

      {source ? (
        <VideoPlane
          videoSrc={source.src}
          mediaMetadata={source.meta}
          width={WIDTH}
          height={HEIGHT}
          radius={RADIUS}
          position={[0, 0, 0]}
          opacity={reveal}
        />
      ) : (
        <PlaceholderPlane
          width={WIDTH}
          height={HEIGHT}
          radius={RADIUS}
          position={[0, 0, 0]}
          opacity={reveal}
        />
      )}
    </group>
  )
}
