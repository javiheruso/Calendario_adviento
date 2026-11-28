import { useEffect, useState } from 'react'
import { getAsset, type AssetId } from '../../domain/assets'
import {
  SNOWMAN_OBSERVE_SECONDS,
  SNOWMAN_PHASE_COUNT,
  chooseSnowmanOption,
  completedSnowmanPhases,
  createSnowmanState,
  currentSnowmanPhase,
  isSnowmanComplete,
  startSnowmanBuilding,
  type SnowmanCategory,
  type SnowmanState,
} from '../../domain/games/snowman'
import { AssetGlyph } from '../AssetGlyph'
import { CountdownAnnouncer } from '../CountdownAnnouncer'
import type { MissionGameProps } from './types'

const CATEGORY_LABELS: Readonly<Record<SnowmanCategory, string>> = {
  hat: 'Sombrero',
  nose: 'Nariz',
  scarf: 'Bufanda',
  buttons: 'Botones',
}

const SNOWMAN_ANNOUNCEMENT_MILESTONES = [10, 5, 0] as const

const OPTION_ASSETS: Readonly<Record<SnowmanCategory, Readonly<Record<string, AssetId>>>> = {
  hat: {
    top: 'game.snowman.option.hat.top',
    santa: 'game.snowman.option.hat.santa',
    green: 'game.snowman.option.hat.green',
  },
  nose: {
    carrot: 'game.snowman.option.nose.carrot',
    button: 'game.snowman.option.nose.button',
    pompon: 'game.snowman.option.nose.pompon',
  },
  scarf: {
    red: 'game.snowman.option.scarf.red',
    blue: 'game.snowman.option.scarf.blue',
    green: 'game.snowman.option.scarf.green',
  },
  buttons: {
    coal: 'game.snowman.option.buttons.coal',
    colors: 'game.snowman.option.buttons.colors',
    gold: 'game.snowman.option.buttons.gold',
  },
}

/** Complete phase images in consecutive order: base plus one per solved phase. */
const PHASE_ASSETS: readonly AssetId[] = [
  'game.snowman.phase.base',
  'game.snowman.phase.hat',
  'game.snowman.phase.nose',
  'game.snowman.phase.scarf',
  'game.snowman.phase.buttons',
]

function optionAsset(category: SnowmanCategory, optionId: string): AssetId {
  return OPTION_ASSETS[category][optionId] ?? PHASE_ASSETS[0]
}

function PhaseGallery({ count, title }: { count: number; title: string }) {
  const visible = PHASE_ASSETS.slice(0, Math.max(1, Math.min(PHASE_ASSETS.length, count + 1)))

  return (
    <section className="snowman-gallery" aria-label={title}>
      <p className="snowman-gallery__title">{title}</p>
      <ol className="snowman-gallery__list">
        {visible.map((assetId) => (
          <li key={assetId}>
            <AssetGlyph asset={getAsset(assetId)} label={false} className="snowman-gallery__image" />
          </li>
        ))}
      </ol>
    </section>
  )
}

/**
 * Day 21: observe Copito's fixed model for fifteen seconds, then recreate it
 * phase by phase. Each phase offers three complete options; a wrong choice is
 * kind feedback and never advances or penalises. The complete phase images are
 * the only visuals used for the model and the rebuilt snowman, so nothing is
 * layered or combined.
 */
export function SnowmanGame({ onComplete }: MissionGameProps) {
  const [state, setState] = useState<SnowmanState>(() => createSnowmanState())
  const [secondsLeft, setSecondsLeft] = useState(SNOWMAN_OBSERVE_SECONDS)
  const [showModel, setShowModel] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)
  const complete = isSnowmanComplete(state)
  const observing = state.stage === 'observing'
  const phase = currentSnowmanPhase(state)
  const solvedPhases = completedSnowmanPhases(state)

  useEffect(() => {
    if (state.stage !== 'observing') {
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
  }, [state.stage, secondsLeft])

  function choose(category: SnowmanCategory, optionId: string, label: string) {
    const next = chooseSnowmanOption(state, optionId)
    setState(next)

    if (isSnowmanComplete(next)) {
      setFeedback('¡Copito está vestido igual que antes!')
      return
    }

    if (next.lastResult === 'wrong') {
      setFeedback(
        `No pasa nada: Copito te sonríe. Ese no es el detalle correcto. Prueba otra vez con ${CATEGORY_LABELS[category].toLowerCase()}.`,
      )
      return
    }

    if (next.lastResult === 'correct') {
      setFeedback(`¡Bien! ${label} es correcto. Copito ya tiene un detalle más.`)
    }
  }

  return (
    <div className="game game--snowman">
      <p className="game__lead">
        Copito se ha vestido y luego se ha olvidado de cómo iba. Míralo durante quince
        segundos. Después reconstruye su modelo paso a paso: sombrero, nariz, bufanda y
        botones. En cada paso tienes tres opciones completas y puedes consultar el
        modelo cuando quieras. No hay castigos ni límite de intentos.
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
          <figure className="snowman-model">
            <AssetGlyph
              asset={getAsset('game.snowman.phase.buttons')}
              label={false}
              className="snowman-model__image"
              priority
            />
            <figcaption className="snowman-model__caption">
              Sombrero de copa, nariz de zanahoria, bufanda roja y botones de carbón.
            </figcaption>
          </figure>
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
          </div>

          {showModel && !complete ? (
            <figure className="snowman-model snowman-model--consult">
              <AssetGlyph
                asset={getAsset('game.snowman.phase.buttons')}
                label={false}
                className="snowman-model__image"
                priority
              />
              <figcaption className="snowman-model__caption">
                Modelo: sombrero de copa, nariz de zanahoria, bufanda roja y botones de
                carbón.
              </figcaption>
            </figure>
          ) : null}

          <p className="game__status" role="status">
            Pasos completados: {solvedPhases} de {SNOWMAN_PHASE_COUNT}
          </p>

          <PhaseGallery count={solvedPhases} title="Copito va así" />

          {phase && !complete ? (
            <section className="snowman-step" aria-labelledby="snowman-step-title">
              <h3 id="snowman-step-title">{phase.title}</h3>
              <p className="game__hint">¿Qué detalle llevaba Copito en este paso?</p>
              <div className="snowman-category__options">
                {phase.options.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    className="snowman-option"
                    onClick={() => choose(phase.category, option.id, option.label)}
                    disabled={complete}
                  >
                    <span className="snowman-option__glyph" aria-hidden="true">
                      <AssetGlyph
                        asset={getAsset(optionAsset(phase.category, option.id))}
                        label={false}
                        className="snowman-option__image"
                      />
                    </span>
                    <span className="snowman-option__label">{option.label}</span>
                  </button>
                ))}
              </div>
            </section>
          ) : null}
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
