/**
 * Day 16 jigsaw rules.
 *
 * The board is a permutation of piece ids: `board[slot]` is the piece shown in
 * that slot, and a piece id equals its solved position. The UI can swap any two
 * slots by tap or drag; there is no timer, penalty or attempt limit.
 */
import { shuffle } from './shuffle'

export const JIGSAW_SIZE = 3
export const JIGSAW_PIECES = JIGSAW_SIZE * JIGSAW_SIZE

export type JigsawBoard = readonly number[]

export function createJigsawBoard(
  size: number = JIGSAW_SIZE,
  random: () => number = Math.random,
): JigsawBoard {
  const pieceCount = size * size
  const solved = Array.from({ length: pieceCount }, (_, index) => index)
  const board = shuffle(solved, random)

  if (isJigsawSolved(board) && board.length > 1) {
    // Guarantee an unsolved start; the swap keeps a valid permutation.
    return [board[1], board[0], ...board.slice(2)]
  }

  return board
}

export function swapJigsawTiles(
  board: JigsawBoard,
  first: number,
  second: number,
): JigsawBoard {
  if (
    first === second ||
    first < 0 ||
    second < 0 ||
    first >= board.length ||
    second >= board.length
  ) {
    return board
  }

  const next = [...board]
  const swap = next[first]
  next[first] = next[second]
  next[second] = swap
  return next
}

export function isJigsawSolved(board: JigsawBoard): boolean {
  return board.every((piece, slot) => piece === slot)
}

export function countCorrectJigsawPieces(board: JigsawBoard): number {
  return board.filter((piece, slot) => piece === slot).length
}
