import { useEffect, useState } from 'react'
import { getAsset, type AssetId } from '../../domain/assets'
import {
  SNOWMAN_CATEGORIES,
  SNOWMAN_OBSERVE_SECONDS,
  createSnowmanState,
  clearSnowmanSelection,
  isSnowmanComplete,
  isSnowmanSelectionComplete,
  matchingSnowmanCategories,
  selectSnowmanVariant,
  selectedSnowmanCategories,
  startSnowmanBuilding,
  type SnowmanCategory,
  type SnowmanState,
} from '../../domain/games/snowman'
import { AssetGlyph } from '../AssetGlyph'
import { CountdownAnnouncer } from '../CountdownAnnouncer'
import type { MissionGameProps } from './types'

interface VariantMeta {
  readonly asset: AssetId
  readonly label: string
  readonly tone?: string
}

const CATEGORY_LABELS: Readonly<Record<SnowmanCategory, string>> = {
  hat: 'Sombrero',
  scarf: 'Bufanda',
  nose: 'Nariz',
  buttons: 'Botones',
}

const SNOWMAN_ANNOUNCEMENT_MILESTONES = [10, 5, 0] as const

const VARIANT_META: Readonly<Record<SnowmanCategory, readonly VariantMeta[]>> = {
  hat: [
    { asset: 'game.snowman.hat.top', label: 'sombrero de copa' },
    { asset: 'game.snowman.hat.warm', label: 'gorro de invierno' },
    { asset: 'game.snowman.hat.crown', label: 'corona' },
  ],
  scarf: [
    { asset: 'game.snowman.scarf.red', label: 'bufanda roja', tone: 'red' },
    { asset: 'game.snowman.scarf.green', label: 'bufanda verde', tone: 'green' },
    { asset: 'game.snowman.scarf.blue', label: 'bufanda azul', tone: 'blue' },
  ],
  nose: [
    { asset: 'game.snowman.nose.carrot', label: 'nariz de zanahoria' },
    { asset: 'game.snowman.nose.button', label: 'nariz de botón' },
    { asset: 'game.snowman.nose.coal', label: 'nariz de carbón' },
  ],
  buttons: [
    { asset: 'game.snowman.buttons.two', label: 'dos botones de carbón' },
    { asset: 'game.snowman.buttons.three', label: 'tres botones de carbón' },
    { asset: 'game.snowman.buttons.stars', label: 'tres botones de estrella' },
  ],
}

