// Native widget registration — side-effect module. Imported once from main.tsx.
// Each widget registers itself into WIDGET_REGISTRY (D-3.01).
import { registerWidget } from './registry.tsx'
import { ClockWidget } from './clock.tsx'
import { PomodoroWidget } from './pomodoro.tsx'
import { GitHubPulseWidget } from './githubPulse.tsx'

registerWidget('clock', {
  name: 'Clock',
  description: 'Time and date display',
  defaultSettings: { showSeconds: false, hour12: true, fontSize: 'medium' },
  settingsFields: [
    { key: 'showSeconds', label: 'Show seconds', type: 'toggle' },
    { key: 'hour12', label: '12-hour format', type: 'toggle' },
    { key: 'fontSize', label: 'Font size', type: 'select', options: ['small', 'medium', 'large'] },
  ],
  render: ({ widget, theme }) => <ClockWidget widget={widget} theme={theme} />,
})

registerWidget('pomodoro', {
  name: 'Pomodoro',
  description: 'Focus timer with audio chime',
  defaultSettings: { minutes: 25 },
  settingsFields: [{ key: 'minutes', label: 'Minutes', type: 'number', min: 1, max: 120 }],
  render: ({ widget }) => <PomodoroWidget widget={widget} />,
})

registerWidget('github-pulse', {
  name: 'GitHub Pulse',
  description: 'Stars, issues, and commit activity',
  defaultSettings: { repos: 'facebook/react' },
  settingsFields: [{ key: 'repos', label: 'Repos', type: 'text', placeholder: 'owner/repo, owner/repo' }],
  render: ({ widget }) => <GitHubPulseWidget widget={widget} />,
})
