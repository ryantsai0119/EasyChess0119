import type { MoveClass } from '../types'
import { CLASS_COLORS } from '../analysis/classify'

interface MoveRow {
  san: string
  classification?: MoveClass
}

interface Props {
  moves: { san: string; classification?: MoveClass }[]
  selectedPly?: number
  onSelectPly?: (ply: number) => void
}

export function MoveList({ moves, selectedPly, onSelectPly }: Props) {
  const rows: { num: number; w?: MoveRow; b?: MoveRow }[] = []
  for (let i = 0; i < moves.length; i += 2) {
    rows.push({
      num: Math.floor(i / 2) + 1,
      w: moves[i],
      b: moves[i + 1],
    })
  }

  return (
    <div className="move-list">
      {rows.length === 0 ? (
        <div className="muted">尚無著法</div>
      ) : (
        rows.map((row) => (
          <div className="move-row" key={row.num}>
            <span className="move-num">{row.num}.</span>
            {row.w ? (
              <button
                type="button"
                className={`move-san ${selectedPly === row.num * 2 - 1 ? 'selected' : ''}`}
                style={
                  row.w.classification
                    ? { borderBottomColor: CLASS_COLORS[row.w.classification] }
                    : undefined
                }
                onClick={() => onSelectPly?.(row.num * 2 - 1)}
              >
                {row.w.san}
              </button>
            ) : (
              <span className="move-san empty" />
            )}
            {row.b ? (
              <button
                type="button"
                className={`move-san ${selectedPly === row.num * 2 ? 'selected' : ''}`}
                style={
                  row.b.classification
                    ? { borderBottomColor: CLASS_COLORS[row.b.classification] }
                    : undefined
                }
                onClick={() => onSelectPly?.(row.num * 2)}
              >
                {row.b.san}
              </button>
            ) : (
              <span className="move-san empty" />
            )}
          </div>
        ))
      )}
    </div>
  )
}
