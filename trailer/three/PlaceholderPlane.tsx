import { useMemo } from 'react'

import { roundedRect } from './helpers/rounded-rectangle'

/** Stands in for a VideoPlane whose pass-1 render doesn't exist yet. */
export const PlaceholderPlane: React.FC<{
  readonly width: number
  readonly height: number
  readonly radius: number
  readonly position: [number, number, number]
  readonly opacity?: number
}> = ({ width, height, radius, position, opacity = 1 }) => {
  const shape = useMemo(
    () => roundedRect({ width, height, radius }),
    [width, height, radius],
  )

  return (
    <group position={position}>
      <mesh position={[-width / 2, -height / 2, 0]}>
        <shapeGeometry args={[shape]} />
        <meshBasicMaterial
          color="#14161c"
          toneMapped={false}
          transparent={opacity < 1}
          opacity={opacity}
        />
      </mesh>
    </group>
  )
}
