import { useEffect, useState } from 'react'
import { getAsset, type AssetId } from '../../domain/assets'
import {
  CHARADES_ROUNDS,
  canConfirmCharadeHit,
  confirmCharadeHit,
  createCharadesState,
  currentCharadeAnimal,
  hideCharadeAnimal,
  isCharadesComplete,
  revealCharadeAnimal,
} from '../../domain/games/charades'
import { AssetGlyph } from '../AssetGlyph'
import type { MissionGameProps } from './types'

const ANIMAL_ASSETS: Readonly<Record<string, AssetId>> = {
  elephant: 'game.charades.elephant',
  cat: 'game.charades.cat',
  dog: 'game.charades.dog',
  lion: 'game.charades.lion',
  monkey: 'game.charades.monkey',
  penguin: 'game.charades.penguin',
  rabbit: 'game.charades.rabbit',
  hen: 'game.charades.hen',
  gorilla: 'game.charades.gorilla',
  duck: 'game.charades.duck',
  frog: 'game.charades.frog',
  reindeer: 'game.charades.reindeer',
}

function animalAsset(id: string): AssetId {
  return ANIMAL_ASSETS[id] ?? 'game.charades.hidden'
}

/**
 * Day 17: three animals drawn from a bank of twelve. The card is face down by
 * default and is only visible while the actor holds the reveal control with a
 * pointer or the space/enter key. Releasing, cancelling, leaving the control,
 * losing focus or hiding the tab closes it again. The manual "Acertado" button
 * stays disabled until the card has been shown and hidden once; confirming
 * advances straight to the next hidden animal. Nothing plays audio that could
 * reveal the answer, and no camera is requested.
 */
export function CharadesGame({ onComplete }: MissionGameProps) {
  const [state, setState] = useState(createCharadesState)
  const [feedback, setFeedback] = useState<string | null>(null)
  const animal = currentCharadeAnimal(state)
  const complete = isCharadesComplete(state)
  const visible = state.animalVisible
  const canConfirm = canConfirmCharadeHit(state)

  useEffect(() => {
    const hide = () => setState((current) => hideCharadeAnimal(current))
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        hide()
      }
    }

    // Always listening closes the tiny window between the pointerdown render
    // and the effect. `hideCharadeAnimal` is idempotent, so a release on the
    // button itself cannot hide twice or change progress.
    window.addEventListener('pointerup', hide)
    window.addEventListener('pointercancel', hide)
    window.addEventListener('blur', hide)
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      window.removeEventListener('pointerup', hide)
      window.removeEventListener('pointercancel', hide)
      window.removeEventListener('blur', hide)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [])

  function startReveal() {
    setState((current) => revealCharadeAnimal(current))
  }

  function stopReveal() {
    setState((current) => hideCharadeAnimal(current))
  }

  function confirm() {
    if (!canConfirmCharadeHit(state)) {
      return
    }

    const next = confirmCharadeHit(state)
    setState(next)
    setFeedback(
      next.phase === 'complete'
        ? '¡Tercer acierto! La misión está completa.'
        : 'Acierto marcado. Preparad el siguiente animal en secreto.',
    )
  }

  return (
    <div className="game game--charades">
      <p className="game__lead">
        Trasto ha elegido tres animales al azar. Quien imita mantiene pulsada la
        carta para ver el animal sin que nadie más mire y la suelta para ocultarlo
        antes de empezar. No se puede hablar ni hacer ruidos que digan la respuesta.
        Cada acierto se marca a mano: no hay cámara, cronómetro ni castigos.
      </p>

      {!complete && animal ? (
        <>
          <p className="game__status" role="status">
            Animal {state.roundIndex + 1} de {CHARADES_ROUNDS} · Aciertos:{' '}
            {state.hits}
          </p>

          <section className="charades-card" aria-labelledby="charades-card-title">
            <h3 id="charades-card-title">Animal secreto</h3>
            <p className="charades-card__glyph" aria-hidden="true">
              <AssetGlyph
                asset={getAsset(
                  visible ? animalAsset(animal.id) : 'game.charades.hidden',
                )}
                label={false}
              />
            </p>
            <p className="charades-card__answer" role="status">
              {visible ? (
                <strong>{animal.label}</strong>
              ) : (
                <span>La carta está boca abajo. Solo la ve quien imita.</span>
              )}
            </p>
            <button
              type="button"
              className="button button--secondary charades-reveal"
              onPointerDown={(event) => {
                event.preventDefault()
                startReveal()
              }}
              onPointerUp={stopReveal}
              onPointerLeave={stopReveal}
              onPointerCancel={stopReveal}
              onKeyDown={(event) => {
                if (event.key === ' ' || event.key === 'Enter') {
                  event.preventDefault()
                  if (!event.repeat) {
                    startReveal()
                  }
                }
              }}
              onKeyUp={(event) => {
                if (event.key === ' ' || event.key === 'Enter') {
                  event.preventDefault()
                  stopReveal()
                }
              }}
              onBlur={stopReveal}
              onContextMenu={(event) => event.preventDefault()}
              aria-pressed={visible}
              disabled={complete}
            >
              {visible ? 'Suelta para ocultar' : 'Mantén pulsado para ver el animal'}
            </button>
          </section>

          <button
            type="button"
            className="button button--primary"
            onClick={confirm}
            disabled={!canConfirm}
          >
            ¡Acertado! Marcar acierto
          </button>

          <p className="game__hint">
            {canConfirm
              ? 'Carta oculta de nuevo: ya puedes marcar el acierto.'
              : 'El botón de acierto se activa después de mostrar y volver a ocultar la carta.'}
          </p>

          {feedback ? (
            <p className="game__hint" role="status">
              {feedback}
            </p>
          ) : null}
        </>
      ) : null}

      {complete ? (
        <div className="game__complete" role="status">
          <p>
            <strong>¡Tres animales adivinados!</strong> El duende silencioso está
            orgulloso: la mímica ha funcionado sin una sola palabra.
          </p>
          <button type="button" className="button button--primary" onClick={onComplete}>
            Continuar
          </button>
        </div>
      ) : null}
    </div>
  )
}
