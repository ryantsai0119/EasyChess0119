import type { DifficultyPreset } from './types'

export const DIFFICULTIES: DifficultyPreset[] = [
  {
    id: 'beginner',
    label: 'Beginner',
    labelZh: '入門',
    elo: 800,
    moveTimeMs: 300,
    avatar: '🤖',
    tag: '新手',
  },
  {
    id: 'easy',
    label: 'Easy',
    labelZh: '輕鬆',
    elo: 1100,
    moveTimeMs: 500,
    avatar: '😺',
    tag: '輕鬆',
  },
  {
    id: 'normal',
    label: 'Normal',
    labelZh: '普通',
    elo: 1400,
    moveTimeMs: 800,
    avatar: '🦊',
    tag: '普通',
  },
  {
    id: 'hard',
    label: 'Hard',
    labelZh: '困難',
    elo: 1800,
    moveTimeMs: 1200,
    avatar: '🐯',
    tag: '強敵',
  },
  {
    id: 'master',
    label: 'Master',
    labelZh: '大師',
    elo: 2200,
    moveTimeMs: 1800,
    avatar: '🐉',
    tag: '大師',
  },
  {
    id: 'max',
    label: 'Max',
    labelZh: '全力',
    elo: null,
    moveTimeMs: 2500,
    avatar: '♟️',
    tag: 'Stockfish',
  },
]

export function getDifficulty(id: string): DifficultyPreset {
  return DIFFICULTIES.find((d) => d.id === id) ?? DIFFICULTIES[2]
}

export const PLAYER_AVATARS = ['🙂', '😎', '🤓', '🦁', '🐼', '🐸', '🦄', '🎃']
