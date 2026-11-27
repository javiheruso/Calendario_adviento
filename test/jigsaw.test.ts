import { test } from 'node:test'
import { strict as assert } from 'node:assert'
import {
  JIGSAW_PIECES,
  JIGSAW_SIZE,
  countCorrectJigsawPieces,
  createJigsawBoard,
  isJigsawSolved,
  swapJigsawTiles,
} from '../src/domain/games/jigsaw'
import { sequenceRandom } from './random'

test('a new board is a valid permutation and never starts solved', () => {
  for (const random of [() => 0, () => 0.5, sequenceRandom([0.9, 0.1, 0.6])]) {
    const board = createJigsawBoard(JIGSAW_SIZE, random)

    assert.equal(JIGSAW_PIECES, 9)
    assert.equal(board.length, 9)
    assert.deepEqual([...board].sort((a, b) => a - b), [0, 1, 2, 3, 4, 5, 6, 7, 8])
    assert.equal(isJigsawSolved(board), false)
  }
})

test('swapping two slots is reversible and keeps a permutation', () => {
  const board = createJigsawBoard(JIGSAW_SIZE, () => 0.5)
  const swapped = swapJigsawTiles(board, 0, 8)

  assert.notDeepEqual(swapped, board)
  assert.equal(swapped[0], board[8])
  assert.equal(swapped[8], board[0])
  assert.deepEqual(
    [...swapped].sort((a, b) => a - b),
    [0, 1, 2, 3, 4, 5, 6, 7, 8],
  )

  const restored = swapJigsawTiles(swapped, 0, 8)
  assert.deepEqual(restored, board)
})

test('invalid or identity swaps return the same board', () => {
  const board = createJigsawBoard(JIGSAW_SIZE, () => 0.5)

  assert.equal(swapJigsawTiles(board, 2, 2), board)
  assert.equal(swapJigsawTiles(board, -1, 2), board)
  assert.equal(swapJigsawTiles(board, 0, 9), board)
})

test('solving is detected socket by slot and counted honestly', () => {
  const solved = [0, 1, 2, 3, 4, 5, 6, 7, 8]

  assert.equal(isJigsawSolved(solved), true)
  assert.equal(countCorrectJigsawPieces(solved), 9)

  const oneSwap = swapJigsawTiles(solved, 0, 1)
  assert.equal(isJigsawSolved(oneSwap), false)
  assert.equal(countCorrectJigsawPieces(oneSwap), 7)
})
