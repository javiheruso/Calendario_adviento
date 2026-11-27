import { useState, type CSSProperties } from 'react'
import { getAsset } from '../../domain/assets'
import { resolveAssetPath } from '../../domain/assetPath'
import {
  JIGSAW_SIZE,
  createJigsawBoard,
  isJigsawSolved,
  swapJigsawTiles,
} from '../../domain/games/jigsaw'
import type { MissionGameProps } from './types'

const PORTRAIT = getAsset('game.jigsaw.portrait')
const PORTRAIT_SRC =
  PORTRAIT.kind === 'image' ? resolveAssetPath(PORTRAIT.src) : null
const COLUMN_POSITIONS = ['0%', '50%', '100%']

function pieceStyle(pieceId: number): CSSProperties | undefined {
  if (!PORTRAIT_SRC) {
    return undefined
  }

  const column = pieceId % JIGSAW_SIZE
  const row = Math.floor(pieceId / JIGSAW_SIZE)

  return {
    backgroundImage: `url(${PORTRAIT_SRC})`,
    backgroundSize: `${JIGSAW_SIZE * 100}% ${JIGSAW_SIZE * 100}%`,
    backgroundPosition: `${COLUMN_POSITIONS[column]} ${COLUMN_POSITIONS[row]}`,
  }
}

/** Day 16: three-by-three jigsaw with tap or drag swaps and a model view. */
export function JigsawGame({ onComplete }: MissionGameProps) {
  const [board, setBoard] = useState(() => createJigsawBoard(JIGSAW_SIZE))
  const [selected, setSelected] = useState<number | null>(null)
  const [dragFrom, setDragFrom] = useState<number | null>(null)
  const [showModel, setShowModel] = useState(false)
  const solved = isJigsawSolved(board)

  function swap(first: number, second: number) {
    setBoard((current) => swapJigsawTiles(current, first, second))
    setSelected(null)
    setDragFrom(null)
  }

  function selectSlot(slot: number) {
    if (solved) {
      return
    }

    if (selected === null) {
      setSelected(slot)
      return
    }

    if (selected === slot) {
      setSelected(null)
      return
    }

    swap(selected, slot)
  }

  return (
    <div className="game game--jigsaw">
      <p className="game__lead">
        Reconstruye el retrato de Trasto y Rodolfo. Toca dos piezas para cambiarlas de
        sitio o arrastra una pieza sobre otra. Puedes mirar el modelo cuando quieras.
      </p>

      <div className="game__actions">
        <button
          type="button"
          className="button button--secondary"
          onClick={() => setShowModel((current) => !current)}
          aria-expanded={showModel}
        >
          {showModel ? 'Ocultar modelo' : 'Ver modelo'}
        </button>
      </div>

      {showModel ? (
        <div className="jigsaw-model" aria-label="Modelo del retrato completo">
          {Array.from({ length: JIGSAW_SIZE * JIGSAW_SIZE }, (_, pieceId) => (
            <span
              key={pieceId}
              className="jigsaw-model__piece"
              style={pieceStyle(pieceId)}
            />
          ))}
        </div>
      ) : null}

      <ul className="jigsaw-board" aria-label="Puzle de nueve piezas">
        {board.map((pieceId, slot) => (
          <li key={slot}>
            <button
              type="button"
              className={`jigsaw-tile${selected === slot ? ' jigsaw-tile--selected' : ''}${
                pieceId === slot ? ' jigsaw-tile--correct' : ''
              }`}
              style={pieceStyle(pieceId)}
              onClick={() => selectSlot(slot)}
              draggable={!solved}
              onDragStart={(event) => {
                setDragFrom(slot)
                event.dataTransfer.setData('text/plain', String(slot))
                event.dataTransfer.effectAllowed = 'move'
              }}
              onDragOver={(event) => {
                event.preventDefault()
                event.dataTransfer.dropEffect = 'move'
              }}
              onDrop={(event) => {
                event.preventDefault()

                if (dragFrom !== null) {
                  swap(dragFrom, slot)
                } else if (selected !== null) {
                  swap(selected, slot)
                }
              }}
              onDragEnd={() => setDragFrom(null)}
              disabled={solved}
              aria-pressed={selected === slot}
              aria-label={`Pieza ${slot + 1}${selected === slot ? ', seleccionada' : ''}`}
            >
              {PORTRAIT_SRC ? null : <span aria-hidden="true">{pieceId + 1}</span>}
            </button>
          </li>
        ))}
      </ul>

      {solved ? (
        <div className="game__complete" role="status">
          <p>
            <strong>¡El cuadro está reconstruido!</strong>
          </p>
          <button type="button" className="button button--primary" onClick={onComplete}>
            Continuar
          </button>
        </div>
      ) : null}
    </div>
  )
}
