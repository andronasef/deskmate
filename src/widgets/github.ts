import { useCallback, useEffect, useRef, useState } from 'react'

export interface GitHubRepoData {
  owner: string
  repo: string
  stars: number
  openIssues: number
  streakCommits7d: number
  updatedAt: number // epoch ms of last successful fetch
  stale: boolean // rendered from cache after a failure
  rateLimited: boolean // a 403/429 was observed
  backoffUntil?: number // epoch ms — skip fetches before this
}

const CACHE_PREFIX = 'deskmate.github.'
const BASE = 'https://api.github.com'
const MIN_BACKOFF_MS = 3 * 60 * 1000 // ≥3 min adaptive backoff (D-3.14)
const STREAK_DAYS = 7

interface CacheEntry {
  data: Omit<GitHubRepoData, 'stale' | 'rateLimited' | 'backoffUntil'>
  etag?: string
  lastModified?: string
}

function cacheKey(owner: string, repo: string): string {
  return `${CACHE_PREFIX}${owner}/${repo}`
}

function readCache(owner: string, repo: string): CacheEntry | null {
  try {
    const raw = localStorage.getItem(cacheKey(owner, repo))
    return raw == null ? null : (JSON.parse(raw) as CacheEntry)
  } catch {
    return null
  }
}

function writeCache(owner: string, repo: string, entry: CacheEntry): void {
  try {
    localStorage.setItem(cacheKey(owner, repo), JSON.stringify(entry))
  } catch {
    // Quota/private-mode — degrade silently; widget still renders in-memory data.
  }
}

async function fetchJson(url: string, headers: Record<string, string>, signal?: AbortSignal): Promise<{ status: number; headers: Headers; body: unknown }> {
  const res = await fetch(url, { headers, signal })
  let body: unknown
  try {
    body = await res.json()
  } catch {
    body = null
  }
  return { status: res.status, headers: res.headers, body }
}

function parseRepoMetrics(body: unknown): Omit<GitHubRepoData, 'owner' | 'repo' | 'updatedAt' | 'stale' | 'rateLimited' | 'backoffUntil'> | null {
  if (body == null || typeof body !== 'object') {
    return null
  }
  const b = body as Record<string, unknown>
  const stars = typeof b.stargazers_count === 'number' ? b.stargazers_count : undefined
  const openIssues = typeof b.open_issues_count === 'number' ? b.open_issues_count : undefined
  if (stars == null || openIssues == null) {
    return null
  }
  return { stars, openIssues, streakCommits7d: 0 }
}

function parseCommitStreak(body: unknown): number | null {
  if (!Array.isArray(body)) {
    return null
  }
  // Distinct days with ≥1 commit in the last 7 days.
  const days = new Set<string>()
  for (const item of body) {
    const date = (item as { commit?: { author?: { date?: string } } })?.commit?.author?.date
    if (typeof date === 'string') {
      days.add(date.slice(0, 10))
    }
  }
  return days.size
}

function parseBackoff(headers: Headers): number | undefined {
  const remaining = headers.get('x-ratelimit-remaining')
  const reset = headers.get('x-ratelimit-reset')
  if (remaining === '0' && reset != null) {
    const resetMs = Number(reset) * 1000
    if (Number.isFinite(resetMs)) {
      return Math.max(Date.now() + MIN_BACKOFF_MS, resetMs)
    }
  }
  return Date.now() + MIN_BACKOFF_MS
}

