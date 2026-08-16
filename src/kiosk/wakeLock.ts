export type WakeLockState = 'inactive' | 'active' | 'unsupported' | 'error'

type Listener = (state: WakeLockState) => void

let state: WakeLockState = 'inactive'
let sentinel: { release: () => Promise<void> } | null = null
const listeners = new Set<Listener>()

function emit() {
  for (const listener of listeners) {
    listener(state)
  }
}

export function isWakeLockSupported(): boolean {
  return typeof navigator !== 'undefined' && 'wakeLock' in navigator
}

function getWakeLockApi(): { request: (type: 'screen') => Promise<unknown> } | null {
  if (!isWakeLockSupported()) {
    return null
  }
  return (navigator as unknown as { wakeLock: { request: (type: 'screen') => Promise<unknown> } }).wakeLock
}

export function getWakeLockState(): WakeLockState {
  return state
}

export function subscribeWakeLockState(cb: (s: WakeLockState) => void): () => void {
  listeners.add(cb)
  cb(state)
  return () => {
    listeners.delete(cb)
  }
}

/** Request a screen wake lock (KIOSK-01). Rejects → 'error'; unsupported → 'unsupported'. */
export async function requestWakeLock(): Promise<WakeLockState> {
  const api = getWakeLockApi()
  if (api == null) {
    state = 'unsupported'
    emit()
    return state
  }
  try {
    const next = (await api.request('screen')) as { release?: () => Promise<void>; released?: Promise<void> }
    // Wire auto-release detection: when the browser releases (e.g. tab hidden), reflect it.
    if (typeof next.released?.then === 'function') {
      next.released.then(() => {
        if (sentinel === next) {
          sentinel = null
          state = 'inactive'
          emit()
        }
      })
    }
    sentinel = next as { release: () => Promise<void> }
    state = 'active'
    emit()
  } catch {
    // Low Power Mode / battery saver / permissions policy → NotAllowedError.
    state = 'error'
    emit()
  }
  return state
}

export function releaseWakeLock(): void {
  if (sentinel != null) {
    const s = sentinel
    sentinel = null
    try {
      void s.release()
    } catch {
      // sentinel already released — fine.
    }
  }
  state = 'inactive'
  emit()
}

let globalHandlerInstalled = false
let shouldKeepAwake: () => boolean = () => false

/**
 * Single global visibilitychange handler (D-5.02): when the tab returns to visible,
 * re-acquire the wake lock IF the app is in kiosk intent (fullscreen active).
 * The intent getter is re-read on every call so later installs supersede earlier ones.
 */
export function initWakeLockGlobalHandler(getShouldKeepAwake: () => boolean): void {
  shouldKeepAwake = getShouldKeepAwake
  if (globalHandlerInstalled) {
    return
  }
  globalHandlerInstalled = true
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && shouldKeepAwake()) {
      void requestWakeLock()
    }
  })
}
