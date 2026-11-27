import { test } from 'node:test'
import { strict as assert } from 'node:assert'
import {
  REINDEER_MAZE,
  REINDEER_CARROT_COUNT,
  carrotsRemaining,
  createReindeerMazeState,
  isAtStable,
  isMazeWall,
  isReindeerMazeComplete,
  moveReindeer,
  type MazeDirection,
  type ReindeerMazeState,
} from '../src/domain/games/reindeerMaze'

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

test('the maze has three reachable carrots and a stable', () => {
  assert.equal(REINDEER_CARROT_COUNT, 3)
  assert.equal(REINDEER_MAZE.carrots.length, 3)
  assert.equal(isMazeWall(REINDEER_MAZE, REINDEER_MAZE.start), false)
  assert.equal(isMazeWall(REINDEER_MAZE, REINDEER_MAZE.stable), false)

  const start = createReindeerMazeState()
  assert.equal(carrotsRemaining(start), 3)
  assert.equal(isAtStable(start), false)
  assert.equal(isReindeerMazeComplete(start), false)
})

test('invalid steps into a wall or the border are ignored', () => {
  const start = createReindeerMazeState()

  assert.equal(moveReindeer(start, 'up'), start)
  assert.equal(moveReindeer(start, 'left'), start)

  const atEdge = walk(start, 'right', 6)
  assert.equal(moveReindeer(atEdge, 'right'), atEdge)

  const besideWall = walk(start, 'right', 1)
  assert.equal(moveReindeer(besideWall, 'down'), besideWall)
})

test('collecting the three carrots and reaching the stable completes the day', () => {
  let state = createReindeerMazeState()

  state = walk(state, 'right', 6)
  assert.equal(state.collected.length, 1)
  assert.equal(carrotsRemaining(state), 2)

  state = walk(state, 'down', 2)
  state = walk(state, 'left', 3)
  assert.equal(state.collected.length, 2)

  state = walk(state, 'right', 3)
  state = walk(state, 'down', 2)
  assert.equal(state.collected.length, 3)
  assert.equal(isAtStable(state), false)
  assert.equal(isReindeerMazeComplete(state), false)

  state = walk(state, 'left', 6)
  assert.equal(isAtStable(state), true)
  assert.equal(carrotsRemaining(state), 0)
  assert.equal(isReindeerMazeComplete(state), true)
})

test('reaching the stable without all carrots is not a success', () => {
  let state = createReindeerMazeState()
  state = walk(state, 'down', 4)

  assert.equal(isAtStable(state), true)
  assert.equal(isReindeerMazeComplete(state), false)
  assert.equal(carrotsRemaining(state), 3)
})

test('a collected carrot is never counted twice', () => {
  let state = createReindeerMazeState()
  state = walk(state, 'right', 6)
  assert.deepEqual(state.collected, ['carrot-top'])

  state = walk(state, 'left', 1)
  state = walk(state, 'right', 1)
  assert.deepEqual(state.collected, ['carrot-top'])
})
