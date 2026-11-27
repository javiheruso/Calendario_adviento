import { useState } from 'react'
import { getAsset } from '../../domain/assets'
import {
  SNOWBALL_HITS_TO_WIN,
  SNOWBALL_THROWS_PER_ROUND,
  createSnowballState,
  recordSnowballThrow,
  resetSnowballRound,
  snowballsLeft,
} from '../../domain/games/snowballToss'
import { AssetGlyph } from '../AssetGlyph'
import type { MissionGameProps } from './types'

/**
 * Day 5: five paper snowballs per round, three hits to win. The adult watches
 * every throw and taps "Dentro" or "Fuera". A lost round is only feedback and
 * can be retried forever.
 */
export function SnowballTossGame({ onComplete }: MissionGameProps) {
  const [state, setState] = useState(createSnowballState)
  const won = state.phase === 'won'
  const lost = state.phase === 'round-lost'
  const left = snowballsLeft(state)

  return (
    <div className="game game--snowball">
      <p className="game__lead">
        Prepara cinco bolas de papel y una cesta a un paso y medio de distancia. Un
        adulto mira cada lanzamiento y marca si entra o no. Con tres aciertos ganas la
        ronda; si no llega, puedes empezar otra vez las veces que quieras.
      </p>

      <div className="snowball-score">
        <p className="game__status" role="status">
          Aciertos: {state.hits} de {SNOWBALL_HITS_TO_WIN} · Lanzamientos:{' '}
          {state.throws} de {SNOWBALL_THROWS_PER_ROUND}
        </p>
        <p className="snowball-balls" aria-label={`Quedan ${left} bolas de papel`}>
          {Array.from({ length: SNOWBALL_THROWS_PER_ROUND }, (_, index) => {
            const used = index < state.throws

            return (
              <span
                key={index}
                className={`snowball-ball${used ? ' snowball-ball--used' : ''}`}
                aria-hidden="true"
              >
                <AssetGlyph asset={getAsset('game.snowball.ball')} label={false} />
              </span>
            )
          })}
        </p>
      </div>

      <div className="snowball-target" aria-hidden="true">
        <span className="snowball-target__glyph">
          <AssetGlyph asset={getAsset('game.snowball.target')} label={false} />
        </span>
        <span className="snowball-target__hint">La cesta está aquí</span>
      </div>

      {state.phase === 'playing' ? (
        <section className="snowball-marks" aria-labelledby="snowball-marks-title">
          <h3 id="snowball-marks-title">Adulto: ¿dentro o fuera?</h3>
          <div className="snowball-actions">
            <button
              type="button"
              className="snowball-mark snowball-mark--inside"
              onClick={() => setState((current) => recordSnowballThrow(current, true))}
            >
              <span className="snowball-mark__glyph" aria-hidden="true">
                <AssetGlyph asset={getAsset('game.snowball.hit')} label={false} />
              </span>
              Dentro
            </button>
            <button
              type="button"
              className="snowball-mark snowball-mark--outside"
              onClick={() => setState((current) => recordSnowballThrow(current, false))}
            >
              <span className="snowball-mark__glyph" aria-hidden="true">
                <AssetGlyph asset={getAsset('game.snowball.miss')} label={false} />
              </span>
              Fuera
            </button>
          </div>
        </section>
      ) : null}

      {lost ? (
        <div className="notice" role="status">
          <p>
            <strong>Esta ronda se ha quedado en {state.hits} aciertos.</strong>
          </p>
          <p>No pasa nada: en la siguiente ronda tienes cinco bolas nuevas.</p>
          <button
            type="button"
            className="button button--secondary"
            onClick={() => setState(resetSnowballRound())}
          >
            Probar otra ronda
          </button>
        </div>
      ) : null}

      {won ? (
        <div className="game__complete" role="status">
          <p>
            <strong>¡Tres aciertos! Ronda ganada con {state.throws} lanzamientos.</strong>
          </p>
          <button type="button" className="button button--primary" onClick={onComplete}>
            Continuar
          </button>
        </div>
      ) : null}
    </div>
  )
}
