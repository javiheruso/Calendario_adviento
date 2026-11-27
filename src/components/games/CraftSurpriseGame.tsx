import { useState } from 'react'
import { getAsset, type AssetId } from '../../domain/assets'
import {
  CRAFT_SURPRISE_OPTIONS,
  confirmCraftSurprise,
  createCraftSurpriseState,
  isCraftSurpriseComplete,
  selectCraftSurprise,
  selectedCraftOption,
  type CraftSurpriseKind,
} from '../../domain/games/craftSurprise'
import { AssetGlyph } from '../AssetGlyph'
import type { MissionGameProps } from './types'

const CRAFT_ASSETS: Readonly<Record<CraftSurpriseKind, AssetId>> = {
  drawing: 'game.craft.drawing',
  letter: 'game.craft.letter',
  craft: 'game.craft.craft',
}

/**
 * Day 23: choose a drawing, a letter or a craft for Trasto, confirm it manually
 * and show his farewell. Photos and video stay out of this phase, so no camera
 * or recording API is requested.
 */
export function CraftSurpriseGame({ onComplete }: MissionGameProps) {
  const [state, setState] = useState(createCraftSurpriseState)
  const selected = selectedCraftOption(state)
  const complete = isCraftSurpriseComplete(state)

  return (
    <div className="game game--craft">
      <p className="game__lead">
        Trasto se marcha pronto al Polo Norte y quiere llevarse algo tuyo. Elige un
        dibujo, una carta o una manualidad, prepáralo con calma y deja la sorpresa
        bajo el árbol hasta Nochebuena. Un adulto confirma que está lista.
      </p>

      <ul className="craft-options" aria-label="Elige una sorpresa para Trasto">
        {CRAFT_SURPRISE_OPTIONS.map((option) => {
          const isSelected = state.selected === option.id

          return (
            <li key={option.id}>
              <button
                type="button"
                className={`craft-option${isSelected ? ' craft-option--selected' : ''}`}
                onClick={() => setState((current) => selectCraftSurprise(current, option.id))}
                aria-pressed={isSelected}
                disabled={complete}
              >
                <span className="craft-option__glyph" aria-hidden="true">
                  <AssetGlyph asset={getAsset(CRAFT_ASSETS[option.id])} label={false} />
                </span>
                <span className="craft-option__label">{option.label}</span>
                <span className="craft-option__detail">{option.detail}</span>
                <span className="craft-option__mark" aria-hidden="true">
                  {isSelected ? '✓' : '○'}
                </span>
              </button>
            </li>
          )
        })}
      </ul>

      {selected ? (
        <div className="notice" role="status">
          <p>
            <strong>Has elegido: {selected.label.toLowerCase()}.</strong>{' '}
            {selected.detail}
          </p>
          {!complete ? (
            <button
              type="button"
              className="button button--primary"
              onClick={() => setState((current) => confirmCraftSurprise(current))}
            >
              Confirmar que la sorpresa está lista
            </button>
          ) : null}
        </div>
      ) : (
        <p className="game__hint">
          Elige una de las tres opciones para ver el botón de confirmación.
        </p>
      )}

      {complete ? (
        <div className="game__complete" role="status">
          <p className="craft-farewell">
            <span className="craft-farewell__glyph" aria-hidden="true">
              <AssetGlyph asset={getAsset('game.craft.farewell')} label={false} />
            </span>
            <span>
              <strong>Trasto se despide con una sonrisa enorme.</strong> Guardará tu
              sorpresa hasta la noche más mágica del año. ¡Gracias por pensar en él!
            </span>
          </p>
          <button type="button" className="button button--primary" onClick={onComplete}>
            Continuar
          </button>
        </div>
      ) : null}
    </div>
  )
}
