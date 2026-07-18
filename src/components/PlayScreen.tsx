import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Chess, type Square } from 'chess.js'
import { Chessboard } from 'react-chessboard'
import { getDifficulty } from '../difficulty'
import { getEngine } from '../engine/stockfish'
import type { GameSetup } from '../types'
import { EvalBar } from './EvalBar'
import { MoveList } from './MoveList'
import { PlayerBar } from './PlayerBar'

const PIECE_SYMBOLS: Record<string, string> = {
  p: '♟',
  n: '♞',
  b: '♝',
  r: '♜',
  q: '♛',
  P: '♙',
  N: '♘',
  B: '♗',
  R: '♖',
  Q: '♕',
}

interface Props {
  setup: GameSetup
  onExit: () => void
  onReview: (pgn: string) => void
}

function capturedText(game: Chess, viewer: 'w' | 'b'): string {
  const start: Record<string, number> = { p: 8, n: 2, b: 2, r: 2, q: 1 }
  const opp = viewer === 'w' ? 'b' : 'w'
  const parts: string[] = []
  for (const t of ['q', 'r', 'b', 'n', 'p']) {
    let left = 0
    for (const row of game.board()) {
      for (const piece of row) {
        if (piece && piece.color === opp && piece.type === t) left++
      }
    }
    const captured = start[t] - left
    const sym = viewer === 'w' ? PIECE_SYMBOLS[t] : PIECE_SYMBOLS[t.toUpperCase()]
    for (let i = 0; i < captured; i++) parts.push(sym)
  }
  return parts.join('')
}

