import type { PlayerProfile } from '../types'

interface Props {
  profile: PlayerProfile
  ratingLabel?: string
  active?: boolean
  thinking?: boolean
  captured: string
  clockText?: string
  align?: 'top' | 'bottom'
}

export function PlayerBar({
  profile,
  ratingLabel,
  active,
  thinking,
  captured,
  clockText,
  align = 'top',
}: Props) {
  return (
    <div className={`player-bar ${align} ${active ? 'active' : ''}`}>
      <div className="player-identity">
        <div className={`avatar ${thinking ? 'thinking' : ''}`} aria-hidden>
          {profile.avatar}
        </div>
        <div className="player-meta">
          <div className="player-name">
            {profile.name}
            {ratingLabel ? <span className="rating">({ratingLabel})</span> : null}
          </div>
          <div className="captured">{captured || '\u00a0'}</div>
        </div>
      </div>
      <div className={`clock ${active ? 'running' : ''}`}>
        {thinking ? '…' : clockText ?? '—'}
      </div>
    </div>
  )
}
