import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Import AFTER stubbing-free module state — we manipulate navigator per test.
import {
  getWakeLockState,
  initWakeLockGlobalHandler,
  isWakeLockSupported,
  releaseWakeLock,
  requestWakeLock,
  subscribeWakeLockState,
} from './wakeLock.ts'

function stubWakeLock(impl: { request?: (t: 'screen') => Promise<unknown> } | undefined | null) {
  if (impl === undefined || impl === null) {
    // Simulate an unsupported browser: delete the property entirely.
    vi.stubGlobal('navigator', {})
    return
  }
  vi.stubGlobal('navigator', { wakeLock: impl })
}

const makeSentinel = () => {
  let released = false
  const sentinel = {
    release: vi.fn(() => {
      released = true
      return Promise.resolve()
    }),
    get releasedPromise() {
      return new Promise<void>((resolve) => {
        const check = () => (released ? resolve() : setTimeout(check, 0))
        check()
      })
    },
  }
  return sentinel
}

describe('WakeLockService (KIOSK-01/02)', () => {
  const states: string[] = []

  beforeEach(() => {
    states.length = 0
    vi.restoreAllMocks()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  function subscribe() {
    return subscribeWakeLockState((s) => states.push(s))
  }

  it('reports unsupported when navigator.wakeLock is absent', async () => {
    stubWakeLock(null)
    expect(isWakeLockSupported()).toBe(false)
    const s = await requestWakeLock()
    expect(s).toBe('unsupported')
    expect(getWakeLockState()).toBe('unsupported')
  })

  it('requests a screen sentinel and enters active state', async () => {
    const sentinel = makeSentinel()
    const request = vi.fn(() => Promise.resolve(sentinel))
    stubWakeLock({ request })
    const unsub = subscribe()

    const s = await requestWakeLock()
    expect(request).toHaveBeenCalledWith('screen')
    expect(s).toBe('active')
    expect(states).toContain('active')
    unsub()
  })

  it('release() releases the sentinel and returns to inactive', async () => {
    const sentinel = makeSentinel()
    stubWakeLock({ request: vi.fn(() => Promise.resolve(sentinel)) })
    await requestWakeLock()
    releaseWakeLock()
    expect(sentinel.release).toHaveBeenCalled()
    expect(getWakeLockState()).toBe('inactive')
  })

  it('rejection (Low Power Mode / battery saver) → error state, no crash', async () => {
    stubWakeLock({ request: vi.fn(() => Promise.reject(new Error('NotAllowedError'))) })
    const s = await requestWakeLock()
    expect(s).toBe('error')
    expect(getWakeLockState()).toBe('error')
  })

  it('visibilitychange → visible re-acquires when the app intends kiosk (single global handler)', async () => {
    const request = vi.fn(() => Promise.resolve(makeSentinel()))
    stubWakeLock({ request })
    initWakeLockGlobalHandler(() => true)
    await requestWakeLock()
    request.mockClear()

    // hidden → visible → re-acquire exactly once
    Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true })
    document.dispatchEvent(new Event('visibilitychange'))
    Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true })
    document.dispatchEvent(new Event('visibilitychange'))

    expect(request).toHaveBeenCalledTimes(1) // re-acquired once on visible
  })

  it('does not re-acquire when kiosk intent is off', async () => {
    const request = vi.fn(() => Promise.resolve(makeSentinel()))
    stubWakeLock({ request })
    initWakeLockGlobalHandler(() => false)
    document.dispatchEvent(new Event('visibilitychange', {}))
    expect(request).not.toHaveBeenCalled()
  })
})
