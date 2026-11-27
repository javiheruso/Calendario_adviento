import { useEffect, useState } from 'react'
import { getAsset } from '../../domain/assets'
import {
  GUIDED_DRAWING_EXTENSION_SECONDS,
  GUIDED_DRAWING_STEPS,
  createGuidedDrawingState,
  currentGuidedDrawingStep,
  extendGuidedDrawingStep,
  finishGuidedDrawing,
  isGuidedDrawingComplete,
  pauseGuidedDrawing,
  repeatGuidedDrawingStep,
  resetGuidedDrawing,
  startGuidedDrawing,
  tickGuidedDrawing,
} from '../../domain/games/guidedDrawing'
import { AssetGlyph } from '../AssetGlyph'
import type { MissionGameProps } from './types'

/**
 * Day 11: draw a reindeer with closed eyes following the approved temporary
 * script. The family can repeat or extend a step, and the manual finish button
 * works at any time, so the timer never blocks success.
 */
export function GuidedDrawingGame({ onComplete }: MissionGameProps) {
  const [state, setState] = useState(createGuidedDrawingState)
  const step = currentGuidedDrawingStep(state)
  const complete = isGuidedDrawingComplete(state)

  useEffect(() => {
    if (!state.running) {
      return
    }

    const timerId = window.setTimeout(() => {
      setState((current) => tickGuidedDrawing(current))
    }, 1000)

    return () => window.clearTimeout(timerId)
  }, [state])

  return (
    <div className="game game--drawing">
      <p className="game__lead">
        Coge papel y lápiz y cierra los ojos. Trasto te irá diciendo qué dibujar paso a
        paso. Puedes repetir una indicación o pedir más tiempo; cuando termines, pulsa el
        botón grande aunque el guion siga. Nada bloquea tu dibujo.
      </p>

      <div className="drawing-actions drawing-actions--top">
        {!complete ? (
          <>
            {!state.running ? (
              <button
                type="button"
                className="button button--primary"
                onClick={() => setState((current) => startGuidedDrawing(current))}
                disabled={state.scriptComplete}
              >
                Comenzar el guion
              </button>
            ) : (
              <button
                type="button"
                className="button button--secondary"
                onClick={() => setState((current) => pauseGuidedDrawing(current))}
              >
                Pausar
              </button>
            )}
            <button
              type="button"
              className="button button--secondary"
              onClick={() => setState((current) => repeatGuidedDrawingStep(current))}
            >
              Repetir indicación
            </button>
            <button
              type="button"
              className="button button--secondary"
              onClick={() => setState((current) => extendGuidedDrawingStep(current))}
            >
              +{GUIDED_DRAWING_EXTENSION_SECONDS} s
            </button>
            <button
              type="button"
              className="button button--secondary"
              onClick={() => setState(resetGuidedDrawing())}
            >
              Reiniciar guion
            </button>
          </>
        ) : null}
      </div>

      <section className="drawing-step" aria-labelledby="drawing-step-title">
        <p className="drawing-step__count">
          Paso {state.stepIndex + 1} de {GUIDED_DRAWING_STEPS.length}
        </p>
        <p className="drawing-step__icon" aria-hidden="true">
          <AssetGlyph asset={getAsset('game.drawing.reindeer')} label={false} />
        </p>
        <h3 id="drawing-step-title">{step.title}</h3>
        <p className="drawing-step__detail">{step.detail}</p>
      </section>

      {state.scriptComplete ? (
        <p className="game__hint" role="status">
          El guion ha terminado, pero puedes mirar tu obra y terminar cuando quieras.
        </p>
      ) : null}

      {!complete ? (
        <button
          type="button"
          className="button button--primary drawing-finish"
          onClick={() => setState((current) => finishGuidedDrawing(current))}
        >
          <span aria-hidden="true">
            <AssetGlyph asset={getAsset('game.drawing.pencil')} label={false} />
          </span>{' '}
          He terminado mi reno
        </button>
      ) : (
        <div className="game__complete" role="status">
          <p>
            <strong>¡Tu reno imposible está terminado!</strong> Ahora sí puedes abrir los
            ojos y enseñarlo.
          </p>
          <button type="button" className="button button--primary" onClick={onComplete}>
            Continuar
          </button>
        </div>
      )}
    </div>
  )
}
