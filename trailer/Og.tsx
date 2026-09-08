import './og.css'

/**
 * Social preview card — 1200x630, rendered to public/og.png with
 * `bun run og`. Same LED/bezel language as the app and the trailer.
 */
export const Og: React.FC = () => (
  <div className="ogRoot">
    <div className="ogGrid" />
    <div className="ogPanel">
      <div className="ogName glow">DeskMate</div>
      <div className="ogTag">Time. Focus. Pulse.</div>
      <div className="ogDots">
        <span className="ogDot" />
        <span className="ogDot" data-active="true" />
        <span className="ogDot" />
      </div>
    </div>
  </div>
)
