import { useEffect, useState } from 'react'
import {
  beginSimonInput,
  createSimonProgress,
  currentSimonSequence,
  isSimonComplete,
  pressSimonBell,
  replaySimonRound,
  simonPressFeedback,
  type SimonProgress,
} from '../../../domain/games/bellSimon'
import { createFinalBellGame } from '../../../domain/games/finalMemory'
import { useAutoAdvance } from '../../useAutoAdvance'
import { BellStand, type BellDefinition, type BellFeedback } from '../BellStand'
import type { CrystalProps } from './types'

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
const AUTO_ADVANCE_MS = 1500

/**
 * Day 24 memory crystal: three independent bell sequences of 3, 4 and 5 notes.
 * The day 18 Simon rules and bell composition are reused, so a miss only pauses
 * the current sequence and replaying is always available. The game stays silent
 * until real audio exists; the stand, illumination and sway are visual only.
 */
export function MemoryCrystal({ onSolved }: CrystalProps) {
  const [game] = useState(() => createFinalBellGame())
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
      timers.push(window.setTimeout(() => setActiveBell(null), elapsed + NOTE_ON_MS))
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

  useAutoAdvance(complete, AUTO_ADVANCE_MS, onSolved)

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
    <section className="finale-crystal-game" aria-labelledby="final-memory-title">
      <h3 id="final-memory-title">Cristal de la memoria</h3>
      <p className="game__lead">
        Observa tres secuencias de campanas: primero 3 notas, después 4 y al final 5.
        Repite cada una en el mismo orden. Si te equivocas, la secuencia solo se
        detiene y puedes volver a escucharla. No hay cronómetro.
      </p>

      <p className="game__status" role="status">
        Secuencia {progress.round + 1} de {game.rounds.length} · {sequence.length}{' '}
        notas
      </p>

      <BellStand
        bells={BELLS}
        activeBell={activeBell}
        feedback={feedback}
        disabled={progress.phase !== 'input' || complete}
        label="Campanas del cristal de la memoria"
        onPress={pressBell}
      />

      {progress.phase === 'failed' ? (
        <div className="notice" role="status">
          <p>
            <strong>No pasa nada: vuelve a escuchar y repite esta secuencia.</strong>
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
            <strong>¡Las tres secuencias están completas!</strong> La memoria de
            Trasto ya brilla en el cristal.
          </p>
          <button type="button" className="button button--primary" onClick={onSolved}>
            Pasar al cristal de la magia
          </button>
        </div>
      ) : null}
    </section>
  )
}
