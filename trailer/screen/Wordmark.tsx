export const Wordmark: React.FC<{ readonly tagline?: boolean }> = ({
  tagline = true,
}) => (
  <div className="wordmark">
    <div className="wordmarkName glow">DeskMate</div>
    {tagline ? <div className="wordmarkTag">Time. Focus. Pulse.</div> : null}
  </div>
)
