export type GameMode = 'ai' | 'local2p'

export type PlayerColor = 'w' | 'b' | 'random'

export type DifficultyId =
  | 'beginner'
  | 'easy'
  | 'normal'
  | 'hard'
  | 'master'
  | 'max'

export interface DifficultyPreset {
  id: DifficultyId
  label: string
  labelZh: string
  elo: number | null
  moveTimeMs: number
  avatar: string
  tag: string
}

export interface PlayerProfile {
  name: string
  avatar: string
}

export interface GameSetup {
  mode: GameMode
  difficulty: DifficultyId
  playerColor: PlayerColor
  white: PlayerProfile
  black: PlayerProfile
  flipBoardEachMove: boolean
}

export type MoveClass =
  | 'best'
  | 'good'
  | 'inaccuracy'
  | 'mistake'
  | 'blunder'

export interface AnalyzedMove {
  ply: number
  san: string
  uci: string
  fenBefore: string
  fenAfter: string
  bestUci: string
  bestSan: string
  evalBeforeCp: number
  evalAfterCp: number
  cpl: number
  classification: MoveClass
  color: 'w' | 'b'
}

export interface GameReview {
  moves: AnalyzedMove[]
  whiteAccuracy: number
  blackAccuracy: number
  whiteCounts: Record<MoveClass, number>
  blackCounts: Record<MoveClass, number>
}

export type AppScreen = 'home' | 'play' | 'review'
