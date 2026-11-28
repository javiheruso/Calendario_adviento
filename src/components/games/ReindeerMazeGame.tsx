import { useEffect, useRef, useState, type PointerEvent } from 'react'
import { getAsset, type AssetId } from '../../domain/assets'
import {
  REINDEER_CARROT_COUNT,
  REINDEER_HOLD_STEP_MS,
  REINDEER_MAZE,
  REINDEER_WALK_FRAME_MS,
  REINDEER_WALK_STOP_MS,
  carrotsRemaining,
  createReindeerMazeState,
  isAtStable,
  isMazeWall,
  isReindeerMazeComplete,
  moveReindeer,
  sameMazeCell,
  type MazeCell,
  type MazeDirection,
} from '../../domain/games/reindeerMaze'
import { AssetGlyph } from '../AssetGlyph'
import type { MissionGameProps } from './types'

const DIRECTIONS: readonly { direction: MazeDirection; label: string; glyph: string }[] = [
  { direction: 'up', label: 'Arriba', glyph: '↑' },
  { direction: 'left', label: 'Izquierda', glyph: '←' },
  { direction: 'right', label: 'Derecha', glyph: '→' },
  { direction: 'down', label: 'Abajo', glyph: '↓' },
]

function directionTo(from: MazeCell, to: MazeCell): MazeDirection | null {
  const rowDelta = to.row - from.row
  const colDelta = to.col - from.col

  if (rowDelta === -1 && colDelta === 0) return 'up'
  if (rowDelta === 1 && colDelta === 0) return 'down'
  if (rowDelta === 0 && colDelta === -1) return 'left'
  if (rowDelta === 0 && colDelta === 1) return 'right'
  return null
}

function cellKey(cell: MazeCell): string {
  return `${cell.row}-${cell.col}`
}

/**
 * Day 4: guide Rodolfo through a snowy 9×11 forest, collect three carrots and
 * reach the stable. Movement accepts a neighbouring cell, the four large
 * direction buttons, or a held direction (mouse, touch or keyboard) that
 * repeats one valid step at a time. The final Rodolfo art slides between cells
 * and alternates two walk frames every 175 ms only while moving.
 *
 * Invalid cells, pines and borders are ignored before the animation starts, so
 * a held direction can never cross a wall, skip a cell or duplicate a carrot.
 */
