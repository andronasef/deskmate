import { useEffect, useMemo, useState } from 'react'
import {
  continueRender,
  delayRender,
  interpolate,
  staticFile,
  useCurrentFrame,
} from 'remotion'
import { Group, Mesh, MeshStandardMaterial } from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

import type { MediabunnyMetadata } from './helpers/get-media-metadata'
import { roundedRect } from './helpers/rounded-rectangle'
import { PlaceholderPlane } from './PlaceholderPlane'
import {
  MODEL,
  SCALE,
  SCREEN_HEIGHT,
  SCREEN_RADIUS,
  SCREEN_WIDTH,
  SCREEN_Z,
} from './phoneModel'
import { VideoPlane } from './VideoPlane'

/** Loads public/phone.glb once and blocks the frame until it is ready. */
function usePhoneModel(): Group | null {
  const [handle] = useState(() => delayRender('phone.glb'))
  const [scene, setScene] = useState<Group | null>(null)

  useEffect(() => {
    let cancelled = false
    new GLTFLoader().load(
      staticFile('phone.glb'),
      (gltf) => {
        if (cancelled) return
        gltf.scene.traverse((child) => {
          if (!(child instanceof Mesh)) return
          // The export carries no NORMAL attribute, so lighting would be flat
          // black without this.
          child.geometry.computeVertexNormals()
          child.material = new MeshStandardMaterial({
            color: '#d7d9dd',
            metalness: 0.62,
            roughness: 0.34,
          })
        })
        setScene(gltf.scene)
        continueRender(handle)
      },
      undefined,
      (err) => {
        throw err
      },
    )
    return () => {
      cancelled = true
    }
  }, [handle])

  return scene
}

export const Phone: React.FC<{
  readonly source: { src: string; meta: MediabunnyMetadata } | null
  readonly durationInFrames: number
}> = ({ source, durationInFrames }) => {
  const frame = useCurrentFrame()
  const model = usePhoneModel()

  // One slow, monotonic yaw drift across the whole shot — no sine wobble, so
  // the phone never reads as shaking. All camera movement lives in CameraRig.
  const rotateY = interpolate(frame, [0, durationInFrames], [0.22, -0.1])

  const glassShape = useMemo(
    () =>
      roundedRect({
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT,
        radius: SCREEN_RADIUS,
      }),
    [],
  )

  return (
    <group rotation={[0, rotateY, 0]}>
      {/* The model lies flat with its front plate facing +Y. Rotate about X to
          stand it up, then about Z to put its long axis vertical, then pull it
          back so the body is centred on z = 0. */}
      {model ? (
        <group position={[0, 0, -(MODEL.thickness / 2) * SCALE]}>
          <group rotation={[0, 0, Math.PI / 2]}>
            <group rotation={[Math.PI / 2, 0, 0]}>
              <primitive object={model} scale={SCALE} />
            </group>
          </group>
        </group>
      ) : null}

      {source ? (
        <VideoPlane
          videoSrc={source.src}
          mediaMetadata={source.meta}
          width={SCREEN_WIDTH}
          height={SCREEN_HEIGHT}
          radius={SCREEN_RADIUS}
          position={[0, 0, SCREEN_Z]}
        />
      ) : (
        <PlaceholderPlane
          width={SCREEN_WIDTH}
          height={SCREEN_HEIGHT}
          radius={SCREEN_RADIUS}
          position={[0, 0, SCREEN_Z]}
        />
      )}

      {/* Glass: reflections sit on top of the emitted image */}
      <mesh position={[-SCREEN_WIDTH / 2, -SCREEN_HEIGHT / 2, SCREEN_Z + 0.002]}>
        <shapeGeometry args={[glassShape]} />
        <meshPhysicalMaterial
          transparent
          opacity={0.07}
          color="#0a0a0c"
          roughness={0.03}
          metalness={0}
          clearcoat={1}
          clearcoatRoughness={0.02}
        />
      </mesh>
    </group>
  )
}
