import { useState, type CSSProperties } from 'react'
import { getAsset, type AssetId } from '../../domain/assets'
import {
  HIDDEN_OBJECTS,
  HIDDEN_OBJECT_COUNT,
  createHiddenObjectsState,
  foundHiddenObjectCount,
  hiddenObjectHintRect,
  isHiddenObjectsComplete,
  markHiddenObject,
  nextUnfoundHiddenObject,
  type HiddenObject,
  type HiddenObjectId,
  type HiddenObjectsState,
  type HiddenZone,
} from '../../domain/games/hiddenObjects'
import { AssetGlyph } from '../AssetGlyph'
import type { MissionGameProps } from './types'

interface ObjectMeta {
  readonly asset: AssetId
  readonly label: string
}

const OBJECT_META: Readonly<Record<HiddenObjectId, ObjectMeta>> = {
  gift: { asset: 'game.hidden.gift', label: 'regalo' },
  bell: { asset: 'game.hidden.bell', label: 'campana' },
  candyCane: { asset: 'game.hidden.candyCane', label: 'bastón de caramelo' },
  santaHat: { asset: 'game.hidden.santaHat', label: 'gorro de Papá Noel' },
  blueBauble: { asset: 'game.hidden.blueBauble', label: 'bola azul' },
  star: { asset: 'game.hidden.star', label: 'estrella' },
}

const ZONE_LABELS: Readonly<Record<HiddenZone, string>> = {
  'top-center': 'la parte de arriba, en el centro',
  'top-staircase': 'la parte de arriba, junto a la escalera',
  'top-right': 'la parte de arriba a la derecha',
  'middle-left': 'la estantería de la izquierda, a media altura',
  'middle-right': 'la zona central de la derecha',
  'bottom-center': 'la parte de abajo, en el centro',
}

const ZOOM_MIN = 1
const ZOOM_MAX = 2.5
const ZOOM_STEP = 0.25
const PAN_LIMIT = 150
const PAN_STEP = 34

function percentStyle(rect: {
  x: number
  y: number
  width: number
  height: number
}): CSSProperties {
  return {
    left: `${rect.x * 100}%`,
    top: `${rect.y * 100}%`,
    width: `${rect.width * 100}%`,
    height: `${rect.height * 100}%`,
  }
}

function clampPan(value: number): number {
  return Math.min(PAN_LIMIT, Math.max(-PAN_LIMIT, value))
}

/**
 * Day 19: find the six approved objects in the final workshop scene. The scene
 * can be zoomed and panned, the zone help highlights a region, and a wrong tap
 * is only feedback. The image itself is the only background; objects are
 * invisible hit areas until found.
 */
