import { useEffect, useMemo, useRef, useState } from 'react'
import { Chess } from 'chess.js'
import { Chessboard } from 'react-chessboard'
import {
  analyzeGame,
  CLASS_COLORS,
  CLASS_LABELS,
} from '../analysis/classify'
import { getEngine } from '../engine/stockfish'
import type { AnalyzedMove, GameReview, GameSetup, MoveClass } from '../types'
import { EvalBar } from './EvalBar'
import { MoveList } from './MoveList'
import { PlayerBar } from './PlayerBar'

interface Props {
  pgn: string
  setup: GameSetup
  onBack: () => void
  onHome: () => void
}

export function ReviewScreen({ pgn, setup, onBack, onHome }: Props) {
  const [review, setReview] = useState<GameReview | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState({ done: 0, total: 1 })
  const [ply, setPly] = useState(0)
  const [boardWidth, setBoardWidth] = useState(440)
  const cancelRef = useRef({ cancelled: false })

  useEffect(() => {
    const update = () => {
      const w = Math.min(520, Math.max(260, window.innerWidth - 48))
      setBoardWidth(window.innerWidth >= 900 ? Math.min(480, window.innerHeight - 240) : w)
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  useEffect(() => {
    cancelRef.current = { cancelled: false }
    setReview(null)
    setError(null)
    ;(async () => {
      try {
        const engine = getEngine()
        await engine.init()
        const result = await analyzeGame(pgn, engine, {
          depth: 12,
          signal: cancelRef.current,
          onProgress: (done, total) => setProgress({ done, total }),
        })
        setReview(result)
        setPly(result.moves.length)
      } catch (e) {
        if ((e as Error).message !== 'cancelled') {
          setError((e as Error).message || '分析失敗')
        }
      }
    })()
    return () => {
      cancelRef.current.cancelled = true
      getEngine().stop()
    }
  }, [pgn])

  const currentFen = useMemo(() => {
    if (!review || ply <= 0) {
      const g = new Chess()
      try {
        g.loadPgn(pgn)
        const start = new Chess()
        return start.fen()
      } catch {
        return new Chess().fen()
      }
    }
    return review.moves[ply - 1].fenAfter
  }, [pgn, ply, review])

  const currentMove: AnalyzedMove | null =
    review && ply > 0 ? review.moves[ply - 1] : null

  const evalCp = currentMove?.evalAfterCp ?? review?.moves[0]?.evalBeforeCp ?? 0

  const moveList = (review?.moves ?? []).map((m) => ({
    san: m.san,
    classification: m.classification,
  }))

  const countBlock = (counts: Record<MoveClass, number>) =>
    (Object.keys(CLASS_LABELS) as MoveClass[]).map((k) => (
      <div key={k} className="count-item">
        <span style={{ color: CLASS_COLORS[k] }}>{CLASS_LABELS[k]}</span>
        <strong>{counts[k]}</strong>
      </div>
    ))

  return (
    <div className="review">
      <aside className="side-panel">
        <div className="side-header">
          <button type="button" className="ghost" onClick={onBack}>
            ← 回對局
          </button>
          <h2>Game Review</h2>
        </div>

        {!review && !error ? (
          <div className="analyze-progress">
            <div className="muted">
              分析中 {progress.done}/{progress.total}
            </div>
            <div className="bar">
              <div
                style={{
                  width: `${(progress.done / Math.max(1, progress.total)) * 100}%`,
                }}
              />
            </div>
            <p className="hint">使用 Stockfish 18 深度 12，請稍候…</p>
          </div>
        ) : null}

        {error ? <div className="banner error">{error}</div> : null}

        {review ? (
          <>
            <div className="accuracy-row">
              <div className="acc-card">
                <div className="acc-label">{setup.white.name}</div>
                <div className="acc-value">{review.whiteAccuracy}%</div>
              </div>
              <div className="acc-card">
                <div className="acc-label">{setup.black.name}</div>
                <div className="acc-value">{review.blackAccuracy}%</div>
              </div>
            </div>

            <div className="eval-chart">
              {review.moves.map((m) => {
                const h = Math.max(4, Math.min(96, 50 + m.evalAfterCp / 40))
                return (
                  <button
                    key={m.ply}
                    type="button"
                    className={`chart-bar ${ply === m.ply ? 'active' : ''}`}
                    style={{ height: `${h}%` }}
                    title={`${m.san} · ${CLASS_LABELS[m.classification]}`}
                    onClick={() => setPly(m.ply)}
                  />
                )
              })}
            </div>

            <MoveList
              moves={moveList}
              selectedPly={ply}
              onSelectPly={setPly}
            />

            {currentMove ? (
              <div className="move-detail">
                <div
                  className="class-pill"
                  style={{ background: CLASS_COLORS[currentMove.classification] }}
                >
                  {CLASS_LABELS[currentMove.classification]}
                </div>
                <div>
                  著法 <strong>{currentMove.san}</strong> · CPL {currentMove.cpl}
                </div>
                {currentMove.uci !== currentMove.bestUci ? (
                  <div className="muted">
                    較佳著：{currentMove.bestSan} ({currentMove.bestUci})
                  </div>
                ) : (
                  <div className="muted">與引擎首選相同</div>
                )}
              </div>
            ) : null}

            <details className="counts">
              <summary>分類統計</summary>
              <div className="counts-grid">
                <div>
                  <h4>白方</h4>
                  {countBlock(review.whiteCounts)}
                </div>
                <div>
                  <h4>黑方</h4>
                  {countBlock(review.blackCounts)}
                </div>
              </div>
            </details>
          </>
        ) : null}

        <div className="actions">
          <button type="button" className="primary" onClick={onHome}>
            新對局
          </button>
        </div>
      </aside>

      <main className="board-area">
        <PlayerBar profile={setup.black} captured="" align="top" />
        <div className="board-row">
          <EvalBar scoreCp={evalCp} height={boardWidth} />
          <div className="board-wrap" style={{ width: boardWidth }}>
            <Chessboard
              position={currentFen}
              boardWidth={boardWidth}
              arePiecesDraggable={false}
              customDarkSquareStyle={{ backgroundColor: '#769656' }}
              customLightSquareStyle={{ backgroundColor: '#eeeed2' }}
            />
          </div>
        </div>
        <PlayerBar profile={setup.white} captured="" align="bottom" />
        <div className="review-nav">
          <button type="button" onClick={() => setPly(0)} disabled={ply === 0}>
            |&lt;
          </button>
          <button
            type="button"
            onClick={() => setPly((p) => Math.max(0, p - 1))}
            disabled={ply === 0}
          >
            &lt;
          </button>
          <span>
            {ply}/{review?.moves.length ?? 0}
          </span>
          <button
            type="button"
            onClick={() =>
              setPly((p) => Math.min(review?.moves.length ?? 0, p + 1))
            }
            disabled={!review || ply >= review.moves.length}
          >
            &gt;
          </button>
          <button
            type="button"
            onClick={() => setPly(review?.moves.length ?? 0)}
            disabled={!review || ply >= review.moves.length}
          >
            &gt;|
          </button>
        </div>
      </main>
    </div>
  )
}
