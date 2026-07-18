import { useState } from 'react'
import { DIFFICULTIES, PLAYER_AVATARS } from '../difficulty'
import type { DifficultyId, GameMode, GameSetup, PlayerColor } from '../types'

interface Props {
  engineReady: boolean
  engineError: string | null
  onStart: (setup: GameSetup) => void
}

export function HomeScreen({ engineReady, engineError, onStart }: Props) {
  const [mode, setMode] = useState<GameMode>('ai')
  const [difficulty, setDifficulty] = useState<DifficultyId>('normal')
  const [playerColor, setPlayerColor] = useState<PlayerColor>('w')
  const [youName, setYouName] = useState('You')
  const [youAvatar, setYouAvatar] = useState(PLAYER_AVATARS[0])
  const [oppName, setOppName] = useState('Player 2')
  const [oppAvatar, setOppAvatar] = useState(PLAYER_AVATARS[1])
  const [flipBoardEachMove, setFlipBoardEachMove] = useState(false)

  const ai = DIFFICULTIES.find((d) => d.id === difficulty)!

  const start = () => {
    const resolvedColor =
      playerColor === 'random' ? (Math.random() < 0.5 ? 'w' : 'b') : playerColor

    if (mode === 'ai') {
      const human = { name: youName || 'You', avatar: youAvatar }
      const computer = {
        name: `Stockfish · ${ai.labelZh}`,
        avatar: ai.avatar,
      }
      onStart({
        mode,
        difficulty,
        playerColor: resolvedColor,
        white: resolvedColor === 'w' ? human : computer,
        black: resolvedColor === 'w' ? computer : human,
        flipBoardEachMove: false,
      })
    } else {
      onStart({
        mode,
        difficulty,
        playerColor: 'w',
        white: { name: youName || '白方', avatar: youAvatar },
        black: { name: oppName || '黑方', avatar: oppAvatar },
        flipBoardEachMove,
      })
    }
  }

  return (
    <div className="home">
      <header className="home-hero">
        <div className="brand">EasyChess</div>
        <p className="tagline">Stockfish 18 · 本地對戰與對局分析</p>
      </header>

      <div className="home-card">
        <h2>開始對局</h2>

        <div className="mode-toggle">
          <button
            type="button"
            className={mode === 'ai' ? 'active' : ''}
            onClick={() => setMode('ai')}
          >
            vs 電腦
          </button>
          <button
            type="button"
            className={mode === 'local2p' ? 'active' : ''}
            onClick={() => setMode('local2p')}
          >
            本地雙打
          </button>
        </div>

        {mode === 'ai' ? (
          <>
            <label className="field">
              <span>難度</span>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as DifficultyId)}
              >
                {DIFFICULTIES.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.avatar} {d.labelZh} ({d.label}
                    {d.elo ? ` · Elo ${d.elo}` : ' · Max'})
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>你執</span>
              <select
                value={playerColor}
                onChange={(e) => setPlayerColor(e.target.value as PlayerColor)}
              >
                <option value="w">白棋</option>
                <option value="b">黑棋</option>
                <option value="random">隨機</option>
              </select>
            </label>
          </>
        ) : (
          <label className="field checkbox">
            <input
              type="checkbox"
              checked={flipBoardEachMove}
              onChange={(e) => setFlipBoardEachMove(e.target.checked)}
            />
            <span>每手翻轉棋盤（對面坐）</span>
          </label>
        )}

        <div className="profiles">
          <div className="profile-edit">
            <span className="label">{mode === 'ai' ? '你的頭像' : '白方'}</span>
            <input
              value={youName}
              onChange={(e) => setYouName(e.target.value)}
              maxLength={16}
            />
            <div className="avatar-pick">
              {PLAYER_AVATARS.map((a) => (
                <button
                  key={a}
                  type="button"
                  className={youAvatar === a ? 'selected' : ''}
                  onClick={() => setYouAvatar(a)}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          {mode === 'local2p' ? (
            <div className="profile-edit">
              <span className="label">黑方</span>
              <input
                value={oppName}
                onChange={(e) => setOppName(e.target.value)}
                maxLength={16}
              />
              <div className="avatar-pick">
                {PLAYER_AVATARS.map((a) => (
                  <button
                    key={a}
                    type="button"
                    className={oppAvatar === a ? 'selected' : ''}
                    onClick={() => setOppAvatar(a)}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="profile-edit ai-preview">
              <span className="label">對手</span>
              <div className="ai-chip">
                <span className="big-avatar">{ai.avatar}</span>
                <div>
                  <strong>{ai.labelZh}</strong>
                  <div className="muted">{ai.tag}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {engineError ? (
          <div className="banner error">引擎載入失敗：{engineError}</div>
        ) : (
          <div className={`banner ${engineReady ? 'ok' : ''}`}>
            {engineReady ? 'Stockfish 18 已就緒' : '正在載入 Stockfish 18…'}
          </div>
        )}

        <button
          type="button"
          className="primary start-btn"
          disabled={!engineReady && mode === 'ai'}
          onClick={start}
        >
          開始遊戲
        </button>
        {mode === 'local2p' ? (
          <p className="hint">雙打不需等待引擎；終局仍可分析。</p>
        ) : null}
      </div>
    </div>
  )
}
