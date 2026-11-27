import { useState } from 'react'
import { getAsset, type AssetId } from '../../domain/assets'
import {
  RED_OUTFIT_ITEM_IDS,
  checkedRedOutfitItems,
  createRedOutfitState,
  isRedOutfitComplete,
  toggleRedOutfitItem,
  type RedOutfitItemId,
} from '../../domain/games/redOutfit'
import { AssetGlyph } from '../AssetGlyph'
import type { MissionGameProps } from './types'

interface RedOutfitItemMeta {
  readonly asset: AssetId
  readonly label: string
  readonly detail: string
}

const ITEM_META: Readonly<Record<RedOutfitItemId, RedOutfitItemMeta>> = {
  'red-garment-one': {
    asset: 'game.red.garment.one',
    label: 'Primera prenda roja',
    detail: 'Ponte una camiseta, un jersey o una chaqueta roja.',
  },
  'red-garment-two': {
    asset: 'game.red.garment.two',
    label: 'Segunda prenda roja',
    detail: 'Añade otra prenda roja: bufanda, gorro o calcetines.',
  },
  'red-object': {
    asset: 'game.red.object',
    label: 'Un objeto rojo',
    detail: 'Busca algo rojo para posar con él en la foto.',
  },
}

/**
 * Day 3: a manual checklist for two red garments and one red object. There is
 * no camera and no automatic validation; the family confirms the result.
 */
export function RedOutfitGame({ onComplete }: MissionGameProps) {
  const [state, setState] = useState(createRedOutfitState)
  const checked = checkedRedOutfitItems(state)
  const complete = isRedOutfitComplete(state)

  return (
    <div className="game game--red-outfit">
      <p className="game__lead">
        Trasto ha teñido de rojo la casa. Busca dos prendas rojas y un objeto rojo,
        póntelo todo y prepara tu pose más roja. Marca las tres cosas cuando las
        tengas: un adulto confirma el resultado y no hay ninguna prisa.
      </p>

      <p className="game__status" role="status">
        Marcadas {checked} de {RED_OUTFIT_ITEM_IDS.length} cosas rojas
      </p>

      <ul className="checklist" aria-label="Checklist de la invasión roja">
        {RED_OUTFIT_ITEM_IDS.map((itemId) => {
          const meta = ITEM_META[itemId]
          const isChecked = state.checked[itemId]

          return (
            <li key={itemId}>
              <button
                type="button"
                className={`checklist-item${isChecked ? ' checklist-item--checked' : ''}`}
                onClick={() => setState((current) => toggleRedOutfitItem(current, itemId))}
                aria-pressed={isChecked}
              >
                <span className="checklist-item__glyph" aria-hidden="true">
                  <AssetGlyph asset={getAsset(meta.asset)} label={false} />
                </span>
                <span className="checklist-item__text">
                  <span className="checklist-item__label">{meta.label}</span>
                  <span className="checklist-item__detail">{meta.detail}</span>
                </span>
                <span className="checklist-item__mark" aria-hidden="true">
                  {isChecked ? '✓' : '○'}
                </span>
              </button>
            </li>
          )
        })}
      </ul>

      {complete ? (
        <div className="game__complete" role="status">
          <p>
            <strong>¡La invasión roja está completa!</strong> Un adulto puede dar el
            visto bueno a la pose con las dos prendas y el objeto rojo.
          </p>
          <button type="button" className="button button--primary" onClick={onComplete}>
            Confirmar la invasión roja
          </button>
        </div>
      ) : (
        <p className="game__hint">
          Cuando estén las tres cosas marcadas aparecerá el botón para confirmar.
        </p>
      )}
    </div>
  )
}
