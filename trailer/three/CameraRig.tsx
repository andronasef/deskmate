import { useThree } from '@react-three/fiber'
import { useLayoutEffect } from 'react'
import { useCurrentFrame } from 'remotion'

import { sampleCam } from '../camera'

/**
 * Drives the camera straight off `frame`. useLayoutEffect runs before
 * ThreeCanvas's own advance() effect, so the camera is already in place for
 * the frame being rendered.
 */
export const CameraRig: React.FC = () => {
  const frame = useCurrentFrame()
  const camera = useThree((state) => state.camera)

  useLayoutEffect(() => {
    const { pos, look } = sampleCam(frame)
    camera.position.set(pos[0], pos[1], pos[2])
    camera.lookAt(look[0], look[1], look[2])
    camera.updateProjectionMatrix()
  }, [camera, frame])

  return null
}
