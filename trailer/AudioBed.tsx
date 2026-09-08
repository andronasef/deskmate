import { Audio, interpolate, staticFile, useVideoConfig } from 'remotion'

import { TRACKS, type TrackId } from './music'

/**
 * The bed, with the envelope from the sync map: swell into the LED ignition,
 * hold flat, duck under the tight camera push, fade out on the end card.
 */
export const AudioBed: React.FC<{ readonly track: TrackId }> = ({ track }) => {
  const { fps, durationInFrames } = useVideoConfig()

  if (track === 'none') return null

  const entry = TRACKS[track]

  return (
    <Audio
      src={staticFile(entry.file)}
      trimBefore={Math.round(entry.startFromSeconds * fps)}
      volume={(f) =>
        interpolate(
          f,
          [0, 90, 720, 840, durationInFrames - 60, durationInFrames],
          [0.15, 1, 1, 0.45, 0.45, 0],
          { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
        )
      }
    />
  )
}
