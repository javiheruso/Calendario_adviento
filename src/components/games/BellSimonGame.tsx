import { useEffect, useState } from 'react'
import {
  beginSimonInput,
  createSimonGame,
  createSimonProgress,
  currentSimonSequence,
  isSimonComplete,
  pressSimonBell,
  replaySimonRound,
  simonPressFeedback,
  type SimonProgress,
} from '../../domain/games/bellSimon'
import { BellStand, type BellDefinition, type BellFeedback } from './BellStand'
import type { MissionGameProps } from './types'

const BELLS: readonly BellDefinition[] = [
  { note: 0, label: 'Do', tone: 'red', asset: 'game.simon.bell.red' },
  { note: 1, label: 'Re', tone: 'blue', asset: 'game.simon.bell.blue' },
  { note: 2, label: 'Mi', tone: 'green', asset: 'game.simon.bell.green' },
  { note: 3, label: 'Fa', tone: 'gold', asset: 'game.simon.bell.gold' },
]

const NOTE_ON_MS = 380
const NOTE_GAP_MS = 220
const LEAD_IN_MS = 500
const FEEDBACK_MS = 420

/**
 * Day 18: Simon with four bells and five cumulative rounds (two to six notes).
 *
 * The game is silent until real audio exists: bells use colours and tone
 * labels, replaying shows the sequence again, and no background music plays
 * during it. The four final bell images sit on the stand's rings; playback and
 * a correct/wrong press only add illumination and a short sway.
 */
export function BellSimonGame({ onComplete }: MissionGameProps) {
  const [game] = useState(() => createSimonGame())
  const [progress, setProgress] = useState<SimonProgress>(() => createSimonProgress(game))
  const [activeBell, setActiveBell] = useState<number | null>(null)
  const [feedback, setFeedback] = useState<BellFeedback | null>(null)

  const sequence = currentSimonSequence(game, progress)
  const complete = isSimonComplete(progress)

  useEffect(() => {
    if (progress.phase !== 'showing') {
      return
    }

    const timers: number[] = []
    let elapsed = LEAD_IN_MS

    for (const note of sequence) {
      timers.push(window.setTimeout(() => setActiveBell(note), elapsed))
      timers.push(
        window.setTimeout(() => setActiveBell(null), elapsed + NOTE_ON_MS),
      )
      elapsed += NOTE_ON_MS + NOTE_GAP_MS
    }

    timers.push(
      window.setTimeout(() => {
        setActiveBell(null)
        setProgress((current) => beginSimonInput(current))
      }, elapsed + 200),
    )

    return () => {
      for (const timer of timers) {
        window.clearTimeout(timer)
      }
      setActiveBell(null)
    }
  }, [progress.phase, progress.round, sequence])

  useEffect(() => {
    if (!feedback) {
      return
    }

    const timer = window.setTimeout(() => setFeedback(null), FEEDBACK_MS)
    return () => window.clearTimeout(timer)
  }, [feedback])

  function pressBell(note: number) {
    if (progress.phase !== 'input') {
      return
    }

    const outcome = pressSimonBell(game, progress, note)
    setProgress(outcome.progress)

    const kind = simonPressFeedback(outcome.result)

    if (kind) {
      setFeedback({ note, kind })
    }

    if (outcome.result === 'failed') {
      setActiveBell(null)
    }
  }

  return (
    <div className="game game--simon">
      <p className="game__lead">
        Mira el orden en que se encienden las campanas y repítelo. No hay música de
        fondo mientras suena la secuencia y puedes reescucharla siempre que quieras.
      </p>

      <p className="game__status" role="status">
        Ronda {progress.round + 1} de {game.rounds.length} · {sequence.length} notas
      </p>

      <BellStand
        bells={BELLS}
        activeBell={activeBell}
        feedback={feedback}
        disabled={progress.phase !== 'input' || complete}
        label="Campanas mágicas"
        onPress={pressBell}
      />

      {progress.phase === 'failed' ? (
        <div className="notice" role="status">
          <p>
            <strong>No pasa nada: vuelve a escuchar y repite la ronda.</strong>
          </p>
        </div>
      ) : null}

      <div className="game__actions">
        <button
          type="button"
          className="button button--secondary"
          onClick={() => setProgress((current) => replaySimonRound(current))}
          disabled={progress.phase === 'showing' || complete}
        >
          Reescuchar y repetir
        </button>
      </div>

      {complete ? (
        <div className="game__complete" role="status">
          <p>
            <strong>¡Las cinco rondas están superadas!</strong>
          </p>
          <button type="button" className="button button--primary" onClick={onComplete}>
            Continuar
          </button>
        </div>
      ) : null}
    </div>
  )
}
