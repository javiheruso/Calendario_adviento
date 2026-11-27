import { useState } from 'react'
import { getAsset } from '../../domain/assets'
import {
  REINDEER_CARROT_COUNT,
  REINDEER_MAZE,
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
 * Day 4: guide Rodolfo through a snowy forest, collect three carrots and reach
 * the stable. Movement is available by tapping a neighbouring cell or with four
 * large direction buttons; there is no timer or penalty.
 */
export function ReindeerMazeGame({ onComplete }: MissionGameProps) {
  const [state, setState] = useState(() => createReindeerMazeState())
  const complete = isReindeerMazeComplete(state)
  const atStable = isAtStable(state)
  const remaining = carrotsRemaining(state)
  const maze = REINDEER_MAZE

  function move(direction: MazeDirection) {
    setState((current) => moveReindeer(current, direction))
  }

  function tapCell(cell: MazeCell) {
    const direction = directionTo(state.position, cell)

    if (direction) {
      move(direction)
    }
  }

  return (
    <div className="game game--maze">
      <p className="game__lead">
        Lleva a Rodolfo por el bosque nevado, recoge las tres zanahorias y llévalo al
        establo. Toca una casilla vecina o usa las flechas grandes. No hay tiempo ni
        penalizaciones.
      </p>

      <p className="game__status" role="status">
        Zanahorias: {state.collected.length} de {REINDEER_CARROT_COUNT}
      </p>

      <div
        className="maze-grid"
        style={{ gridTemplateColumns: `repeat(${maze.cols}, minmax(0, 1fr))` }}
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
            const reindeer = sameMazeCell(cell, state.position)
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
                }${reindeer ? ' maze-cell--reindeer' : ''}`}
                onClick={() => tapCell(cell)}
                disabled={wall || complete}
                aria-label={`${label}${reindeer ? ', con Rodolfo' : ''}`}
              >
                {reindeer ? (
                  <span className="maze-cell__glyph" aria-hidden="true">
                    <AssetGlyph asset={getAsset('game.maze.reindeer')} label={false} />
                  </span>
                ) : wall ? (
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
            onClick={() => move(item.direction)}
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
