import { useEffect, useState } from 'react'
import { getAsset, type AssetId } from '../../domain/assets'
import {
  MEMORY_PAIRS,
  createMemoryState,
  flipMemoryCard,
  isMemoryComplete,
  matchedMemoryPairs,
  resolveMemoryMismatch,
} from '../../domain/games/memory'
import { AssetGlyph } from '../AssetGlyph'
import type { MissionGameProps } from './types'

const MEMORY_FACES: readonly AssetId[] = [
  'game.memory.reindeer',
  'game.memory.snowman',
  'ui.gift',
  'ui.star',
  'game.memory.bell',
  'ui.tree',
]

/** Day 2: twelve cards, six pairs, no timer and no attempt limit. */
export function MemoryGame({ onComplete }: MissionGameProps) {
  const [state, setState] = useState(() => createMemoryState(MEMORY_PAIRS))
  const matched = matchedMemoryPairs(state)
  const complete = isMemoryComplete(state)

  useEffect(() => {
    if (!state.hasMismatch) {
      return
    }

    const timer = window.setTimeout(() => {
      setState((current) => resolveMemoryMismatch(current))
    }, 900)

    return () => window.clearTimeout(timer)
  }, [state.hasMismatch])

  return (
    <div className="game game--memory">
      <p className="game__lead">
        Encuentra las seis parejas. No hay tiempo ni penalizaciones: gira las cartas
        con calma las veces que quieras.
      </p>

      <p className="game__status" role="status">
        Parejas encontradas: {matched} de {MEMORY_PAIRS}
      </p>

      <ul className="memory-grid" aria-label="Cartas del juego de memoria">
        {state.cards.map((card) => {
          const face = MEMORY_FACES[card.pairId]
          const showFace = card.faceUp || card.matched

          return (
            <li key={card.id}>
              <button
                type="button"
                className={`memory-card${showFace ? ' memory-card--face' : ''}${
                  card.matched ? ' memory-card--matched' : ''
                }`}
                onClick={() => setState((current) => flipMemoryCard(current, card.id))}
                disabled={card.matched}
                aria-pressed={showFace}
                aria-label={showFace ? getAsset(face).label : 'Carta boca abajo'}
              >
                <span aria-hidden="true">
                  <AssetGlyph
                    asset={showFace ? getAsset(face) : getAsset('game.memory.back')}
                    label={false}
                  />
                </span>
              </button>
            </li>
          )
        })}
      </ul>

      {complete ? (
        <div className="game__complete" role="status">
          <p>
            <strong>¡Las seis parejas están encontradas!</strong>
          </p>
          <button type="button" className="button button--primary" onClick={onComplete}>
            Continuar
          </button>
        </div>
      ) : null}
    </div>
  )
}