async function fetchRepo(owner: string, repo: string, signal?: AbortSignal): Promise<GitHubRepoData> {
  const cached = readCache(owner, repo)
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'deskmate',
  }
  if (cached?.etag != null) {
    headers['If-None-Match'] = cached.etag
  } else if (cached?.lastModified != null) {
    headers['If-Modified-Since'] = cached.lastModified
  }

  try {
    const repoRes = await fetchJson(`${BASE}/repos/${owner}/${repo}`, headers, signal)
    const repoHeaders = repoRes.headers

    if (repoRes.status === 304 && cached != null) {
      return { ...cached.data, owner, repo, stale: false, rateLimited: false }
    }
    if (repoRes.status === 403 || repoRes.status === 429) {
      const backoffUntil = parseBackoff(repoHeaders)
      if (backoffUntil != null) {
        backoffMap.set(`${owner}/${repo}`, backoffUntil)
      }
      if (cached != null) {
        return { ...cached.data, owner, repo, stale: true, rateLimited: true, backoffUntil }
      }
      return { owner, repo, stars: 0, openIssues: 0, streakCommits7d: 0, updatedAt: 0, stale: true, rateLimited: true, backoffUntil }
    }
    if (repoRes.status !== 200) {
      throw new Error(`GitHub ${repoRes.status}`)
    }

    const metrics = parseRepoMetrics(repoRes.body)
    if (metrics == null) {
      throw new Error('unexpected repo shape')
    }

    // Commit streak (best-effort — failure here doesn't fail the widget).
    let streak = metrics.streakCommits7d
    try {
      const since = new Date(Date.now() - STREAK_DAYS * 24 * 60 * 60 * 1000).toISOString()
      const commitsRes = await fetchJson(`${BASE}/repos/${owner}/${repo}/commits?per_page=100&since=${since}`, {}, signal)
      if (commitsRes.status === 200) {
        streak = parseCommitStreak(commitsRes.body) ?? 0
      }
    } catch {
      // streak stays 0 — per-metric graceful failure (D-3.16)
    }

    const data = { ...metrics, streakCommits7d: streak, owner, repo, updatedAt: Date.now() }
    const etag = repoHeaders.get('etag') ?? undefined
    const lastModified = repoHeaders.get('last-modified') ?? undefined
    writeCache(owner, repo, { data, etag, lastModified })
    return { ...data, stale: false, rateLimited: false }
  } catch {
    // Network error / unexpected shape — stale cache or graceful zero (WID-04).
    if (cached != null) {
      return { ...cached.data, owner, repo, stale: true, rateLimited: false }
    }
    return { owner, repo, stars: 0, openIssues: 0, streakCommits7d: 0, updatedAt: 0, stale: true, rateLimited: false }
  }
}

// Deduping in-flight map: one fetch per repo shared across widget instances (D-3.14).
const inFlight = new Map<string, Promise<GitHubRepoData>>()
// Session-scoped backoff: repo → until-epoch (not persisted; per-session by design).
const backoffMap = new Map<string, number>()

/** Test-only: clear module-level dedupe/backoff state between tests. */
export function __resetGitHubClient(): void {
  inFlight.clear()
  backoffMap.clear()
}

export function fetchRepoWithCache(owner: string, repo: string, signal?: AbortSignal): Promise<GitHubRepoData> {
  const key = `${owner}/${repo}`
  const existing = inFlight.get(key)
  if (existing != null) {
    return existing
  }
  const promise = fetchRepo(owner, repo, signal).finally(() => {
    inFlight.delete(key)
  })
  inFlight.set(key, promise)
  return promise
}

export interface RepoRef {
  owner: string
  repo: string
}

export function parseRepoRefs(raw: unknown): RepoRef[] {
  if (raw == null) {
    return []
  }
  const parts = typeof raw === 'string' ? raw.split(/[,\s]+/) : Array.isArray(raw) ? raw.map(String) : []
  const refs: RepoRef[] = []
  for (const part of parts) {
    const match = /^([\w.-]+)\/([\w.-]+)$/.exec(part.trim())
    if (match != null) {
      refs.push({ owner: match[1], repo: match[2] })
    }
  }
  return refs
}

/**
 * Shared hook: refreshes on mount + every 5 min (respecting backoffUntil),
 * aborts in-flight fetches on unmount, dedupes across instances.
 */
export function useGitHubRepos(refs: RepoRef[]): Record<string, GitHubRepoData | undefined> {
  const [data, setData] = useState<Record<string, GitHubRepoData | undefined>>({})
  const mountedRef = useRef(true)

  const refresh = useCallback(() => {
    const controller = new AbortController()
    const entries = refs.map((ref) => {
      const key = `${ref.owner}/${ref.repo}`
      const until = backoffMap.get(key)
      if (until != null && until > Date.now()) {
        // In backoff — show cached data, skip the fetch entirely.
        const cached = readCache(ref.owner, ref.repo)
        const base = cached?.data ?? { stars: 0, openIssues: 0, streakCommits7d: 0 }
        return Promise.resolve({ key, d: { ...base, owner: ref.owner, repo: ref.repo, updatedAt: cached?.data.updatedAt ?? 0, stale: true, rateLimited: true, backoffUntil: until } })
      }
      return fetchRepoWithCache(ref.owner, ref.repo, controller.signal)
        .then((d) => ({ key, d }))
        .catch(() => ({ key, d: undefined }))
    })
    void Promise.all(entries).then((results) => {
      if (mountedRef.current) {
        setData((prev) => {
          const next = { ...prev }
          for (const r of results) {
            if (r.d != null) {
              next[r.key] = r.d
            }
          }
          return next
        })
      }
    })
    return controller
  }, [refs])

  useEffect(() => {
    mountedRef.current = true
    const controller = refresh()
    const interval = setInterval(refresh, 5 * 60 * 1000)
    return () => {
      mountedRef.current = false
      controller.abort()
      clearInterval(interval)
    }
  }, [refresh])

  return data
}
