import { useCallback, useEffect } from 'react'
import { useConfigStore } from '../config/store.ts'
import { exitFullscreen, requestFullscreen, subscribeFullscreenState } from './fullscreen.ts'
import { initWakeLockGlobalHandler, releaseWakeLock, requestWakeLock, subscribeWakeLockState } from './wakeLock.ts'
import type { WakeLockState } from './wakeLock.ts'

export function useWakeLockState(): WakeLockState {
  return useConfigStore((s) => s.wakeLock)
}

export function useFullscreenState(): boolean {
  return useConfigStore((s) => s.fullscreen)
}

/**
 * Kiosk bindings (D-5.04): the Fullscreen toggle drives fullscreen + wake lock together;
 * exiting fullscreen releases the wake lock; the global re-acquire handler is installed once.
 */
export function useKiosk(): {
  wakeLock: WakeLockState
  fullscreen: boolean
  toggleFullscreen: () => Promise<void>
} {
  const wakeLock = useWakeLockState()
  const fullscreen = useFullscreenState()
  const setWakeLock = useConfigStore((s) => s.setWakeLock)
  const setFullscreen = useConfigStore((s) => s.setFullscreen)

  // Single global visibilitychange re-acquire handler (D-5.02): keep awake only while fullscreen.
  useEffect(() => {
    initWakeLockGlobalHandler(() => useConfigStore.getState().fullscreen)
  }, [])

  // Service → store wiring.
  useEffect(() => {
    const unsubWake = subscribeWakeLockState(setWakeLock)
    const unsubFs = subscribeFullscreenState(setFullscreen)
    return () => {
      unsubWake()
      unsubFs()
    }
  }, [setWakeLock, setFullscreen])

  // Symmetry: leaving fullscreen (Esc / swipe) releases the wake lock (D-5.04).
  useEffect(() => {
    if (!fullscreen) {
      releaseWakeLock()
    }
  }, [fullscreen])

  const toggleFullscreen = useCallback(async () => {
    if (useConfigStore.getState().fullscreen) {
      await exitFullscreen().catch(() => {})
    } else {
      await requestFullscreen().catch(() => {})
      void requestWakeLock()
    }
  }, [])

  return { wakeLock, fullscreen, toggleFullscreen }
}
