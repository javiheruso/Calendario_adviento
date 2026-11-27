import { useState } from 'react'
import { getAsset, type AssetId } from '../../domain/assets'
import {
  FINAL_CRYSTALS,
  completeFinalCrystal,
  completedCrystalCount,
  createFinalMissionState,
  currentFinalCrystal,
  isFinalMissionComplete,
  type FinalCrystal,
} from '../../domain/games/finalMission'
import { AssetGlyph } from '../AssetGlyph'
import type { MissionGameProps } from './types'
import { IntelligenceCrystal } from './finale/IntelligenceCrystal'
import { MagicCrystal } from './finale/MagicCrystal'
import { MemoryCrystal } from './finale/MemoryCrystal'

interface CrystalMeta {
  readonly title: string
  readonly asset: AssetId
}

const CRYSTAL_META: Readonly<Record<FinalCrystal, CrystalMeta>> = {
  intelligence: {
    title: 'Inteligencia',
    asset: 'game.final.crystal.intelligence',
  },
  memory: {
    title: 'Memoria',
    asset: 'game.final.crystal.memory',
  },
  magic: {
    title: 'Magia',
    asset: 'game.final.crystal.magic',
  },
}

function FinalScene({ onContinue }: { onContinue: () => void }) {
  return (
    <section className="finale-scene finale-scene--lit" aria-labelledby="finale-scene-title">
      <div className="finale-scene__sleigh" aria-hidden="true">
        <AssetGlyph asset={getAsset('game.final.sleigh')} label={false} />
      </div>
      <h3 id="finale-scene-title">¡El trineo se ha iluminado!</h3>
      <p>
        Los tres cristales brillan a la vez. Trasto ya puede volver con Papá Noel
        esta noche y recoger la sorpresa que has preparado.
      </p>
      <div className="finale-celebration" role="status">
        <p>
          <strong>¡Misión final superada!</strong> Has activado el cristal de la
          inteligencia, el de la memoria y el de la magia. Tu progreso queda
          guardado y el árbol mostrará tu estrella.
        </p>
        <p>
          El álbum de recuerdos guardará este día cuando la cámara esté disponible.
          Ahora toca descubrir la última pista y celebrarlo en familia.
        </p>
      </div>
      <p className="finale-scene__album">
        <span aria-hidden="true">
          <AssetGlyph asset={getAsset('game.final.album')} label={false} />
        </span>{' '}
        Un recuerdo más para el álbum familiar.
      </p>
      <button type="button" className="button button--primary" onClick={onContinue}>
        Ver la última pista
      </button>
    </section>
  )
}

/**
 * Day 24 final mission: activate the intelligence, memory and magic crystals in
 * order. Each crystal is a self-contained game. When all three are lit, a
 * provisional illuminated-sleigh scene celebrates progress and hands the child
 * back to the existing hint and gift/star flow. There is no timer.
 */
export function FinaleGame({ onComplete }: MissionGameProps) {
  const [mission, setMission] = useState(createFinalMissionState)
  const current = currentFinalCrystal(mission)
  const complete = isFinalMissionComplete(mission)
  const litCount = completedCrystalCount(mission)

  function solve(crystal: FinalCrystal) {
    setMission((state) => completeFinalCrystal(state, crystal))
  }

  return (
    <div className="game game--finale">
      <p className="game__lead">
        La última gran misión tiene tres cristales. Enciende uno detrás de otro: la
        inteligencia, la memoria y la magia. No hay cronómetro; puedes tomarte el
        tiempo que necesites.
      </p>

      <ol className="finale-crystals" aria-label="Los tres cristales de la misión final">
        {FINAL_CRYSTALS.map((crystal) => {
          const done = mission.completed.includes(crystal)
          const active = current === crystal

          return (
            <li
              key={crystal}
              className={`finale-crystal${done ? ' finale-crystal--complete' : ''}${
                active ? ' finale-crystal--active' : ''
              }`}
            >
              <span className="finale-crystal__glyph" aria-hidden="true">
                <AssetGlyph asset={getAsset(CRYSTAL_META[crystal].asset)} label={false} />
              </span>
              <span className="finale-crystal__label">
                {CRYSTAL_META[crystal].title}
              </span>
              <span className="finale-crystal__state" aria-hidden="true">
                {done ? '✓' : active ? '•' : '·'}
              </span>
            </li>
          )
        })}
      </ol>

      <p className="game__status" role="status">
        Cristales encendidos: {litCount} de {FINAL_CRYSTALS.length}
      </p>

      {current === 'intelligence' ? (
        <IntelligenceCrystal onSolved={() => solve('intelligence')} />
      ) : null}
      {current === 'memory' ? (
        <MemoryCrystal onSolved={() => solve('memory')} />
      ) : null}
      {current === 'magic' ? (
        <MagicCrystal onSolved={() => solve('magic')} />
      ) : null}

      {complete ? <FinalScene onContinue={onComplete} /> : null}
    </div>
  )
}
