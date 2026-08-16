import { useSyncExternalStore } from 'react'
import type { WakeLockState } from './wakeLock.ts'

export interface SoakSample {
  fps: number
  heapMB: number
  wakeLock: WakeLockState
  visibility: string
}

let lastSample: SoakSample = { fps: 0, heapMB: 0, wakeLock: 'inactive', visibility: 'visible' }
const listeners = new Set<() => void>()

// rAF delta EMA for frame-time (D-5.15).
let lastFrameTime = performance.now()
let emaFrameMs = 16

export function runSoakSample(getWakeLock: () => WakeLockState): SoakSample {
  const now = performance.now()
  const delta = now - lastFrameTime
  lastFrameTime = now
  emaFrameMs = emaFrameMs * 0.9 + delta * 0.1
  const mem = (performance as unknown as { memory?: { usedJSHeapSize?: number } }).memory
  lastSample = {
    fps: emaFrameMs > 0 ? Math.round(1000 / emaFrameMs) : 0,
    heapMB: mem?.usedJSHeapSize != null ? Math.round(mem.usedJSHeapSize / (1024 * 1024)) : 0,
    wakeLock: getWakeLock(),
    visibility: document.visibilityState,
  }
  return lastSample
}

export function getSoakSample(): SoakSample {
  return lastSample
}

export function subscribeSoak(cb: () => void): () => void {
  listeners.add(cb)
  return () => {
    listeners.delete(cb)
  }
}

export function useSoakSample(): SoakSample {
  return useSyncExternalStore(subscribeSoak, getSoakSample)
}

export function notifySoakListeners(): void {
  for (const listener of listeners) {
    listener()
  }
}