export function ReindeerMazeGame({ onComplete }: MissionGameProps) {
  const [state, setState] = useState(() => createReindeerMazeState())
  const stateRef = useRef(state)

  useEffect(() => {
    stateRef.current = state
  }, [state])
  // The final Rodolfo artwork faces left. The horizontal mirror is applied on
  // rightward steps so he always looks in the direction of travel; moving left
  // keeps the source orientation.
  const [facing, setFacing] = useState<'left' | 'right'>('left')
  const [walkId, setWalkId] = useState(0)
  const [walkFrame, setWalkFrame] = useState(0)
  const [holdDirection, setHoldDirection] = useState<MazeDirection | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)
  const previousCollectedRef = useRef(0)
  const complete = isReindeerMazeComplete(state)
  const atStable = isAtStable(state)
  const remaining = carrotsRemaining(state)
  const maze = REINDEER_MAZE
  const walking = walkId > 0

  useEffect(() => {
    if (walkId === 0) {
      return
    }

    const interval = window.setInterval(() => {
      setWalkFrame((frame) => (frame === 0 ? 1 : 0))
    }, REINDEER_WALK_FRAME_MS)
    const stop = window.setTimeout(() => setWalkId(0), REINDEER_WALK_STOP_MS)

    return () => {
      window.clearInterval(interval)
      window.clearTimeout(stop)
    }
  }, [walkId])

  useEffect(() => {
    const previous = previousCollectedRef.current
    const current = state.collected.length
    previousCollectedRef.current = current

    if (current > previous) {
      setFeedback(`¡Zanahoria recogida! ${current} de ${REINDEER_CARROT_COUNT}.`)
    }
  }, [state.collected.length])

  useEffect(() => {
    if (!feedback) {
      return
    }

    const timer = window.setTimeout(() => setFeedback(null), 1600)
    return () => window.clearTimeout(timer)
  }, [feedback])

  useEffect(() => {
    if (!holdDirection || complete) {
      return
    }

    const interval = window.setInterval(() => {
      move(holdDirection)
    }, REINDEER_HOLD_STEP_MS)

    return () => window.clearInterval(interval)
    // `move` reads the latest state through a ref, so the interval survives a
    // cell change without restarting or reading a stale position.
  }, [holdDirection, complete])

  useEffect(() => {
    if (!holdDirection) {
      return
    }

    const stop = () => setHoldDirection(null)
    window.addEventListener('pointerup', stop)
    window.addEventListener('pointercancel', stop)
    window.addEventListener('blur', stop)

    return () => {
      window.removeEventListener('pointerup', stop)
      window.removeEventListener('pointercancel', stop)
      window.removeEventListener('blur', stop)
    }
  }, [holdDirection])

  function move(direction: MazeDirection) {
    const current = stateRef.current
    const next = moveReindeer(current, direction)

    if (next === current) {
      return
    }

    stateRef.current = next
    setState(next)

    if (direction === 'left') {
      setFacing('left')
    } else if (direction === 'right') {
      setFacing('right')
    }

    setWalkFrame((frame) => (frame === 0 ? 1 : 0))
    setWalkId((id) => id + 1)
  }

  function tapCell(cell: MazeCell) {
    const direction = directionTo(stateRef.current.position, cell)

    if (direction) {
      move(direction)
    }
  }

  function handlePointerDown(direction: MazeDirection, event: PointerEvent) {
    event.preventDefault()
    move(direction)
    setHoldDirection(direction)
  }

  const reindeerAsset: AssetId = walking
    ? walkFrame === 0
      ? 'game.reindeer.walk.a'
      : 'game.reindeer.walk.b'
    : 'game.maze.reindeer'
  const reindeerPosition = state.position
  const reindeerLeft = ((reindeerPosition.col + 0.5) / maze.cols) * 100
  const reindeerTop = ((reindeerPosition.row + 0.5) / maze.rows) * 100

  return (
    <div className="game game--maze">
      <p className="game__lead">
        Lleva a Rodolfo por el bosque nevado, recoge las tres zanahorias y llévalo al
        establo. Toca una casilla vecina, usa las flechas grandes o mantén pulsada una
        flecha para caminar. No hay tiempo ni penalizaciones.
      </p>

      <p className="game__status" role="status">
        Zanahorias: {state.collected.length} de {REINDEER_CARROT_COUNT}
      </p>

      <div className="maze-board">
        <div
          className="maze-grid"
          style={{ gridTemplateColumns: `repeat(${maze.cols}, minmax(0, 1fr))` }}
          role="group"
          aria-label="Bosque nevado"
        >
          {Array.from({ length: maze.rows }, (_, row) =>
            Array.from({ length: maze.cols }, (_, col) => {
              const cell = { row, col }
              const wall = isMazeWall(maze, cell)
              const stable = sameMazeCell(cell, maze.stable)
              const carrot = maze.carrots.find((candidate) =>
                sameMazeCell(candidate, cell),
              )
              const collected = carrot ? state.collected.includes(carrot.id) : false
              const label = wall
                ? 'Árbol nevado, no se puede pasar'
                : stable
                  ? 'Establo'
                  : carrot
                    ? collected
                      ? 'Zanahoria ya recogida'
                      : 'Zanahoria'
                    : 'Nieve'

              return (
                <button
                  key={cellKey(cell)}
                  type="button"
                  className={`maze-cell${wall ? ' maze-cell--wall' : ''}${
                    stable ? ' maze-cell--stable' : ''
                  }`}
                  onClick={() => tapCell(cell)}
                  disabled={wall || complete}
                  aria-label={label}
                >
                  {wall ? (
                    <span className="maze-cell__glyph" aria-hidden="true">
                      <AssetGlyph asset={getAsset('game.maze.tree')} label={false} />
                    </span>
                  ) : carrot && !collected ? (
                    <span className="maze-cell__glyph" aria-hidden="true">
                      <AssetGlyph asset={getAsset('game.maze.carrot')} label={false} />
                    </span>
                  ) : stable ? (
                    <span className="maze-cell__glyph" aria-hidden="true">
                      <AssetGlyph asset={getAsset('game.maze.stable')} label={false} />
                    </span>
                  ) : (
                    <span className="maze-cell__snow" aria-hidden="true" />
                  )}
                </button>
              )
            }),
          )}
        </div>

        <div
          className={`maze-reindeer${facing === 'right' ? ' maze-reindeer--flip' : ''}${
            walking ? ' maze-reindeer--walking' : ''
          }`}
          style={{
            left: `${reindeerLeft}%`,
            top: `${reindeerTop}%`,
            width: `${100 / maze.cols}%`,
          }}
          aria-hidden="true"
        >
          <AssetGlyph
            asset={getAsset(reindeerAsset)}
            label={false}
            className="maze-reindeer__image"
            priority
          />
        </div>

        <div className="maze-snow" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
        </div>
      </div>

      {feedback ? (
        <p className="game__hint game__hint--collect" role="status">
          {feedback}
        </p>
      ) : null}

      {atStable && !complete ? (
        <p className="game__hint" role="status">
          Rodolfo ya está en el establo, pero todavía le faltan {remaining} zanahorias.
          Sal a buscarlas y vuelve.
        </p>
      ) : null}

      <div className="maze-controls" aria-label="Controles de Rodolfo">
        {DIRECTIONS.map((item) => (
          <button
            key={item.direction}
            type="button"
            className={`maze-direction maze-direction--${item.direction}`}
            onPointerDown={(event) => handlePointerDown(item.direction, event)}
            onClick={(event) => {
              // Pointer presses already moved on pointerdown; only a keyboard
              // activation (detail 0) needs the click path.
              if (event.detail === 0) {
                move(item.direction)
              }
            }}
            onPointerUp={() => setHoldDirection(null)}
            onPointerLeave={() => setHoldDirection(null)}
            onPointerCancel={() => setHoldDirection(null)}
            onContextMenu={(event) => event.preventDefault()}
            disabled={complete}
            aria-label={`Mover a Rodolfo hacia ${item.label.toLowerCase()}`}
          >
            <span aria-hidden="true">{item.glyph}</span>
          </button>
        ))}
      </div>

      {complete ? (
        <div className="game__complete" role="status">
          <p>
            <strong>¡Rodolfo está en el establo con sus tres zanahorias!</strong>
          </p>
          <button type="button" className="button button--primary" onClick={onComplete}>
            Continuar
          </button>
        </div>
      ) : null}
    </div>
  )
}
