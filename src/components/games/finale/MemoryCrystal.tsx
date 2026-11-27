import { useEffect, useState } from 'react'
import { getAsset } from '../../../domain/assets'
import {
  beginSimonInput,
  createSimonProgress,
  currentSimonSequence,
  isSimonComplete,
  pressSimonBell,
  replaySimonRound,
  type SimonProgress,
} from '../../../domain/games/bellSimon'
import { createFinalBellGame } from '../../../domain/games/finalMemory'
import { AssetGlyph } from '../../AssetGlyph'
import type { CrystalProps } from './types'

const BELLS = [
  { note: 0, label: 'Do', tone: 'red' },
  { note: 1, label: 'Re', tone: 'blue' },
  { note: 2, label: 'Mi', tone: 'green' },
  { note: 3, label: 'Fa', tone: 'gold' },
] as const

const NOTE_ON_MS = 380
const NOTE_GAP_MS = 220
const LEAD_IN_MS = 500

/**
 * Day 24 memory crystal: three independent bell sequences of 3, 4 and 5 notes.
 * The day 18 Simon rules are reused, so a miss only pauses the current sequence
 * and replaying is always available. The game is silent until real audio exists.
 */
export function MemoryCrystal({ onSolved }: CrystalProps) {
  const [game] = useState(() => createFinalBellGame())
  const [progress, setProgress] = useState<SimonProgress>(() => createSimonProgress(game))
  const [activeBell, setActiveBell] = useState<number | null>(null)

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

  function pressBell(note: number) {
    if (progress.phase !== 'input') {
      return
    }

    const outcome = pressSimonBell(game, progress, note)
    setProgress(outcome.progress)

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

      <div className="simon-bells" aria-label="Campanas del cristal de la memoria">
        {BELLS.map((bell) => (
          <button
            key={bell.note}
            type="button"
            className={`simon-bell simon-bell--${bell.tone}${
              activeBell === bell.note ? ' simon-bell--active' : ''
            }`}
            onClick={() => pressBell(bell.note)}
            disabled={progress.phase !== 'input' || complete}
            aria-label={`Campana ${bell.label}`}
          >
            <span className="simon-bell__glyph" aria-hidden="true">
              <AssetGlyph asset={getAsset('game.simon.bell')} label={false} />
            </span>
            <span className="simon-bell__label">{bell.label}</span>
          </button>
        ))}
      </div>

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
