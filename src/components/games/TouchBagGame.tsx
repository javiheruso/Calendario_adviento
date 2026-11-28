import { useState } from 'react'
import { getAsset } from '../../domain/assets'
import {
  TOUCH_BAG_HITS,
  TOUCH_BAG_SLOT_IDS,
  createTouchBagState,
  isTouchBagComplete,
  markedTouchBagHits,
  toggleTouchBagHit,
  type TouchBagSlotId,
} from '../../domain/games/touchBag'
import { AssetGlyph } from '../AssetGlyph'
import type { MissionGameProps } from './types'

const SLOT_LABELS: Readonly<Record<TouchBagSlotId, string>> = {
  first: 'Primer objeto identificado',
  second: 'Segundo objeto identificado',
  third: 'Tercer objeto identificado',
}

/**
 * Day 20: three safe objects inside an opaque bag. The family chooses the
 * objects privately; the child identifies them by touch only, without looking,
 * and the family marks three hits manually. The child surface deliberately
 * contains no example-object list. No camera is used and a mark can be undone
 * without penalty.
 */
export function TouchBagGame({ onComplete }: MissionGameProps) {
  const [state, setState] = useState(createTouchBagState)
  const marked = markedTouchBagHits(state)
  const complete = isTouchBagComplete(state)

  return (
    <div className="game game--touch-bag">
      <p className="game__lead">
        Un adulto prepara una bolsa opaca con tres objetos seguros que haya elegido
        sin que la niña los vea. Sin mirar dentro, mete la mano y adivina qué es cada
        objeto solo con el tacto. Marca cada acierto cuando lo adivinéis entre todos.
      </p>

      <div className="touch-bag-stage">
        <p className="touch-bag-stage__glyph" aria-hidden="true">
          <AssetGlyph
            asset={getAsset(complete ? 'game.touch.bag.open' : 'game.touch.bag')}
            label={false}
            className="touch-bag-stage__image"
            priority
          />
        </p>
        <p className="touch-bag-stage__hand" aria-hidden="true">
          <AssetGlyph asset={getAsset('game.touch.hand')} label={false} />
        </p>
        <p className="touch-bag-stage__note">
          La bolsa se queda fuera de la vista. Nada de mirar por la abertura.
        </p>
      </div>

      <p className="game__status" role="status">
        Aciertos marcados: {marked} de {TOUCH_BAG_HITS}
      </p>

      <ul className="checklist" aria-label="Marcador de aciertos del saco misterioso">
        {TOUCH_BAG_SLOT_IDS.map((slotId, index) => {
          const isChecked = state.marked[slotId]

          return (
            <li key={slotId}>
              <button
                type="button"
                className={`checklist-item${isChecked ? ' checklist-item--checked' : ''}`}
                onClick={() => setState((current) => toggleTouchBagHit(current, slotId))}
                aria-pressed={isChecked}
              >
                <span className="checklist-item__glyph" aria-hidden="true">
                  <AssetGlyph
                    asset={getAsset(isChecked ? 'game.touch.hit' : 'game.touch.hand')}
                    label={false}
                  />
                </span>
                <span className="checklist-item__text">
                  <span className="checklist-item__label">
                    Acierto {index + 1}
                  </span>
                  <span className="checklist-item__detail">{SLOT_LABELS[slotId]}</span>
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
            <strong>¡Tres objetos identificados!</strong> El saco misterioso ya no
            tiene secretos para tus manos.
          </p>
          <button type="button" className="button button--primary" onClick={onComplete}>
            Continuar
          </button>
        </div>
      ) : (
        <p className="game__hint">
          Cuando estén los tres aciertos marcados aparecerá el botón para continuar.
          Si os habéis equivocado, podéis desmarcar y volver a probar.
        </p>
      )}
    </div>
  )
}
