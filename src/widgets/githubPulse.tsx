import { Flame, GitBranch, Star } from 'lucide-react'
import { useEffect, useMemo } from 'react'
import type { WidgetInstance } from '../config/types.ts'
import { parseRepoRefs, useGitHubRepos, type GitHubRepoData } from './github.ts'
import { reportGitHubState } from '../kiosk/statusStore.ts'
import styles from './githubPulse.module.css'

interface GitHubPulseWidgetProps {
  widget: WidgetInstance
}

function formatTime(epochMs: number): string {
  if (epochMs <= 0) {
    return ''
  }
  return new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' }).format(epochMs)
}

function RepoRow({ data }: { data: GitHubRepoData }) {
  return (
    <div className={styles.repo}>
      <div className={styles.repoName} title={`${data.owner}/${data.repo}`}>
        {data.owner}/{data.repo}
      </div>
      <div className={styles.metrics}>
        <span className={styles.metric} title="Stars">
          <Star size={14} className={styles.starIcon} />
          {data.stars > 0 ? data.stars.toLocaleString() : '—'}
        </span>
        <span className={styles.metric} title="Open issues">
          <GitBranch size={14} />
          {data.openIssues > 0 ? data.openIssues.toLocaleString() : '—'}
        </span>
        <span className={styles.metric} title="Commit days (7d)">
          <Flame size={14} className={styles.streakIcon} />
          {data.streakCommits7d > 0 ? data.streakCommits7d : '—'}
        </span>
      </div>
    </div>
  )
}

export function GitHubPulseWidget({ widget }: GitHubPulseWidgetProps) {
  // Stable refs across renders (parseRepoRefs returns a new array each call — memoize
  // so useGitHubRepos' effect doesn't abort/refetch on every render).
  const refs = useMemo(() => parseRepoRefs(widget.settings.repos), [widget.settings.repos])
  const repos = useGitHubRepos(refs)

  // Aggregate GitHub health for the global status footer (KIOSK-04, D-5.11).
  useEffect(() => {
    const values = Object.values(repos)
    const anyStale = values.some((d) => d?.stale === true)
    const anyRateLimited = values.some((d) => d?.rateLimited === true)
    reportGitHubState(anyStale, anyRateLimited)
  }, [repos])

  const entries = Object.entries(repos)
  const anyRateLimited = entries.some(([, d]) => d?.rateLimited === true)
  const anyData = entries.some(([, d]) => d != null && d.updatedAt > 0)
  const newestUpdate = entries.reduce((max, [, d]) => Math.max(max, d?.updatedAt ?? 0), 0)

  return (
    <div className={styles.root}>
      {entries.length === 0 && (
        <div className={styles.empty}>
          <p>No repos configured</p>
          <p className={styles.hint}>Add owner/repo entries in widget settings.</p>
        </div>
      )}
      {entries.length > 0 && !anyData && (
        <div className={styles.empty}>
          <p>No data yet</p>
          <p className={styles.hint}>Waiting for GitHub…</p>
        </div>
      )}
      {entries.map(([key, d]) => (d != null ? <RepoRow key={key} data={d} /> : null))}
      <div className={styles.footer}>
        {anyData ? (
          <span>
            Updated {formatTime(newestUpdate)}
            {anyRateLimited && <span className={styles.warning}> · Rate limited — showing cached data</span>}
          </span>
        ) : (
          <span>No data yet</span>
        )}
      </div>
    </div>
  )
}
