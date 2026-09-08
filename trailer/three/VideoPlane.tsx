import { useThree } from '@react-three/fiber'
import { Video } from '@remotion/media'
import { useCallback, useMemo, useState } from 'react'
import { useRemotionEnvironment } from 'remotion'
import { CanvasTexture } from 'three'

import type { MediabunnyMetadata } from './helpers/get-media-metadata'
import { roundedRect } from './helpers/rounded-rectangle'

/**
 * A rounded plane lit by a Remotion video. Both screens in the trailer — the
 * phone and the desktop browser window — are this.
 *
 * roundedRect draws from its bottom-left corner, so the mesh is offset by half
 * its size inside the group; callers position the group by its centre.
 */
export const VideoPlane: React.FC<{
  readonly videoSrc: string
  readonly mediaMetadata: MediabunnyMetadata
  readonly width: number
  readonly height: number
  readonly radius: number
  readonly position: [number, number, number]
  readonly opacity?: number
}> = ({ videoSrc, mediaMetadata, width, height, radius, position, opacity = 1 }) => {
  const shape = useMemo(
    () => roundedRect({ width, height, radius }),
    [width, height, radius],
  )

  const [canvas] = useState(
    () =>
      new OffscreenCanvas(
        mediaMetadata.dimensions.width,
        mediaMetadata.dimensions.height,
      ),
  )
  const [context] = useState(() => {
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Failed to get 2d context for a screen texture')
    return ctx
  })
  const [texture] = useState(() => {
    const tex = new CanvasTexture(canvas)
    tex.repeat.y = 1 / height
    tex.repeat.x = 1 / width
    return tex
  })

  const { invalidate, advance } = useThree()
  const { isRendering } = useRemotionEnvironment()

  /* eslint-disable react-hooks/immutability -- `context` and `texture` are
     imperative GPU handles, not render state. Writing pixels into them per
     frame is the documented Remotion video-texture pattern:
     https://www.remotion.dev/docs/videos/as-threejs-texture */
  const onVideoFrame = useCallback(
    (videoFrame: CanvasImageSource) => {
      context.drawImage(videoFrame, 0, 0)
      texture.needsUpdate = true
      if (isRendering) {
        // ThreeCanvas renders with frameloop='never' and advances in an effect
        // on frame change; video decode resolves *after* that, so the scene was
        // drawn with a stale texture. Re-render now, synchronously.
        advance(performance.now())
      } else {
        invalidate()
      }
    },
    [context, texture, isRendering, advance, invalidate],
  )
  /* eslint-enable react-hooks/immutability */

  return (
    <group position={position}>
      <Video src={videoSrc} onVideoFrame={onVideoFrame} headless muted />
      <mesh position={[-width / 2, -height / 2, 0]}>
        <shapeGeometry args={[shape]} />
        <meshBasicMaterial
          color={0xffffff}
          toneMapped={false}
          map={texture}
          transparent={opacity < 1}
          opacity={opacity}
        />
      </mesh>
    </group>
  )
}
