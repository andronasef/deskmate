import { Easing, interpolate } from 'remotion'

export type Vec3 = readonly [number, number, number]

export type CamKey = {
  readonly f: number
  readonly pos: Vec3
  readonly look: Vec3
}

/**
 * Camera path. The phone is ~1 x 2.17 world units (see getPhoneLayout with a
 * 540x1170 screen), and the vertical FOV is 28deg, so visible height ~= 0.4986 * z.
 * z ~= 6 frames the whole phone; z ~= 3.2 crops in tight on the screen.
 */
export const CAM: readonly CamKey[] = [
  { f: 0, pos: [0.0, 0.15, 8.5], look: [0, 0, 0] },
  { f: 90, pos: [0.0, 0.05, 6.2], look: [0, 0, 0] },
  { f: 200, pos: [1.4, 0.1, 5.6], look: [0, 0.05, 0] },
  { f: 360, pos: [-3.2, 0.3, 5.2], look: [0, 0, 0] },
  { f: 540, pos: [2.6, 1.6, 6.4], look: [0, 0.1, 0] },
  { f: 720, pos: [0.0, 0.0, 3.2], look: [0, 0, 0] },
  { f: 840, pos: [0.0, -0.1, 6.0], look: [0, 0, 0] },
  // The desktop beat: pull wide so the browser window behind the phone reads.
  { f: 912, pos: [-0.2, 0.5, 10.4], look: [-0.4, 0.3, 0] },
  { f: 975, pos: [0.5, 0.55, 9.8], look: [-0.35, 0.3, 0] },
  { f: 1020, pos: [0.5, 0.5, 10.0], look: [-0.35, 0.3, 0] },
]

const lerp3 = (a: Vec3, b: Vec3, t: number): Vec3 => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
]

export function sampleCam(frame: number): { pos: Vec3; look: Vec3 } {
  let i = 0
  while (i < CAM.length - 2 && frame > CAM[i + 1].f) i++
  const a = CAM[i]
  const b = CAM[i + 1]
  const t = interpolate(frame, [a.f, b.f], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.ease),
  })
  return { pos: lerp3(a.pos, b.pos, t), look: lerp3(a.look, b.look, t) }
}
