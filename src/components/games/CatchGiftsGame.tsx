import { useEffect, useState, type PointerEvent } from 'react'
import { getAsset } from '../../domain/assets'
import {
  CATCH_TARGET,
  createCatchGame,
  isCatchGameComplete,
  moveCatchBasket,
  stepCatchGame,
  type CatchGameState,
} from '../../domain/games/catchGifts'
import { AssetGlyph } from '../AssetGlyph'
import type { MissionGameProps } from './types'

const KEYBOARD_STEP = 0.07

/**
 * Day 12: move the basket with a finger or mouse and catch 15 gifts. The fall
 * speed and spawn rate grow smoothly with progress. Missed gifts are not
 * penalised, and there is no timer or life system.
 */
export function CatchGiftsGame({ onComplete }: MissionGameProps) {
  const [state, setState] = useState<CatchGameState>(() => createCatchGame())
  const complete = isCatchGameComplete(state)

  useEffect(() => {
    if (complete) {
      return
    }

    let frame = 0
    let last = performance.now()

    const tick = (now: number) => {
      const delta = now - last
      last = now
      setState((current) =>
        isCatchGameComplete(current)
          ? current
          : stepCatchGame(current, delta),
      )
      frame = window.requestAnimationFrame(tick)
    }

    frame = window.requestAnimationFrame(tick)
    return () => window.cancelAnimationFrame(frame)
  }, [complete])

  function moveFromPointer(event: PointerEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect()

    if (rect.width === 0) {
      return
    }

    const x = (event.clientX - rect.left) / rect.width
    setState((current) => moveCatchBasket(current, x))
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture(event.pointerId)
    moveFromPointer(event)
  }

  function nudge(direction: -1 | 1) {
    setState((current) =>
      moveCatchBasket(current, current.basketX + direction * KEYBOARD_STEP),
    )
  }

  return (
    <div className="game game--catch">
      <p className="game__lead">
        Mueve la cesta con el dedo o el ratón y atrapa quince regalos. La lluvia se
        acelera poco a poco, pero no hay vidas, castigos ni tiempo máximo: los regalos
        que se escapan no restan.
      </p>

      <p className="game__status" role="status">
        Regalos atrapados: {Math.min(state.caught, CATCH_TARGET)} de {CATCH_TARGET}
      </p>

      <div
        className="catch-field"
        onPointerMove={moveFromPointer}
        onPointerDown={handlePointerDown}
        role="group"
        aria-label="Zona de juego para mover la cesta"
      >
        {state.gifts.map((gift) => (
          <span
            key={gift.id}
            className="catch-gift"
            style={{ left: `${gift.x * 100}%`, top: `${gift.y * 100}%` }}
            aria-hidden="true"
          >
            <AssetGlyph asset={getAsset('ui.gift')} label={false} />
          </span>
        ))}

        <span
          className="catch-basket"
          style={{ left: `${state.basketX * 100}%` }}
          aria-hidden="true"
        >
          <AssetGlyph asset={getAsset('game.catch.basket')} label={false} />
        </span>
      </div>

      <div className="catch-controls" aria-label="Mover la cesta">
        <button
          type="button"
          className="button button--secondary"
          onClick={() => nudge(-1)}
          disabled={complete}
          aria-label="Mover la cesta a la izquierda"
        >
          ← Izquierda
        </button>
        <button
          type="button"
          className="button button--secondary"
          onClick={() => nudge(1)}
          disabled={complete}
          aria-label="Mover la cesta a la derecha"
        >
          Derecha →
        </button>
      </div>

      {complete ? (
        <div className="game__complete" role="status">
          <p>
            <strong>¡Has atrapado los quince regalos!</strong>
          </p>
          <button type="button" className="button button--primary" onClick={onComplete}>
            Continuar
          </button>
        </div>
      ) : null}
    </div>
  )
}
