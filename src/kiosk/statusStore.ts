import { useSyncExternalStore } from 'react'

/**
 * Kiosk status aggregation (D-5.09…5.11): widget failures + GitHub stale/rate-limited
 * flags, aggregated module-level (like toastStore) for the StatusFooter chips.
 * Snapshots are immutable (useSyncExternalStore requires stable references).
 */
interface StatusState {
  widgetFailures: number
  githubStale: boolean
  githubRateLimited: boolean
}

let state: StatusState = { widgetFailures: 0, githubStale: false, githubRateLimited: false }
const listeners = new Set<() => void>()

function setState(next: StatusState) {
  state = next
  for (const listener of listeners) {
    listener()
  }
}

export function reportWidgetFailure(): void {
  setState({ ...state, widgetFailures: state.widgetFailures + 1 })
}

export function reportWidgetRecovered(): void {
  setState({ ...state, widgetFailures: Math.max(0, state.widgetFailures - 1) })
}

export function reportGitHubState(stale: boolean, rateLimited: boolean): void {
  if (state.githubStale === stale && state.githubRateLimited === rateLimited) {
    return
  }
  setState({ ...state, githubStale: stale, githubRateLimited: rateLimited })
}

/** Test-only: reset aggregated state between tests. */
export function __resetStatusStore(): void {
  setState({ widgetFailures: 0, githubStale: false, githubRateLimited: false })
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb)
  return () => {
    listeners.delete(cb)
  }
}

function getSnapshot(): StatusState {
  return state
}

export function useStatusStore(): StatusState {
  return useSyncExternalStore(subscribe, getSnapshot)
}
