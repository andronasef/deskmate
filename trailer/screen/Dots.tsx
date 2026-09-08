export const Dots: React.FC<{ readonly active: number; readonly count?: number }> = ({
  active,
  count = 3,
}) => (
  <div className="dots">
    {Array.from({ length: count }, (_, i) => (
      <span className="dot" key={i} data-active={i === active} />
    ))}
  </div>
)
