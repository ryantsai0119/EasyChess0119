import { Chess } from 'chess.js'
import type { AnalyzedMove, GameReview, MoveClass } from '../types'
import type { StockfishEngine } from '../engine/stockfish'

function classify(cpl: number): MoveClass {
  if (cpl <= 20) return 'best'
  if (cpl <= 80) return 'good'
  if (cpl <= 200) return 'inaccuracy'
  if (cpl <= 500) return 'mistake'
  return 'blunder'
}

function emptyCounts(): Record<MoveClass, number> {
  return { best: 0, good: 0, inaccuracy: 0, mistake: 0, blunder: 0 }
}

/** Approximate chess.com-style accuracy from average centipawn loss. */
export function accuracyFromAcpl(acpl: number): number {
  const x = Math.max(0, acpl)
  const acc = 103.1668 * Math.exp(-0.04354 * x) - 3.1669
  return Math.max(0, Math.min(100, Math.round(acc * 10) / 10))
}

function uciToMove(uci: string): { from: string; to: string; promotion?: string } {
  const from = uci.slice(0, 2)
  const to = uci.slice(2, 4)
  const promotion = uci.length > 4 ? uci[4] : undefined
  return { from, to, promotion }
}

export async function analyzeGame(
  pgn: string,
  engine: StockfishEngine,
  opts: {
    depth?: number
    onProgress?: (done: number, total: number) => void
    signal?: { cancelled: boolean }
  } = {},
): Promise<GameReview> {
  const depth = opts.depth ?? 12
  const game = new Chess()
  game.loadPgn(pgn)
  const history = game.history({ verbose: true })

  const replay = new Chess()
  const moves: AnalyzedMove[] = []
  const whiteCpls: number[] = []
  const blackCpls: number[] = []
  const whiteCounts = emptyCounts()
  const blackCounts = emptyCounts()

  for (let i = 0; i < history.length; i++) {
    if (opts.signal?.cancelled) throw new Error('cancelled')

    const fenBefore = replay.fen()
    const color = replay.turn()
    const played = history[i]

    const evalBefore = await engine.evaluate(fenBefore, depth)
    const bestUci = evalBefore.bestmove
    let bestSan = bestUci
    try {
      const probe = new Chess(fenBefore)
      const bm = probe.move(uciToMove(bestUci))
      if (bm) bestSan = bm.san
    } catch {
      /* keep uci */
    }

    replay.move({
      from: played.from,
      to: played.to,
      promotion: played.promotion,
    })
    const fenAfter = replay.fen()
    const evalAfter = await engine.evaluate(fenAfter, depth)

    // CPL: how much the player's expected eval dropped (from their POV before move)
    const beforePlayer =
      color === 'w' ? evalBefore.scoreCp : -evalBefore.scoreCp
    const afterPlayer = color === 'w' ? evalAfter.scoreCp : -evalAfter.scoreCp
    const cpl = Math.max(0, beforePlayer - afterPlayer)
    const classification = classify(cpl)

    const analyzed: AnalyzedMove = {
      ply: i + 1,
      san: played.san,
      uci: played.from + played.to + (played.promotion ?? ''),
      fenBefore,
      fenAfter,
      bestUci,
      bestSan,
      evalBeforeCp: evalBefore.scoreCp,
      evalAfterCp: evalAfter.scoreCp,
      cpl: Math.round(cpl),
      classification,
      color,
    }
    moves.push(analyzed)

    if (color === 'w') {
      whiteCpls.push(cpl)
      whiteCounts[classification] += 1
    } else {
      blackCpls.push(cpl)
      blackCounts[classification] += 1
    }

    opts.onProgress?.(i + 1, history.length)
  }

  const avg = (arr: number[]) =>
    arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0

  return {
    moves,
    whiteAccuracy: accuracyFromAcpl(avg(whiteCpls)),
    blackAccuracy: accuracyFromAcpl(avg(blackCpls)),
    whiteCounts,
    blackCounts,
  }
}

export const CLASS_LABELS: Record<MoveClass, string> = {
  best: 'Best',
  good: 'Good',
  inaccuracy: 'Inaccuracy',
  mistake: 'Mistake',
  blunder: 'Blunder',
}

export const CLASS_COLORS: Record<MoveClass, string> = {
  best: '#81b64c',
  good: '#a3d160',
  inaccuracy: '#f7c631',
  mistake: '#e6912c',
  blunder: '#ca3431',
}
