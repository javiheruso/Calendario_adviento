import { useState, type CSSProperties, type MouseEvent } from 'react'
import { getAsset } from '../../domain/assets'
import {
  SPOT_DIFFERENCES,
  SPOT_DIFFERENCE_COUNT,
  createSpotDifferenceState,
  foundSpotCount,
  isSpotDifferenceComplete,
  markSpotDifference,
  nextUnfoundSpot,
  spotHintRect,
  type DifferenceSpot,
  type SpotDifferenceId,
  type SpotDifferenceState,
  type SpotZone,
} from '../../domain/games/spotDifference'
import { AssetGlyph } from '../AssetGlyph'
import type { MissionGameProps } from './types'

const ZONE_LABELS: Readonly<Record<SpotZone, string>> = {
  'top-left': 'la parte de arriba a la izquierda',
  'upper-left': 'la zona alta de la izquierda',
  'middle-left': 'la zona central de la izquierda',
  center: 'la zona central',
  'middle-right': 'la zona central de la derecha',
  'bottom-right': 'la parte de abajo a la derecha',
  'bottom-center': 'la parte de abajo, en el centro',
}

const MISS_MESSAGE = 'Ese trozo no ha cambiado. Sin prisa: mira otra vez y sigue probando.'
const FOUND_MESSAGE = '¡Una diferencia encontrada! Ya queda marcada en las dos imágenes.'
const ALREADY_MESSAGE = 'Esa diferencia ya estaba encontrada.'

function percentStyle(x: number, y: number, width: number, height: number): CSSProperties {
  return {
    left: `${x * 100}%`,
    top: `${y * 100}%`,
    width: `${width * 100}%`,
    height: `${height * 100}%`,
  }
}

interface ScenePanelProps {
  readonly title: string
  readonly sceneAssetId: 'game.spot.scene.a' | 'game.spot.scene.b'
  readonly found: readonly SpotDifferenceId[]
  readonly hintSpot: DifferenceSpot | null
  readonly disabled: boolean
  readonly onPoint: (x: number, y: number) => void
  readonly onMarkSpot: (spot: DifferenceSpot) => void
}

