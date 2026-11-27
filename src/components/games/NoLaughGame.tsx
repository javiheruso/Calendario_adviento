import { useEffect, useState } from 'react'
import { getAsset } from '../../domain/assets'
import {
  NO_LAUGH_ROUND_SECONDS,
  currentNoLaughRound,
  finishNoLaughRound,
  isNoLaughComplete,
  prepareNextNoLaughRound,
  startNoLaughRound,
  createNoLaughState,
} from '../../domain/games/noLaugh'
import { formatCountdown } from '../../domain/games/timer'
import { AssetGlyph } from '../AssetGlyph'
import { CountdownAnnouncer } from '../CountdownAnnouncer'
import type { MissionGameProps } from './types'

const NO_LAUGH_ANNOUNCEMENT_MILESTONES = [10, 0] as const

/**
 * Day 13: two thirty-second rounds without tickling. Both rounds always count;
 * there is no obligatory winner and laughing is never a penalty.
 */
export function NoLaughGame({ onComplete }: MissionGameProps) {
  const [state, setState] = useState(createNoLaughState)
  const [remaining, setRemaining] = useState(NO_LAUGH_ROUND_SECONDS)
  const round = currentNoLaughRound(state)
  const playing = state.phase === 'playing'
  const complete = isNoLaughComplete(state)

  useEffect(() => {
    if (!playing) {
      return
    }

    const timerId = window.setTimeout(() => {
      if (remaining <= 1) {
        setRemaining(0)
        setState((current) => finishNoLaughRound(current))
        return
      }

      setRemaining((current) => current - 1)
    }, 1000)

    return () => window.clearTimeout(timerId)
  }, [playing, remaining])

  function startRound() {
    setRemaining(NO_LAUGH_ROUND_SECONDS)
    setState((current) => startNoLaughRound(current))
  }

  function endRound() {
    setState((current) => finishNoLaughRound(current))
  }

  function nextRound() {
    setRemaining(NO_LAUGH_ROUND_SECONDS)
    setState((current) => prepareNextNoLaughRound(current))
  }

  return (
    <div className="game game--no-laugh">
      <p className="game__lead">
        Dos rondas de treinta segundos para aguantar la risa. Un adulto hace bromas en la
        primera y Leyre en la segunda. <strong>Sin cosquillas.</strong> No hay ganador
        obligatorio: completar las dos rondas ya es la misión.
      </p>

      <section className="no-laugh-round" aria-labelledby="no-laugh-round-title">
        <p className="no-laugh-round__eyebrow">
          Ronda {state.roundIndex + 1} de 2
        </p>
        <p className="no-laugh-round__icon" aria-hidden="true">
          <AssetGlyph
            asset={getAsset(
              state.roundIndex === 0 ? 'game.laugh.child' : 'game.laugh.adult',
            )}
            label={false}
          />
        </p>
        <h3 id="no-laugh-round-title">{round.title}</h3>
        <p className="no-laugh-round__instruction">{round.instruction}</p>
      </section>

      <p className="no-laugh-timer" role="timer" aria-label="Tiempo de la ronda">
        <span className="no-laugh-timer__glyph" aria-hidden="true">
          <AssetGlyph asset={getAsset('game.laugh.clock')} label={false} />
        </span>
        {formatCountdown(remaining)}
      </p>

      <CountdownAnnouncer
        seconds={remaining}
        label="Ronda de risas"
        milestones={NO_LAUGH_ANNOUNCEMENT_MILESTONES}
      />

      {state.phase === 'idle' ? (
        <button type="button" className="button button--primary" onClick={startRound}>
          Empezar ronda
        </button>
      ) : null}

      {playing ? (
        <button type="button" className="button button--secondary" onClick={endRound}>
          Terminar ronda
        </button>
      ) : null}

      {state.phase === 'round-complete' ? (
        <div className="notice" role="status">
          <p>
            <strong>Primera ronda terminada.</strong> Aquí no hay ganador obligatorio: lo
            importante es completar las dos rondas.
          </p>
          <button type="button" className="button button--primary" onClick={nextRound}>
            Preparar la ronda 2
          </button>
        </div>
      ) : null}

      {complete ? (
        <div className="game__complete" role="status">
          <p>
            <strong>¡Las dos rondas están completas!</strong> Hayáis reído o no, la misión
            está superada.
          </p>
          <button type="button" className="button button--primary" onClick={onComplete}>
            Continuar
          </button>
        </div>
      ) : null}

      <p className="game__hint">
        Recordatorio para adultos: nada de cosquillas. Las bromas, los sonidos y las caras
        raras son suficientes.
      </p>
    </div>
  )
}
