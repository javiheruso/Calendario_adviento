import { useState } from 'react'
import { getAsset, type AssetId } from '../../domain/assets'
import {
  PATTERN_COUNT,
  acknowledgePatternResult,
  createPatternState,
  currentPattern,
  isPatternGameComplete,
  patternOptions,
  submitPatternChoice,
  type PatternToken,
} from '../../domain/games/patterns'
import { AssetGlyph } from '../AssetGlyph'
import type { MissionGameProps } from './types'

interface TokenMeta {
  readonly asset: AssetId
  readonly color: 'red' | 'blue' | 'green'
  readonly label: string
}

const TOKEN_META: Readonly<Record<PatternToken, TokenMeta>> = {
  A: { asset: 'game.pattern.star', color: 'red', label: 'estrella roja' },
  B: { asset: 'game.pattern.bell', color: 'blue', label: 'campana azul' },
  C: { asset: 'game.pattern.tree', color: 'green', label: 'árbol verde' },
}

function TokenChip({ token, muted = false }: { token: PatternToken; muted?: boolean }) {
  const meta = TOKEN_META[token]

  return (
    <span
      className={`pattern-chip pattern-chip--${meta.color}${muted ? ' pattern-chip--muted' : ''}`}
      role="img"
      aria-label={meta.label}
    >
      <AssetGlyph asset={getAsset(meta.asset)} label={false} />
    </span>
  )
}

/**
 * Day 10: complete the five approved ornament patterns. The sequence is read
 * left to right, the child picks the next ornament, and a wrong choice is only
 * feedback with unlimited retries.
 */
export function PatternsGame({ onComplete }: MissionGameProps) {
  const [state, setState] = useState(() => createPatternState())
  const challenge = currentPattern(state)
  const complete = isPatternGameComplete(state)
  const waitingForNext = state.lastResult === 'correct' && !complete

  function choose(token: PatternToken) {
    if (!challenge) {
      return
    }

    setState((current) =>
      submitPatternChoice(current, challenge, token).state,
    )
  }

  return (
    <div className="game game--patterns">
      <p className="game__lead">
        La fábrica de adornos prepara cintas de colores y figuras. Mira el orden y elige
        el adorno que sigue. Si te equivocas, no pasa nada: prueba otra vez.
      </p>

      <p className="game__status" role="status">
        Patrón {Math.min(state.solved + 1, PATTERN_COUNT)} de {PATTERN_COUNT}
      </p>

      {challenge && !waitingForNext ? (
        <>
          <div className="pattern-strip" aria-label="Secuencia de adornos">
            <AssetGlyph
              asset={getAsset('game.pattern.belt')}
              label={false}
              className="pattern-strip__belt"
              priority
            />
            {challenge.sequence.map((token, index) => (
              <TokenChip key={`${challenge.id}-${index}`} token={token} />
            ))}
            <span className="pattern-chip pattern-chip--missing" aria-label="Siguiente adorno">
              ?
            </span>
          </div>

          <p className="game__hint">¿Qué adorno continúa la cinta?</p>

          <div className="pattern-options" aria-label="Adornos disponibles">
            {patternOptions(challenge).map((token) => (
              <button
                key={token}
                type="button"
                className="pattern-option"
                onClick={() => choose(token)}
                disabled={waitingForNext}
              >
                <TokenChip token={token} />
              </button>
            ))}
          </div>
        </>
      ) : null}

      {state.lastResult === 'wrong' ? (
        <p className="game__hint" role="status">
          Esa figura no sigue la cinta. Mira otra vez el orden y vuelve a probar.
        </p>
      ) : null}

      {waitingForNext ? (
        <div className="game__complete" role="status">
          <p>
            <strong>¡Patrón completado!</strong>
          </p>
          <button
            type="button"
            className="button button--primary"
            onClick={() => setState((current) => acknowledgePatternResult(current))}
          >
            Siguiente patrón
          </button>
        </div>
      ) : null}

      {complete ? (
        <div className="game__complete" role="status">
          <p>
            <strong>¡Los cinco patrones están completos!</strong>
          </p>
          <button type="button" className="button button--primary" onClick={onComplete}>
            Continuar
          </button>
        </div>
      ) : null}
    </div>
  )
}