function ScenePanel({
  title,
  sceneAssetId,
  found,
  hintSpot,
  disabled,
  onPoint,
  onMarkSpot,
}: ScenePanelProps) {
  function handleClick(event: MouseEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect()
    onPoint(
      (event.clientX - rect.left) / rect.width,
      (event.clientY - rect.top) / rect.height,
    )
  }

  return (
    <div className="spot-scene-wrap">
      <p className="spot-scene__title">{title}</p>
      <div
        className="spot-scene"
        onClick={handleClick}
        role="group"
        aria-label={`${title}: ilustración para buscar diferencias`}
      >
        <AssetGlyph
          asset={getAsset(sceneAssetId)}
          label={false}
          className="spot-scene__image"
          priority
        />

        {hintSpot ? (
          <span
            className="spot-hint-zone"
            style={percentStyle(
              spotHintRect(hintSpot).x,
              spotHintRect(hintSpot).y,
              spotHintRect(hintSpot).width,
              spotHintRect(hintSpot).height,
            )}
            aria-hidden="true"
          />
        ) : null}

        {SPOT_DIFFERENCES.map((spot) => {
          const isFound = found.includes(spot.id)

          return (
            <button
              key={spot.id}
              type="button"
              className={`spot-hotspot${isFound ? ' spot-hotspot--found' : ''}`}
              style={percentStyle(
                spot.rect.x,
                spot.rect.y,
                spot.rect.width,
                spot.rect.height,
              )}
              onClick={(event) => {
                event.stopPropagation()
                onMarkSpot(spot)
              }}
              disabled={disabled || isFound}
              aria-label={isFound ? 'Diferencia encontrada' : 'Marcar esta zona'}
            >
              {isFound ? <span aria-hidden="true">✓</span> : null}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/**
 * Day 6: find the seven approved changes in the final workshop illustrations.
 * Both pictures are markable, the zone hint points at a region without
 * revealing the exact spot, and a single-image view is available for small
 * screens.
 */
export function SpotDifferenceGame({ onComplete }: MissionGameProps) {
  const [state, setState] = useState<SpotDifferenceState>(() =>
    createSpotDifferenceState(),
  )
  const [mode, setMode] = useState<'both' | 'alternate'>('both')
  const [alternateSide, setAlternateSide] = useState<'left' | 'right'>('left')
  const [hintSpot, setHintSpot] = useState<DifferenceSpot | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)
  const found = foundSpotCount(state)
  const complete = isSpotDifferenceComplete(state)

  function markAt(x: number, y: number) {
    if (complete) {
      return
    }

    const outcome = markSpotDifference(state, x, y)

    if (outcome.result === 'miss') {
      setFeedback(MISS_MESSAGE)
      return
    }

    if (outcome.result === 'already-found') {
      setFeedback(ALREADY_MESSAGE)
      return
    }

    setState(outcome.state)
    setHintSpot(null)
    setFeedback(FOUND_MESSAGE)
  }

  function markSpot(spot: DifferenceSpot) {
    markAt(
      spot.rect.x + spot.rect.width / 2,
      spot.rect.y + spot.rect.height / 2,
    )
  }

  function revealZone() {
    const spot = nextUnfoundSpot(state)

    if (!spot) {
      return
    }

    setHintSpot(spot)
    setFeedback(`Prueba a mirar en ${ZONE_LABELS[spot.zone]}.`)
  }

  const leftPanel = (
    <ScenePanel
      title="Taller A"
      sceneAssetId="game.spot.scene.a"
      found={state.found}
      hintSpot={hintSpot}
      disabled={complete}
      onPoint={markAt}
      onMarkSpot={markSpot}
    />
  )
  const rightPanel = (
    <ScenePanel
      title="Taller B"
      sceneAssetId="game.spot.scene.b"
      found={state.found}
      hintSpot={hintSpot}
      disabled={complete}
      onPoint={markAt}
      onMarkSpot={markSpot}
    />
  )

  return (
    <div className="game game--spot">
      <p className="game__lead">
        Los dos talleres parecen iguales, pero esconden siete cambios. Toca la
        diferencia en cualquiera de las dos imágenes: quedará marcada en ambas. Si te
        atascas, pide una pista de zona.
      </p>

      <p className="game__status" role="status">
        Diferencias encontradas: {found} de {SPOT_DIFFERENCE_COUNT}
      </p>

      <div className="game__actions">
        <button
          type="button"
          className="button button--secondary"
          onClick={() =>
            setMode((current) => (current === 'both' ? 'alternate' : 'both'))
          }
          aria-pressed={mode === 'alternate'}
        >
          {mode === 'both' ? 'Ver de una en una' : 'Ver las dos a la vez'}
        </button>
        <button
          type="button"
          className="button button--secondary"
          onClick={revealZone}
          disabled={complete}
        >
          Pista de zona
        </button>
      </div>

      {mode === 'both' ? (
        <div className="spot-scenes spot-scenes--both">
          {leftPanel}
          {rightPanel}
        </div>
      ) : (
        <div className="spot-scenes spot-scenes--alternate">
          <div className="spot-switcher" role="group" aria-label="Elegir imagen">
            <button
              type="button"
              className="button button--secondary"
              onClick={() => setAlternateSide('left')}
              aria-pressed={alternateSide === 'left'}
            >
              Taller A
            </button>
            <button
              type="button"
              className="button button--secondary"
              onClick={() => setAlternateSide('right')}
              aria-pressed={alternateSide === 'right'}
            >
              Taller B
            </button>
          </div>
          {alternateSide === 'left' ? leftPanel : rightPanel}
        </div>
      )}

      {feedback ? (
        <p className="game__hint" role="status">
          {feedback}
        </p>
      ) : null}

      {complete ? (
        <div className="game__complete" role="status">
          <p>
            <strong>¡Has encontrado las siete diferencias!</strong>
          </p>
          <button type="button" className="button button--primary" onClick={onComplete}>
            Continuar
          </button>
        </div>
      ) : null}
    </div>
  )
}