export function HiddenObjectsGame({ onComplete }: MissionGameProps) {
  const [state, setState] = useState<HiddenObjectsState>(() =>
    createHiddenObjectsState(),
  )
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [hint, setHint] = useState<HiddenObject | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)
  const found = foundHiddenObjectCount(state)
  const complete = isHiddenObjectsComplete(state)

  function findObject(object: HiddenObject) {
    if (complete) {
      return
    }

    const outcome = markHiddenObject(state, object.id)

    if (outcome.result === 'already-found') {
      setFeedback('Ese objeto ya está encontrado.')
      return
    }

    if (outcome.result === 'found') {
      setState(outcome.state)
      setHint(null)
      setFeedback(`¡Has encontrado ${OBJECT_META[object.id].label}!`)
    }
  }

  function revealZone() {
    const object = nextUnfoundHiddenObject(state)

    if (!object) {
      return
    }

    setHint(object)
    setFeedback(`Prueba a mirar en ${ZONE_LABELS[object.zone]}.`)
  }

  function changeZoom(delta: number) {
    const next = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, zoom + delta))
    setZoom(next)

    if (next === ZOOM_MIN) {
      setPan({ x: 0, y: 0 })
    }
  }

  function movePan(dx: number, dy: number) {
    setPan((current) => ({
      x: clampPan(current.x + dx),
      y: clampPan(current.y + dy),
    }))
  }

  function resetView() {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }

  return (
    <div className="game game--hidden">
      <p className="game__lead">
        El taller de Trasto está patas arriba. Busca el regalo del centro, la campana
        de la estantería izquierda, el bastón de caramelo que asoma tras la taza verde,
        el gorro de Papá Noel de arriba, la bola azul de arriba a la derecha y la
        estrella que brilla sobre la escalera. Toca o haz clic en la escena donde creas
        que están. Puedes acercar la escena, moverla y pedir una ayuda de zona. Si no
        aciertas, no pasa nada: prueba otra vez.
      </p>

      <p className="game__status" role="status">
        Objetos encontrados: {found} de {HIDDEN_OBJECT_COUNT}
      </p>

      <ul className="hidden-checklist" aria-label="Objetos que hay que encontrar">
        {HIDDEN_OBJECTS.map((object) => {
          const isFound = state.found.includes(object.id)

          return (
            <li
              key={object.id}
              className={`hidden-check${isFound ? ' hidden-check--found' : ''}`}
            >
              <span aria-hidden="true">
                <AssetGlyph asset={getAsset(OBJECT_META[object.id].asset)} label={false} />
              </span>
              <span>{OBJECT_META[object.id].label}</span>
              {isFound ? <span aria-hidden="true">✓</span> : null}
            </li>
          )
        })}
      </ul>

      <div className="hidden-controls">
        <div className="game__actions">
          <button
            type="button"
            className="button button--secondary"
            onClick={() => changeZoom(-ZOOM_STEP)}
            disabled={zoom <= ZOOM_MIN}
            aria-label="Alejar la escena"
          >
            − Alejar
          </button>
          <button
            type="button"
            className="button button--secondary"
            onClick={() => changeZoom(ZOOM_STEP)}
            disabled={zoom >= ZOOM_MAX}
            aria-label="Acercar la escena"
          >
            + Acercar
          </button>
          <button type="button" className="button button--secondary" onClick={resetView}>
            Ver escena completa
          </button>
          <button
            type="button"
            className="button button--secondary"
            onClick={revealZone}
            disabled={complete}
          >
            Ayuda de zona
          </button>
        </div>

        <div className="hidden-pan" role="group" aria-label="Mover la escena">
          <button
            type="button"
            className="hidden-pan__button hidden-pan__button--up"
            onClick={() => movePan(0, -PAN_STEP)}
            aria-label="Mover la escena hacia arriba"
            disabled={zoom <= ZOOM_MIN}
          >
            ↑
          </button>
          <button
            type="button"
            className="hidden-pan__button hidden-pan__button--left"
            onClick={() => movePan(-PAN_STEP, 0)}
            aria-label="Mover la escena a la izquierda"
            disabled={zoom <= ZOOM_MIN}
          >
            ←
          </button>
          <button
            type="button"
            className="hidden-pan__button hidden-pan__button--down"
            onClick={() => movePan(0, PAN_STEP)}
            aria-label="Mover la escena hacia abajo"
            disabled={zoom <= ZOOM_MIN}
          >
            ↓
          </button>
          <button
            type="button"
            className="hidden-pan__button hidden-pan__button--right"
            onClick={() => movePan(PAN_STEP, 0)}
            aria-label="Mover la escena a la derecha"
            disabled={zoom <= ZOOM_MIN}
          >
            →
          </button>
        </div>
      </div>

      {hint ? (
        <p className="hidden-hint-character">
          <AssetGlyph
            asset={getAsset('brand.trasto.points')}
            label={false}
            className="hidden-hint-character__image"
          />
          <span>Trasto señala la zona donde hay algo escondido.</span>
        </p>
      ) : null}

      <div className="hidden-scene" aria-label="Escena del taller con objetos ocultos">
        <div
          className="hidden-scene__canvas"
          style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
        >
          <AssetGlyph
            asset={getAsset('game.hidden.scene')}
            label={false}
            className="hidden-scene__image"
            priority
          />

          {HIDDEN_OBJECTS.map((object) => {
            const isFound = state.found.includes(object.id)

            return (
              <button
                key={object.id}
                type="button"
                className={`hidden-object${
                  isFound ? ' hidden-object--found' : ' hidden-object--secret'
                }`}
                style={percentStyle(object.rect)}
                onClick={() => findObject(object)}
                disabled={complete || isFound}
                aria-label={
                  isFound
                    ? `${OBJECT_META[object.id].label}, encontrado`
                    : 'Objeto oculto. Toca o haz clic aquí para buscar.'
                }
              >
                {isFound ? (
                  <>
                    <span aria-hidden="true">
                      <AssetGlyph asset={getAsset(OBJECT_META[object.id].asset)} label={false} />
                    </span>
                    <span className="hidden-object__check" aria-hidden="true">
                      ✓
                    </span>
                  </>
                ) : null}
              </button>
            )
          })}

          {hint ? (
            <span
              className="hidden-hint-zone"
              style={percentStyle(hiddenObjectHintRect(hint))}
              aria-hidden="true"
            />
          ) : null}
        </div>
      </div>

      {feedback ? (
        <p className="game__hint" role="status">
          {feedback}
        </p>
      ) : null}

      {complete ? (
        <div className="game__complete" role="status">
          <p>
            <strong>¡Has encontrado los seis objetos del taller!</strong>
          </p>
          <button type="button" className="button button--primary" onClick={onComplete}>
            Continuar
          </button>
        </div>
      ) : null}
    </div>
  )
}
