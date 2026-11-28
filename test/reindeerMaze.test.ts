import { test } from 'node:test'
import { strict as assert } from 'node:assert'
import {
  REINDEER_MAZE,
  REINDEER_MAZE_COLS,
  REINDEER_MAZE_ROWS,
  REINDEER_CARROT_COUNT,
  REINDEER_HOLD_STEP_MS,
  REINDEER_WALK_FRAME_MS,
  REINDEER_WALK_STOP_MS,
  carrotsRemaining,
  createReindeerMazeState,
  isAtStable,
  isMazeCellInside,
  isMazeWall,
  isReindeerMazeComplete,
  moveReindeer,
  sameMazeCell,
  type MazeDirection,
  type ReindeerMazeState,
} from '../src/domain/games/reindeerMaze'

const DIRECTIONS: readonly MazeDirection[] = ['up', 'down', 'left', 'right']

function walk(
  state: ReindeerMazeState,
  direction: MazeDirection,
  steps: number,
): ReindeerMazeState {
  let current = state

  for (let step = 0; step < steps; step += 1) {
    current = moveReindeer(current, direction)
  }

  return current
}

function solve(maze: typeof REINDEER_MAZE): MazeDirection[] | null {
  interface Node {
    readonly state: ReindeerMazeState
    readonly path: readonly MazeDirection[]
  }

  const start: Node = { state: createReindeerMazeState(maze), path: [] }
  const queue: Node[] = [start]
  const seen = new Set<string>([`${start.state.position.row},${start.state.position.col},`])

  while (queue.length > 0) {
    const node = queue.shift()
    assert.ok(node)

    if (isReindeerMazeComplete(node.state, maze)) {
      return [...node.path]
    }

    for (const direction of DIRECTIONS) {
      const next = moveReindeer(node.state, direction, maze)

      if (next === node.state) {
        continue
      }

      const key = `${next.position.row},${next.position.col},${[...next.collected].sort().join('|')}`

      if (seen.has(key)) {
        continue
      }

      seen.add(key)
      queue.push({ state: next, path: [...node.path, direction] })
    }
  }

  return null
}

test('the maze is the wider 9×11 forest requested by the mission', () => {
  assert.equal(REINDEER_MAZE.rows, REINDEER_MAZE_ROWS)
  assert.equal(REINDEER_MAZE.cols, REINDEER_MAZE_COLS)
  assert.equal(REINDEER_MAZE_ROWS, 9)
  assert.equal(REINDEER_MAZE_COLS, 11)
  assert.ok(REINDEER_MAZE_COLS > REINDEER_MAZE_ROWS, 'the board stays horizontal')
  assert.equal(REINDEER_CARROT_COUNT, 3)
  assert.equal(REINDEER_MAZE.carrots.length, 3)
  assert.equal(isMazeWall(REINDEER_MAZE, REINDEER_MAZE.start), false)
  assert.equal(isMazeWall(REINDEER_MAZE, REINDEER_MAZE.stable), false)
})

test('the walk animation and held movement use safe constants', () => {
  assert.ok(REINDEER_WALK_FRAME_MS >= 150 && REINDEER_WALK_FRAME_MS <= 200)
  assert.ok(REINDEER_WALK_STOP_MS >= REINDEER_WALK_FRAME_MS * 2)
  assert.ok(REINDEER_HOLD_STEP_MS >= 100, 'a held direction must not skip cells')
})

test('the maze is solvable with all carrots and the stable reachable', () => {
  const path = solve(REINDEER_MAZE)

  assert.ok(path, 'a valid route must exist')
  assert.ok(path.length > 0)

  let state = createReindeerMazeState()
  for (const direction of path) {
    state = moveReindeer(state, direction)
  }

  assert.equal(isAtStable(state), true)
  assert.equal(carrotsRemaining(state), 0)
  assert.equal(isReindeerMazeComplete(state), true)
  assert.deepEqual([...state.collected].sort(), [
    'carrot-bottom',
    'carrot-middle',
    'carrot-top',
  ])
})

test('invalid steps into a pine or the border are ignored', () => {
  const start = createReindeerMazeState()

  assert.equal(moveReindeer(start, 'up'), start)
  assert.equal(moveReindeer(start, 'left'), start)

  const besidePine = walk(start, 'right', 2)
  assert.equal(moveReindeer(besidePine, 'right'), besidePine, 'row 0 column 3 is a pine')

  const underPine = walk(start, 'right', 1)
  assert.equal(moveReindeer(underPine, 'down'), underPine, 'row 1 column 1 is a pine')

  const edge = walk(start, 'right', 2)
  assert.equal(isMazeCellInside(REINDEER_MAZE, { row: 0, col: 3 }), true)
  assert.equal(isMazeWall(REINDEER_MAZE, { row: 0, col: 3 }), true)
  assert.equal(sameMazeCell(edge.position, { row: 0, col: 2 }), true)
})

test('reaching the stable without all carrots is not a success', () => {
  // Left corridor that reaches the stable without touching a carrot.
  let state = createReindeerMazeState()
  for (const direction of ['down', 'down', 'down', 'down', 'right', 'right',
    'down', 'down', 'left', 'left', 'down', 'down'] as const) {
    state = moveReindeer(state, direction)
  }

  assert.equal(isAtStable(state), true)
  assert.equal(carrotsRemaining(state), 3)
  assert.equal(isReindeerMazeComplete(state), false)
})

test('a collected carrot is never counted twice', () => {
  const path = solve(REINDEER_MAZE)
  assert.ok(path)

  let state = createReindeerMazeState()
  let reachedCarrot = false

  for (const direction of path) {
    const before = state.collected.length
    state = moveReindeer(state, direction)

    if (state.collected.length > before) {
      reachedCarrot = true
      const collectedCount = state.collected.length
      const back = moveReindeer(state, opposite(direction))
      const forth = moveReindeer(back, direction)
      assert.equal(forth.collected.length, collectedCount)
      break
    }
  }

  assert.equal(reachedCarrot, true)
})

function opposite(direction: MazeDirection): MazeDirection {
  if (direction === 'up') return 'down'
  if (direction === 'down') return 'up'
  if (direction === 'left') return 'right'
  return 'left'
}