function CombinationPreview({
  title,
  combination,
}: {
  title: string
  combination: Readonly<Record<SnowmanCategory, number | null>>
}) {
  return (
    <div className="snowman-preview" aria-label={title}>
      <p className="snowman-preview__title">{title}</p>
      <span className="snowman-preview__body" aria-hidden="true">
        <AssetGlyph asset={getAsset('game.snowman.body')} label={false} />
      </span>
      <ul className="snowman-preview__accessories">
        {SNOWMAN_CATEGORIES.map((category) => {
          const variant = combination[category]
          const meta = variant === null ? null : VARIANT_META[category][variant]

          return (
            <li key={category} className="snowman-accessory">
              <span
                className={`snowman-accessory__glyph${
                  meta?.tone ? ` snowman-accessory__glyph--${meta.tone}` : ''
                }`}
                aria-hidden="true"
              >
                {meta ? (
                  <AssetGlyph asset={getAsset(meta.asset)} label={false} />
                ) : (
                  '?'
                )}
              </span>
              <span className="snowman-accessory__label">
                {CATEGORY_LABELS[category]}: {meta ? meta.label : 'sin elegir'}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

/**
 * Day 21: observe Copito's random combination for fifteen seconds, rebuild it
 * with three variants per category, and consult the model whenever needed. A
 * wrong combination is only feedback and can be retried.
 */
export function SnowmanGame({ onComplete }: MissionGameProps) {
  const [state, setState] = useState<SnowmanState>(() => createSnowmanState())
  const [secondsLeft, setSecondsLeft] = useState(SNOWMAN_OBSERVE_SECONDS)
  const [showModel, setShowModel] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)
  const complete = isSnowmanComplete(state)
  const observing = state.phase === 'observing'

  useEffect(() => {
    if (state.phase !== 'observing') {
      return
    }

    if (secondsLeft <= 0) {
      const finish = window.setTimeout(() => {
        setState((current) => startSnowmanBuilding(current))
      }, 0)

      return () => window.clearTimeout(finish)
    }

    const timer = window.setTimeout(() => {
      setSecondsLeft((current) => Math.max(0, current - 1))
    }, 1000)

    return () => window.clearTimeout(timer)
  }, [state.phase, secondsLeft])

  function choose(category: SnowmanCategory, variant: number) {
    const next = selectSnowmanVariant(state, category, variant)
    setState(next)

    if (isSnowmanComplete(next)) {
      setFeedback('¡Copito está igual que antes!')
      return
    }

    if (isSnowmanSelectionComplete(next)) {
      setFeedback(
        `Todavía no es igual. Coinciden ${matchingSnowmanCategories(next)} de 4 detalles. Mira el modelo y prueba otra vez.`,
      )
      return
    }

    setFeedback(null)
  }

  return (
    <div className="game game--snowman">
      <p className="game__lead">
        Copito se ha vestido y luego se ha olvidado de cómo iba. Míralo durante quince
        segundos, reconstruye su combinación y consulta el modelo cuando quieras. No hay
        castigos ni límite de intentos.
      </p>

      {observing ? (
        <section className="snowman-observe" aria-labelledby="snowman-observe-title">
          <h3 id="snowman-observe-title">Observa a Copito</h3>
          <CountdownAnnouncer
            seconds={secondsLeft}
            label="Observación de Copito"
            milestones={SNOWMAN_ANNOUNCEMENT_MILESTONES}
          />
          <p className="game__status">
            Quedan {secondsLeft} segundos de observación
          </p>
          <CombinationPreview title="Copito lleva esta combinación" combination={state.target} />
        </section>
      ) : null}

      {!observing ? (
        <>
          <div className="game__actions">
            <button
              type="button"
              className="button button--secondary"
              onClick={() => setShowModel((current) => !current)}
              aria-expanded={showModel}
              disabled={complete}
            >
              {showModel ? 'Ocultar modelo' : 'Ver modelo'}
            </button>
            <button
              type="button"
              className="button button--secondary"
              onClick={() => {
                setState((current) => clearSnowmanSelection(current))
                setFeedback(null)
              }}
              disabled={complete || selectedSnowmanCategories(state) === 0}
            >
              Borrar elección
            </button>
          </div>

          {showModel && !complete ? (
            <CombinationPreview title="Modelo: así iba Copito" combination={state.target} />
          ) : null}

          <p className="game__status" role="status">
            Detalles elegidos: {selectedSnowmanCategories(state)} de 4
          </p>

          <CombinationPreview title="Tu Copito" combination={state.selection} />

          <div className="snowman-options">
            {SNOWMAN_CATEGORIES.map((category) => (
              <section className="snowman-category" key={category}>
                <h3>{CATEGORY_LABELS[category]}</h3>
                <div className="snowman-category__options">
                  {VARIANT_META[category].map((variant, index) => {
                    const selected = state.selection[category] === index

                    return (
                      <button
                        key={variant.label}
                        type="button"
                        className={`snowman-option${selected ? ' snowman-option--selected' : ''}`}
                        onClick={() => choose(category, index)}
                        disabled={complete}
                        aria-pressed={selected}
                      >
                        <span
                          className={`snowman-option__glyph${
                            variant.tone ? ` snowman-option__glyph--${variant.tone}` : ''
                          }`}
                          aria-hidden="true"
                        >
                          <AssetGlyph asset={getAsset(variant.asset)} label={false} />
                        </span>
                        <span className="snowman-option__label">{variant.label}</span>
                      </button>
                    )
                  })}
                </div>
              </section>
            ))}
          </div>
        </>
      ) : null}

      {feedback ? (
        <p className="game__hint" role="status">
          {feedback}
        </p>
      ) : null}

      {complete ? (
        <div className="game__complete" role="status">
          <p>
            <strong>¡Has reconstruido la combinación de Copito!</strong>
          </p>
          <button type="button" className="button button--primary" onClick={onComplete}>
            Continuar
          </button>
        </div>
      ) : null}
    </div>
  )
}
