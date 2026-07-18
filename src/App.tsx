import { useEffect, useState } from 'react'
import { HomeScreen } from './components/HomeScreen'
import { PlayScreen } from './components/PlayScreen'
import { ReviewScreen } from './components/ReviewScreen'
import { getEngine } from './engine/stockfish'
import type { AppScreen, GameSetup } from './types'
import './App.css'

export default function App() {
  const [screen, setScreen] = useState<AppScreen>('home')
  const [setup, setSetup] = useState<GameSetup | null>(null)
  const [pgn, setPgn] = useState('')
  const [engineReady, setEngineReady] = useState(false)
  const [engineError, setEngineError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    getEngine()
      .init()
      .then(() => {
        if (alive) setEngineReady(true)
      })
      .catch((err: unknown) => {
        if (alive) {
          setEngineError(err instanceof Error ? err.message : String(err))
        }
      })
    return () => {
      alive = false
    }
  }, [])

  if (screen === 'home' || !setup) {
    return (
      <HomeScreen
        engineReady={engineReady}
        engineError={engineError}
        onStart={(s) => {
          setSetup(s)
          setScreen('play')
        }}
      />
    )
  }

  if (screen === 'review') {
    return (
      <ReviewScreen
        pgn={pgn}
        setup={setup}
        onBack={() => setScreen('play')}
        onHome={() => {
          setSetup(null)
          setPgn('')
          setScreen('home')
        }}
      />
    )
  }

  return (
    <PlayScreen
      setup={setup}
      onExit={() => {
        getEngine().stop()
        setSetup(null)
        setScreen('home')
      }}
      onReview={(gamePgn) => {
        setPgn(gamePgn)
        setScreen('review')
      }}
    />
  )
}
