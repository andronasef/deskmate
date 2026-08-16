type Listener = (fullscreen: boolean) => void

const listeners = new Set<Listener>()

export function isFullscreen(): boolean {
  return (
    typeof document !== 'undefined' &&
    Boolean((document as unknown as { fullscreenElement?: Element | null }).fullscreenElement)
  )
}

export function requestFullscreen(el: HTMLElement = document.documentElement): Promise<void> {
  const doc = el as HTMLElement & { webkitRequestFullscreen?: () => Promise<void> | void }
  if (typeof doc.requestFullscreen === 'function') {
    return Promise.resolve(doc.requestFullscreen()).then(() => undefined)
  }
  if (typeof doc.webkitRequestFullscreen === 'function') {
    return Promise.resolve(doc.webkitRequestFullscreen()).then(() => undefined)
  }
  return Promise.reject(new Error('fullscreen unsupported'))
}

export function exitFullscreen(): Promise<void> {
  const doc = document as Document & { webkitExitFullscreen?: () => Promise<void> | void }
  if (typeof doc.exitFullscreen === 'function') {
    return Promise.resolve(doc.exitFullscreen()).then(() => undefined)
  }
  if (typeof doc.webkitExitFullscreen === 'function') {
    return Promise.resolve(doc.webkitExitFullscreen()).then(() => undefined)
  }
  return Promise.reject(new Error('fullscreen unsupported'))
}

export function subscribeFullscreenState(cb: (fs: boolean) => void): () => void {
  listeners.add(cb)
  cb(isFullscreen())
  return () => {
    listeners.delete(cb)
  }
}

// Notify subscribers on any fullscreenchange (standard + webkit).
if (typeof document !== 'undefined') {
  const notify = () => {
    const fs = isFullscreen()
    for (const listener of listeners) {
      listener(fs)
    }
  }
  document.addEventListener('fullscreenchange', notify)
  document.addEventListener('webkitfullscreenchange', notify)
}
