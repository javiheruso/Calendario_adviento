/**
 * Day 4 reindeer maze rules.
 *
 * Rodolfo walks a fixed snowy grid. He may only step into a neighbouring open
 * cell, collects a carrot when he enters its cell, and finishes when he reaches
 * the stable with all three carrots. There is no timer, attempt limit or
 * penalty: an invalid step is simply ignored.
 */

export interface MazeCell {
  readonly row: number
  readonly col: number
}

export interface MazeCarrot extends MazeCell {
  readonly id: string
}

export interface ReindeerMazeDefinition {
  readonly rows: number
  readonly cols: number
  readonly walls: readonly MazeCell[]
  readonly carrots: readonly MazeCarrot[]
  readonly start: MazeCell
  readonly stable: MazeCell
}

export interface ReindeerMazeState {
  readonly position: MazeCell
  readonly collected: readonly string[]
}

export type MazeDirection = 'up' | 'down' | 'left' | 'right'

/**
 * Five rows by seven columns. Every carrot and the stable are reachable without
 * crossing a wall, so the maze is always solvable.
 */
export const REINDEER_MAZE: ReindeerMazeDefinition = {
  rows: 5,
  cols: 7,
  walls: [
    { row: 1, col: 1 },
    { row: 1, col: 2 },
    { row: 1, col: 4 },
    { row: 1, col: 5 },
    { row: 3, col: 1 },
    { row: 3, col: 3 },
    { row: 3, col: 4 },
    { row: 3, col: 5 },
  ],
  carrots: [
    { id: 'carrot-top', row: 0, col: 6 },
    { id: 'carrot-middle', row: 2, col: 3 },
    { id: 'carrot-bottom', row: 4, col: 6 },
  ],
  start: { row: 0, col: 0 },
  stable: { row: 4, col: 0 },
}

export const REINDEER_CARROT_COUNT = REINDEER_MAZE.carrots.length

const DELTAS: Readonly<Record<MazeDirection, MazeCell>> = {
  up: { row: -1, col: 0 },
  down: { row: 1, col: 0 },
  left: { row: 0, col: -1 },
  right: { row: 0, col: 1 },
}

export function createReindeerMazeState(
  definition: ReindeerMazeDefinition = REINDEER_MAZE,
): ReindeerMazeState {
  return { position: { ...definition.start }, collected: [] }
}

export function sameMazeCell(first: MazeCell, second: MazeCell): boolean {
  return first.row === second.row && first.col === second.col
}

export function isMazeCellInside(
  definition: ReindeerMazeDefinition,
  cell: MazeCell,
): boolean {
  return (
    cell.row >= 0 &&
    cell.row < definition.rows &&
    cell.col >= 0 &&
    cell.col < definition.cols
  )
}

export function isMazeWall(
  definition: ReindeerMazeDefinition,
  cell: MazeCell,
): boolean {
  return definition.walls.some((wall) => sameMazeCell(wall, cell))
}

/**
 * Moves one cell when the target is inside the grid and not a wall. Otherwise
 * returns the same state so repeated taps can never lose progress.
 */
export function moveReindeer(
  state: ReindeerMazeState,
  direction: MazeDirection,
  definition: ReindeerMazeDefinition = REINDEER_MAZE,
): ReindeerMazeState {
  const delta = DELTAS[direction]
  const target = {
    row: state.position.row + delta.row,
    col: state.position.col + delta.col,
  }

  if (!isMazeCellInside(definition, target) || isMazeWall(definition, target)) {
    return state
  }

  const carrot = definition.carrots.find((candidate) =>
    sameMazeCell(candidate, target),
  )

  if (carrot && !state.collected.includes(carrot.id)) {
    return { position: target, collected: [...state.collected, carrot.id] }
  }

  return { position: target, collected: state.collected }
}

export function isAtStable(
  state: ReindeerMazeState,
  definition: ReindeerMazeDefinition = REINDEER_MAZE,
): boolean {
  return sameMazeCell(state.position, definition.stable)
}

export function carrotsRemaining(
  state: ReindeerMazeState,
  definition: ReindeerMazeDefinition = REINDEER_MAZE,
): number {
  return definition.carrots.length - state.collected.length
}

/** Success needs both the stable and every carrot; one alone is not enough. */
export function isReindeerMazeComplete(
  state: ReindeerMazeState,
  definition: ReindeerMazeDefinition = REINDEER_MAZE,
): boolean {
  return isAtStable(state, definition) && carrotsRemaining(state, definition) === 0
}
