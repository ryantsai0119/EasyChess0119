type Listener = (line: string) => void

function engineUrl(): string {
  const base = import.meta.env.BASE_URL || '/'
  return `${base}engines/stockfish-18-lite-single.js`
}

/**
 * Thin UCI bridge around Stockfish 18 lite-single (WASM Worker).
 */
export class StockfishEngine {
  private worker: Worker | null = null
  private listeners = new Set<Listener>()
  private readyPromise: Promise<void> | null = null
  private generation = 0
  private strengthApplied = false

  async init(): Promise<void> {
    if (this.readyPromise) return this.readyPromise

    this.readyPromise = new Promise<void>((resolve, reject) => {
      try {
        this.worker = new Worker(engineUrl())
      } catch (err) {
        reject(err)
        return
      }

      let uciOk = false
      let readyOk = false

      const onMessage = (ev: MessageEvent) => {
        const raw = typeof ev.data === 'string' ? ev.data : String(ev.data)
        for (const line of raw.split('\n')) {
          const trimmed = line.trim()
          if (!trimmed) continue
          for (const listener of this.listeners) listener(trimmed)
          if (trimmed === 'uciok') {
            uciOk = true
            this.send('isready')
          }
          if (trimmed === 'readyok') {
            readyOk = true
            if (uciOk && readyOk) {
              this.worker?.removeEventListener('message', onMessage)
              this.worker?.addEventListener('message', (e: MessageEvent) => {
                const data = typeof e.data === 'string' ? e.data : String(e.data)
                for (const part of data.split('\n')) {
                  const t = part.trim()
                  if (!t) continue
                  for (const listener of this.listeners) listener(t)
                }
              })
              resolve()
            }
          }
        }
      }

      this.worker.addEventListener('message', onMessage)
      this.worker.onerror = (e) => reject(e.error ?? new Error('Stockfish worker failed'))
      this.send('uci')
    })

    return this.readyPromise
  }

  private send(cmd: string) {
    this.worker?.postMessage(cmd)
  }

  onMessage(listener: Listener): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  async setStrength(elo: number | null): Promise<void> {
    await this.init()
    if (elo == null) {
      this.send('setoption name UCI_LimitStrength value false')
    } else {
      this.send('setoption name UCI_LimitStrength value true')
      this.send(`setoption name UCI_Elo value ${elo}`)
    }
    this.strengthApplied = true
    await this.isReady()
  }

  private isReady(): Promise<void> {
    return new Promise((resolve) => {
      const off = this.onMessage((line) => {
        if (line === 'readyok') {
          off()
          resolve()
        }
      })
      this.send('isready')
    })
  }

  stop() {
    this.generation += 1
    this.send('stop')
  }

  async getBestMove(
    fen: string,
    opts: { moveTimeMs?: number; depth?: number } = {},
  ): Promise<{ bestmove: string; ponder?: string; scoreCp?: number }> {
    await this.init()
    if (!this.strengthApplied) {
      await this.setStrength(1400)
    }

    const gen = ++this.generation
    this.send('stop')
    this.send('ucinewgame')
    await this.isReady()
    this.send(`position fen ${fen}`)

    return new Promise((resolve, reject) => {
      let scoreCp: number | undefined
      const timeout = window.setTimeout(() => {
        off()
        reject(new Error('Engine timeout'))
      }, (opts.moveTimeMs ?? 1000) + 15000)

      const off = this.onMessage((line) => {
        if (gen !== this.generation) return

        if (line.startsWith('info ')) {
          const mate = / score mate (-?\d+)/.exec(line)
          const cp = / score cp (-?\d+)/.exec(line)
          if (mate) {
            const m = Number(mate[1])
            scoreCp = m > 0 ? 1000 - Math.min(m, 10) * 10 : -(1000 - Math.min(Math.abs(m), 10) * 10)
          } else if (cp) {
            scoreCp = Number(cp[1])
          }
        }

        if (line.startsWith('bestmove ')) {
          window.clearTimeout(timeout)
          off()
          if (gen !== this.generation) {
            reject(new Error('Stale search'))
            return
          }
          const parts = line.split(/\s+/)
          const bestmove = parts[1]
          const ponder = parts[2] === 'ponder' ? parts[3] : undefined
          if (!bestmove || bestmove === '(none)') {
            reject(new Error('No move'))
            return
          }
          resolve({ bestmove, ponder, scoreCp })
        }
      })

      if (opts.depth != null) {
        this.send(`go depth ${opts.depth}`)
      } else {
        this.send(`go movetime ${opts.moveTimeMs ?? 800}`)
      }
    })
  }

  /**
   * Evaluate a position (side to move). Returns centipawns from White's perspective.
   */
  async evaluate(
    fen: string,
    depth = 14,
  ): Promise<{ bestmove: string; scoreCp: number }> {
    await this.init()
    // Full strength for analysis
    this.send('setoption name UCI_LimitStrength value false')
    await this.isReady()

    const gen = ++this.generation
    this.send('stop')
    this.send(`position fen ${fen}`)

    return new Promise((resolve, reject) => {
      let scoreCp = 0
      const timeout = window.setTimeout(() => {
        off()
        reject(new Error('Eval timeout'))
      }, 30000)

      const off = this.onMessage((line) => {
        if (gen !== this.generation) return
        if (line.startsWith('info ')) {
          const mate = / score mate (-?\d+)/.exec(line)
          const cp = / score cp (-?\d+)/.exec(line)
          if (mate) {
            const m = Number(mate[1])
            scoreCp = m > 0 ? 1000 - Math.min(m, 10) * 10 : -(1000 - Math.min(Math.abs(m), 10) * 10)
          } else if (cp) {
            scoreCp = Number(cp[1])
          }
        }
        if (line.startsWith('bestmove ')) {
          window.clearTimeout(timeout)
          off()
          const bestmove = line.split(/\s+/)[1]
          // Stockfish scores are for side to move; convert to White POV
          const side = fen.split(' ')[1]
          const whiteCp = side === 'b' ? -scoreCp : scoreCp
          resolve({ bestmove, scoreCp: whiteCp })
        }
      })

      this.send(`go depth ${depth}`)
    })
  }

  dispose() {
    this.generation += 1
    try {
      this.send('quit')
    } catch {
      /* ignore */
    }
    this.worker?.terminate()
    this.worker = null
    this.readyPromise = null
    this.listeners.clear()
    this.strengthApplied = false
  }
}

let singleton: StockfishEngine | null = null

export function getEngine(): StockfishEngine {
  if (!singleton) singleton = new StockfishEngine()
  return singleton
}
