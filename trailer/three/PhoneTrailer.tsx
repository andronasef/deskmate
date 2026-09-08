import { ThreeCanvas } from '@remotion/three'
import { AbsoluteFill, useRemotionEnvironment, useVideoConfig } from 'remotion'

import { Captions } from '../Captions'
import { AudioBed } from '../AudioBed'
import type { TrackId } from '../music'
import { CameraRig } from './CameraRig'
import { Desktop } from './Desktop'
import type { MediabunnyMetadata } from './helpers/get-media-metadata'
import { Phone } from './Phone'

type Source = { readonly src: string; readonly meta: MediabunnyMetadata }

export type PhoneTrailerProps = {
  readonly track: TrackId
  readonly screen: Source | null
  readonly desktop: Source | null
}

const MISSING_HINT: Record<string, string> = {
  screen: 'bun run trailer:screen',
  desktop: 'bun run trailer:desktop',
}

export const PhoneTrailer: React.FC<PhoneTrailerProps> = ({ track, screen, desktop }) => {
  const { width, height, durationInFrames } = useVideoConfig()
  const { isRendering } = useRemotionEnvironment()

  const missing = [!screen && 'screen', !desktop && 'desktop'].filter(
    (name): name is string => typeof name === 'string',
  )

  // In the studio a missing pass-1 file shows a dark stand-in so the camera and
  // layout stay workable. A real render must never quietly output blank screens.
  if (missing.length > 0 && isRendering) {
    throw new Error(
      `Missing pass-1 render(s): ${missing
        .map((n) => `public/${n}.mp4`)
        .join(', ')}. Run: ${missing.map((n) => MISSING_HINT[n]).join(' && ')}`,
    )
  }

  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      <ThreeCanvas
        linear
        width={width}
        height={height}
        camera={{ fov: 28, near: 0.1, far: 100 }}
        style={{ backgroundColor: '#000' }}
      >
        <CameraRig />

        <ambientLight intensity={0.22} color={0xffffff} />
        <directionalLight position={[2.5, 3.5, 4]} intensity={1.6} color={0xffffff} />
        {/* Rim lights in --accent and --blue-panel (src/index.css), one on each
            side so an edge stays lit whichever way the camera orbits. */}
        <pointLight position={[-2.4, 1.2, 1.6]} intensity={26} color="#ff8c1a" distance={12} />
        <pointLight position={[2.6, 1.0, -1.4]} intensity={20} color="#ff8c1a" distance={12} />
        <pointLight position={[2.8, -1.8, 2.2]} intensity={14} color="#2c4a8c" distance={12} />

        <Phone source={screen} durationInFrames={durationInFrames} />
        <Desktop source={desktop} />
      </ThreeCanvas>

      <Captions />
      <AudioBed track={track} />

      {missing.length > 0 ? (
        <div
          style={{
            position: 'absolute',
            top: 24,
            left: 24,
            right: 24,
            padding: '16px 20px',
            borderRadius: 8,
            background: 'rgba(255, 140, 26, 0.14)',
            border: '1px solid #ff8c1a',
            color: '#fff8e7',
            font: '500 26px ui-monospace, monospace',
            lineHeight: 1.4,
          }}
        >
          Preview only — {missing.map((n) => `public/${n}.mp4`).join(' and ')} not
          rendered yet. Run {missing.map((n) => MISSING_HINT[n]).join(' && ')}
        </div>
      ) : null}
    </AbsoluteFill>
  )
}