export function PlayScreen({ setup, onExit, onReview }: Props) {
  const gameRef = useRef(new Chess())
  const [fen, setFen] = useState(() => gameRef.current.fen())
  const [orientation, setOrientation] = useState<'white' | 'black'>(() => {
    if (setup.mode === 'ai') {
      return setup.white.name.startsWith('Stockfish') ? 'black' : 'white'
    }
    return 'white'
  })
  const [thinking, setThinking] = useState(false)
  const [status, setStatus] = useState('白方走棋')
  const [evalCp, setEvalCp] = useState(0)
  const [selected, setSelected] = useState<Square | null>(null)
  const [optionSquares, setOptionSquares] = useState<
    Record<string, React.CSSProperties>
  >({})
  const [boardWidth, setBoardWidth] = useState(480)
  const [resigned, setResigned] = useState<'w' | 'b' | null>(null)
  const [moveVersion, setMoveVersion] = useState(0)
  const genRef = useRef(0)

  const aiColor = useMemo(() => {
    if (setup.mode !== 'ai') return null
    return setup.white.name.startsWith('Stockfish') ? 'w' : 'b'
  }, [setup])

  const humanColor = aiColor === 'w' ? 'b' : aiColor === 'b' ? 'w' : null
  const difficulty = getDifficulty(setup.difficulty)

  useEffect(() => {
    const update = () => {
      const w = Math.min(560, Math.max(280, window.innerWidth - 48))
      const side =
        window.innerWidth >= 900 ? Math.min(520, window.innerHeight - 220) : w
      setBoardWidth(Math.floor(side))
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  const sync = useCallback(() => {
    const g = gameRef.current
    setFen(g.fen())
    setMoveVersion((v) => v + 1)
    if (g.isCheckmate()) {
      setStatus(`將死 · ${g.turn() === 'w' ? '黑' : '白'}方勝`)
    } else if (g.isDraw()) {
      setStatus('和棋')
    } else if (g.isCheck()) {
      setStatus('將軍！')
    } else {
      setStatus(g.turn() === 'w' ? '白方走棋' : '黑方走棋')
    }
  }, [])

  const historySans = useMemo(
    () => gameRef.current.history(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [moveVersion],
  )

  const gameOver =
    resigned != null ||
    gameRef.current.isCheckmate() ||
    gameRef.current.isDraw()

  const tryMove = useCallback(
    (from: Square, to: Square, promotion?: string) => {
      const g = gameRef.current
      if (gameOver || resigned) return false
      if (setup.mode === 'ai' && humanColor && g.turn() !== humanColor) return false
      if (thinking) return false

      try {
        const move = g.move({
          from,
          to,
          promotion: promotion ?? 'q',
        })
        if (!move) return false
        setSelected(null)
        setOptionSquares({})
        sync()
        if (setup.mode === 'local2p' && setup.flipBoardEachMove) {
          setOrientation((o) => (o === 'white' ? 'black' : 'white'))
        }
        return true
      } catch {
        return false
      }
    },
    [gameOver, humanColor, resigned, setup, sync, thinking],
  )

  useEffect(() => {
    const g = gameRef.current
    if (setup.mode !== 'ai' || !aiColor) return
    if (gameOver || resigned) return
    if (g.turn() !== aiColor) return

    const myGen = ++genRef.current
    let cancelled = false
    setThinking(true)

    ;(async () => {
      try {
        const engine = getEngine()
        await engine.setStrength(difficulty.elo)
        const { bestmove, scoreCp } = await engine.getBestMove(g.fen(), {
          moveTimeMs: difficulty.moveTimeMs,
        })
        if (cancelled || myGen !== genRef.current) return
        if (scoreCp != null) {
          const side = g.turn()
          setEvalCp(side === 'b' ? -scoreCp : scoreCp)
        }
        const from = bestmove.slice(0, 2) as Square
        const to = bestmove.slice(2, 4) as Square
        const promotion = bestmove.length > 4 ? bestmove[4] : undefined
        g.move({ from, to, promotion })
        sync()
      } catch (err) {
        if (!cancelled) {
          console.error(err)
          setStatus('引擎出錯，請重試')
        }
      } finally {
        if (!cancelled) setThinking(false)
      }
    })()

    return () => {
      cancelled = true
      getEngine().stop()
    }
  }, [aiColor, difficulty, fen, gameOver, resigned, setup.mode, sync])

  const onPieceDrop = (source: string, target: string) =>
    tryMove(source as Square, target as Square)

  const onSquareClick = (square: Square) => {
    const g = gameRef.current
    if (thinking || gameOver) return
    if (setup.mode === 'ai' && humanColor && g.turn() !== humanColor) return

    if (selected) {
      if (selected === square) {
        setSelected(null)
        setOptionSquares({})
        return
      }
      if (tryMove(selected, square)) return
    }

    const piece = g.get(square)
    if (piece && piece.color === g.turn()) {
      setSelected(square)
      const moves = g.moves({ square, verbose: true })
      const styles: Record<string, React.CSSProperties> = {
        [square]: { background: 'rgba(255, 255, 0, 0.35)' },
      }
      for (const m of moves) {
        styles[m.to] = {
          background: g.get(m.to)
            ? 'radial-gradient(circle, rgba(0,0,0,.25) 60%, transparent 62%)'
            : 'radial-gradient(circle, rgba(0,0,0,.18) 22%, transparent 24%)',
        }
      }
      setOptionSquares(styles)
    } else {
      setSelected(null)
      setOptionSquares({})
    }
  }

  const undo = () => {
    getEngine().stop()
    genRef.current++
    setThinking(false)
    setResigned(null)
    const g = gameRef.current
    g.undo()
    if (setup.mode === 'ai') g.undo()
    setSelected(null)
    setOptionSquares({})
    sync()
  }

  const resign = () => {
    if (gameOver) return
    getEngine().stop()
    setThinking(false)
    const side = gameRef.current.turn()
    setResigned(side)
    setStatus(`${side === 'w' ? '白' : '黑'}方認輸`)
  }

  const last = gameRef.current.history({ verbose: true }).slice(-1)[0]
  const customSquareStyles: Record<string, React.CSSProperties> = {
    ...optionSquares,
  }
  if (last) {
    customSquareStyles[last.from] = {
      ...(customSquareStyles[last.from] || {}),
      background: 'rgba(155, 199, 0, 0.35)',
    }
    customSquareStyles[last.to] = {
      ...(customSquareStyles[last.to] || {}),
      background: 'rgba(155, 199, 0, 0.55)',
    }
  }

  const whiteActive = !gameOver && gameRef.current.turn() === 'w'
  const blackActive = !gameOver && gameRef.current.turn() === 'b'
  const topIsBlack = orientation === 'white'
  const displayStatus = resigned
    ? `${resigned === 'w' ? '白' : '黑'}方認輸`
    : status

  return (
    <div className="play">
      <aside className="side-panel">
        <div className="side-header">
          <button type="button" className="ghost" onClick={onExit}>
            ← 選單
          </button>
          <h2>{setup.mode === 'ai' ? 'vs 電腦' : '本地雙打'}</h2>
        </div>
        <div className="status-line">{displayStatus}</div>
        <MoveList moves={historySans.map((san) => ({ san }))} />
        <div className="actions">
          <button
            type="button"
            onClick={undo}
            disabled={thinking || historySans.length === 0}
          >
            悔棋
          </button>
          <button
            type="button"
            onClick={() =>
              setOrientation((o) => (o === 'white' ? 'black' : 'white'))
            }
          >
            翻轉
          </button>
          <button type="button" onClick={resign} disabled={gameOver}>
            認輸
          </button>
          {gameOver ? (
            <button
              type="button"
              className="primary"
              onClick={() => onReview(gameRef.current.pgn())}
            >
              分析此局
            </button>
          ) : null}
        </div>
      </aside>

      <main className="board-area">
        <PlayerBar
          profile={topIsBlack ? setup.black : setup.white}
          ratingLabel={
            setup.mode === 'ai' &&
            (topIsBlack ? aiColor === 'b' : aiColor === 'w')
              ? difficulty.elo
                ? String(difficulty.elo)
                : 'Max'
              : undefined
          }
          active={topIsBlack ? blackActive : whiteActive}
          thinking={
            thinking &&
            ((topIsBlack && aiColor === 'b') || (!topIsBlack && aiColor === 'w'))
          }
          captured={capturedText(gameRef.current, topIsBlack ? 'b' : 'w')}
          clockText={
            thinking &&
            ((topIsBlack && aiColor === 'b') || (!topIsBlack && aiColor === 'w'))
              ? '思考中'
              : '∞'
          }
          align="top"
        />

        <div className="board-row">
          <EvalBar scoreCp={evalCp} height={boardWidth} />
          <div className="board-wrap" style={{ width: boardWidth }}>
            <Chessboard
              position={fen}
              onPieceDrop={onPieceDrop}
              onSquareClick={onSquareClick}
              boardOrientation={orientation}
              boardWidth={boardWidth}
              customSquareStyles={customSquareStyles}
              arePiecesDraggable={!thinking && !gameOver}
              customDarkSquareStyle={{ backgroundColor: '#769656' }}
              customLightSquareStyle={{ backgroundColor: '#eeeed2' }}
              animationDuration={200}
            />
          </div>
        </div>

        <PlayerBar
          profile={topIsBlack ? setup.white : setup.black}
          ratingLabel={
            setup.mode === 'ai' &&
            (topIsBlack ? aiColor === 'w' : aiColor === 'b')
              ? difficulty.elo
                ? String(difficulty.elo)
                : 'Max'
              : undefined
          }
          active={topIsBlack ? whiteActive : blackActive}
          thinking={
            thinking &&
            ((topIsBlack && aiColor === 'w') || (!topIsBlack && aiColor === 'b'))
          }
          captured={capturedText(gameRef.current, topIsBlack ? 'w' : 'b')}
          clockText={
            thinking &&
            ((topIsBlack && aiColor === 'w') || (!topIsBlack && aiColor === 'b'))
              ? '思考中'
              : '∞'
          }
          align="bottom"
        />
      </main>
    </div>
  )
}
