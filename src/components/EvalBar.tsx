interface Props {
  /** Centipawns from White's perspective */
  scoreCp: number
  height?: number
}

export function EvalBar({ scoreCp, height = 480 }: Props) {
  // Map eval to 0–100% white share; clamp mates
  const capped = Math.max(-1000, Math.min(1000, scoreCp))
  const whitePct = 50 + (capped / 1000) * 50
  const label =
    Math.abs(scoreCp) >= 90000
      ? scoreCp > 0
        ? 'M'
        : '-M'
      : (scoreCp / 100).toFixed(1)

  return (
    <div className="eval-bar" style={{ height }} title={`Eval ${label}`}>
      <div className="eval-white" style={{ height: `${whitePct}%` }} />
      <div className="eval-label">{label}</div>
    </div>
  )
}
