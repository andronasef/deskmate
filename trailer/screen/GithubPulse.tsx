import { interpolate, useCurrentFrame } from 'remotion'

const FROM = 545
const TO = 700

const REPOS = [
  { name: 'facebook/react', stars: [238_412, 238_509], forks: [48_910, 48_931] },
  { name: 'remotion-dev/remotion', stars: [22_048, 22_131] as const, forks: [1_182, 1_195] },
  { name: 'vitejs/vite', stars: [74_602, 74_744], forks: [6_810, 6_829] },
] as const

const count = (frame: number, from: number, to: number, delay: number) =>
  Math.round(
    interpolate(frame, [FROM + delay, TO], [from, to], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }),
  ).toLocaleString('en-US')

export const GithubPulse: React.FC<{ readonly sampleFrame?: number }> = ({
  sampleFrame,
}) => {
  const current = useCurrentFrame()
  const frame = sampleFrame ?? current

  return (
    <div className="pulse">
      {REPOS.map((repo, i) => (
        <div className="pulseRow" key={repo.name}>
          <div className="pulseRepo">{repo.name}</div>
          <div className="pulseStats glow">
            <span className="pulseStat">
              {count(frame, repo.stars[0], repo.stars[1], i * 12)}
              <span className="pulseStatLabel">stars</span>
            </span>
            <span className="pulseStat">
              {count(frame, repo.forks[0], repo.forks[1], i * 12)}
              <span className="pulseStatLabel">forks</span>
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
