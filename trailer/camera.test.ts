import { describe, expect, it } from 'vitest'
import { CAM, sampleCam } from './camera'

const dist = (a: readonly number[], b: readonly number[]) =>
  Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])

describe('sampleCam', () => {
  it('returns each keyframe exactly at its own frame', () => {
    for (const key of CAM) {
      const { pos, look } = sampleCam(key.f)
      key.pos.forEach((v, i) => expect(pos[i]).toBeCloseTo(v, 6))
      key.look.forEach((v, i) => expect(look[i]).toBeCloseTo(v, 6))
    }
  })

  it('clamps outside the composition', () => {
    expect(dist(sampleCam(-50).pos, CAM[0].pos)).toBeCloseTo(0, 6)
    expect(dist(sampleCam(5000).pos, CAM[CAM.length - 1].pos)).toBeCloseTo(0, 6)
  })

  it('is continuous - no snap between consecutive frames', () => {
    let prev = sampleCam(0)
    for (let f = 1; f <= 1020; f++) {
      const next = sampleCam(f)
      expect(dist(prev.pos, next.pos)).toBeLessThan(0.5)
      expect(dist(prev.look, next.look)).toBeLessThan(0.5)
      prev = next
    }
  })
})
