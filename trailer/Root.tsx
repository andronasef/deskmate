import { Composition, staticFile } from 'remotion'
import { z } from 'zod'

import { trackSchema } from './music'
import { DesktopContent } from './screen/DesktopContent'
import { ScreenContent } from './screen/ScreenContent'
import { getMediaMetadata } from './three/helpers/get-media-metadata'
import { PhoneTrailer } from './three/PhoneTrailer'

const FPS = 30
const DURATION = 1020

/**
 * A pass-1 file may not exist yet — the studio has to stay openable so the
 * camera and layout can be worked on before committing to two long renders.
 * Missing means null here; PhoneTrailer shows a placeholder in the studio and
 * refuses to render.
 */
async function loadSource(name: string) {
  const src = staticFile(name)
  try {
    return { src, meta: await getMediaMetadata(src) }
  } catch {
    return null
  }
}

export const RemotionRoot: React.FC = () => (
  <>
    {/* PASS 1a — the phone screen:  bun run trailer:screen  -> public/screen.mp4 */}
    <Composition
      id="ScreenContent"
      component={ScreenContent}
      durationInFrames={DURATION}
      fps={FPS}
      width={540}
      height={1170}
    />

    {/* PASS 1b — the browser start page: bun run trailer:desktop -> public/desktop.mp4
        Same frame numbering as everything else, so no offset maths anywhere. */}
    <Composition
      id="DesktopContent"
      component={DesktopContent}
      durationInFrames={DURATION}
      fps={FPS}
      width={1600}
      height={900}
    />

    {/* PASS 2 — consumes both */}
    <Composition
      id="PhoneTrailer"
      component={PhoneTrailer}
      durationInFrames={DURATION}
      fps={FPS}
      width={1080}
      height={1920}
      schema={z.object({ track: trackSchema })}
      defaultProps={{
        track: 'zabriskie',
        screen: null,
        desktop: null,
      }}
      calculateMetadata={async ({ props }) => ({
        props: {
          track: props.track,
          screen: await loadSource('screen.mp4'),
          desktop: await loadSource('desktop.mp4'),
        },
      })}
    />
  </>
)
