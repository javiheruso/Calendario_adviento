import { useState } from 'react'
import { getAsset, type AssetId } from '../../domain/assets'
import {
  CHARADES_ROUNDS,
  confirmCharadeHit,
  createCharadesState,
  currentCharadeAnimal,
  isCharadesComplete,
  toggleCharadeAnimal,
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
 * Day 17: three animals drawn from a bank of twelve. The card is hidden by
 * default so only the actor decides to look; nothing plays audio that could
 * reveal the answer. The family confirms each guessed animal manually and no
 * camera is requested.
 */
export function CharadesGame({ onComplete }: MissionGameProps) {
  const [state, setState] = useState(createCharadesState)
  const animal = currentCharadeAnimal(state)
  const complete = isCharadesComplete(state)
  const visible = state.animalVisible

  return (
    <div className="game game--charades">
      <p className="game__lead">
        Trasto ha elegido tres animales al azar. Quien imita pulsa «Mostrar animal»
        para verlo sin que nadie más mire, y lo esconde antes de empezar. No se
        puede hablar ni hacer ruidos que digan la respuesta. Cada acierto se marca
        a mano: no hay cámara, cronómetro ni castigos.
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
                <span>La carta está tapada. Solo la ve quien imita.</span>
              )}
            </p>
            <button
              type="button"
              className="button button--secondary"
              onClick={() => setState((current) => toggleCharadeAnimal(current))}
            >
              {visible ? 'Ocultar animal' : 'Mostrar animal (solo quien imita)'}
            </button>
          </section>

          <button
            type="button"
            className="button button--primary"
            onClick={() => setState((current) => confirmCharadeHit(current))}
          >
            ¡Acertado! Marcar acierto
          </button>

          <p className="game__hint">
            Recordatorio: sin voz, sin sonidos y sin señalar la carta. Solo mímica.
          </p>
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
