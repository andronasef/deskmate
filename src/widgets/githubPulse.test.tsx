import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { __resetGitHubClient, fetchRepoWithCache, parseRepoRefs } from './github.ts'
import { GitHubPulseWidget } from './githubPulse.tsx'
import type { WidgetInstance } from '../config/types.ts'

function makeWidget(settings: Record<string, unknown>): WidgetInstance {
  return { id: 'w1', type: 'github-pulse', settings }
}

function mockRepoResponse(status = 200, headers: Record<string, string> = {}) {
  const okBody = { stargazers_count: 10_000, open_issues_count: 25 }
  return { status, headers: new Headers(headers), body: okBody, json: () => Promise.resolve(okBody) }
}

const okFetch = vi.fn()

beforeEach(() => {
  localStorage.clear()
  __resetGitHubClient()
  vi.restoreAllMocks()
  okFetch.mockReset()
  okFetch.mockImplementation((url: string) => {
    if (url.includes('/commits')) {
      return Promise.resolve({
        status: 200,
        headers: new Headers(),
        json: () =>
          Promise.resolve([
            { commit: { author: { date: '2026-08-16T10:00:00Z' } } },
            { commit: { author: { date: '2026-08-15T10:00:00Z' } } },
            { commit: { author: { date: '2026-08-14T10:00:00Z' } } },
          ]),
      })
    }
    return Promise.resolve(mockRepoResponse(200, { etag: '"abc123"' }))
  })
  vi.stubGlobal('fetch', okFetch)
})

afterEach(() => {
  vi.unstubAllGlobals()
  cleanup()
})

describe('parseRepoRefs', () => {
  it('parses comma/space-separated owner/repo entries and drops invalid ones', () => {
    expect(parseRepoRefs('facebook/react, vuejs/core github/octocat')).toEqual([
      { owner: 'facebook', repo: 'react' },
      { owner: 'vuejs', repo: 'core' },
      { owner: 'github', repo: 'octocat' },
    ])
    expect(parseRepoRefs('not-a-repo, owner/repo')).toHaveLength(1)
    expect(parseRepoRefs(null)).toEqual([])
  })
})

describe('fetchRepoWithCache (D-3.14)', () => {
  it('fetches repo + commit-streak data and caches it', async () => {
    const data = await fetchRepoWithCache('facebook', 'react')
    expect(data.stars).toBe(10_000)
    expect(data.openIssues).toBe(25)
    expect(data.streakCommits7d).toBe(3)
    expect(data.rateLimited).toBe(false)
    expect(data.stale).toBe(false)
    expect(localStorage.getItem('deskmate.github.facebook/react')).toContain('"stars":10000')
    expect(localStorage.getItem('deskmate.github.facebook/react')).toContain('"etag"')
  })

  it('304 (ETag match) reuses the cached body', async () => {
    await fetchRepoWithCache('facebook', 'react')
    okFetch.mockImplementation((url: string) => {
      if (url.includes('/commits')) {
        return Promise.resolve({ status: 200, headers: new Headers(), json: () => Promise.resolve([]) })
      }
      return Promise.resolve(mockRepoResponse(304))
    })
    const data = await fetchRepoWithCache('facebook', 'react')
    expect(data.stars).toBe(10_000) // from cache
  })

  it('403 rate limit → rateLimited + backoff ≥ 3 min + stale data', async () => {
    await fetchRepoWithCache('facebook', 'react')
    okFetch.mockImplementation((url: string) => {
      if (url.includes('/commits')) {
        return Promise.resolve({ status: 200, headers: new Headers(), json: () => Promise.resolve([]) })
      }
      return Promise.resolve(mockRepoResponse(403, { 'x-ratelimit-remaining': '0', 'x-ratelimit-reset': '9999999999' }))
    })
    const data = await fetchRepoWithCache('facebook', 'react')
    expect(data.rateLimited).toBe(true)
    expect(data.stale).toBe(true)
    expect(data.stars).toBe(10_000) // stale cache served
    expect(data.backoffUntil! - Date.now()).toBeGreaterThanOrEqual(3 * 60 * 1000)
  })

  it('network error → stale cache with stale=true (never throws)', async () => {
    await fetchRepoWithCache('facebook', 'react')
    okFetch.mockRejectedValue(new TypeError('Failed to fetch'))
    const data = await fetchRepoWithCache('facebook', 'react')
    expect(data.stale).toBe(true)
    expect(data.rateLimited).toBe(false)
    expect(data.stars).toBe(10_000)
  })

  it('no cache + network error → graceful zero-data object (never throws)', async () => {
    okFetch.mockRejectedValue(new TypeError('Failed to fetch'))
    const data = await fetchRepoWithCache('unknown', 'repo')
    expect(data.stars).toBe(0)
    expect(data.stale).toBe(true)
  })
})

describe('GitHubPulseWidget (WID-03/04)', () => {
  it('renders stars, open issues, and streak for a configured repo', async () => {
    render(<GitHubPulseWidget widget={makeWidget({ repos: 'facebook/react' })} />)
    await screen.findByText('facebook/react')
    expect(await screen.findByText('10,000')).toBeInTheDocument()
    expect(screen.getByText('25')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText(/Updated/)).toBeInTheDocument()
  })

  it('rate-limited: renders stale values with the rate-limit indicator, never a broken UI', async () => {
    await fetchRepoWithCache('facebook', 'react') // prime cache
    okFetch.mockImplementation((url: string) => {
      if (url.includes('/commits')) {
        return Promise.resolve({ status: 200, headers: new Headers(), json: () => Promise.resolve([]) })
      }
      return Promise.resolve(mockRepoResponse(403, { 'x-ratelimit-remaining': '0', 'x-ratelimit-reset': '9999999999' }))
    })
    render(<GitHubPulseWidget widget={makeWidget({ repos: 'facebook/react' })} />)
    await screen.findByText('facebook/react')
    expect(await screen.findByText(/Rate limited — showing cached data/)).toBeInTheDocument()
    expect(screen.getByText('10,000')).toBeInTheDocument() // stale data still rendered
  })

  it('no data yet: shows the waiting state', async () => {
    okFetch.mockRejectedValue(new TypeError('Failed to fetch'))
    render(<GitHubPulseWidget widget={makeWidget({ repos: 'facebook/react' })} />)
    expect(await screen.findByText('No data yet')).toBeInTheDocument()
  })

  it('empty repos: shows the no-repos state', () => {
    render(<GitHubPulseWidget widget={makeWidget({ repos: '' })} />)
    expect(screen.getByText('No repos configured')).toBeInTheDocument()
  })
})
