import { test } from 'node:test'
import { strict as assert } from 'node:assert'
import {
  SCRAMBLE_WORDS,
  clearRound,
  createScrambleGame,
  createWordRound,
  isRoundSolved,
  isTilePlaced,
  placeLetter,
  removeLetter,
  wordFromSlots,
} from '../src/domain/games/wordScramble'
import type { WordRound } from '../src/domain/games/wordScramble'
import { sequenceRandom } from './random'

function sortedChars(value: string): string {
  return value.split('').sort().join('')
}

function solveRound(round: WordRound): WordRound {
  let current = round

  for (const char of round.word) {
    const tile = current.tiles.find(
      (candidate) => candidate.char === char && !current.slots.includes(candidate.id),
    )

    assert.ok(tile, `missing tile for ${char}`)
    current = placeLetter(current, tile.id)
  }

  return current
}

test('the three approved words are registered in order', () => {
  const game = createScrambleGame(SCRAMBLE_WORDS, () => 0.42)

  assert.deepEqual([...SCRAMBLE_WORDS], ['RENO', 'NIEVE', 'REGALO'])
  assert.deepEqual(
    game.rounds.map((round) => round.word),
    ['RENO', 'NIEVE', 'REGALO'],
  )
  assert.deepEqual(
    game.rounds.map((round) => round.tiles.length),
    [4, 5, 6],
  )
})

test('a round keeps every letter and starts with empty slots', () => {
  const round = createWordRound('nieve', sequenceRandom([0.2, 0.8, 0.4]))

  assert.equal(round.word, 'NIEVE')
  assert.equal(round.tiles.length, 5)
  assert.equal(sortedChars(round.tiles.map((tile) => tile.char).join('')), sortedChars('NIEVE'))
  assert.equal(round.slots.length, 5)
  assert.equal(round.slots.every((slot) => slot === null), true)
})

test('placing the letters in order solves a round', () => {
  const round = createWordRound('REGALO', () => 0.5)

  assert.equal(isRoundSolved(round), false)
  assert.equal(wordFromSlots(round), '')

  const solved = solveRound(round)
  assert.equal(isRoundSolved(solved), true)
  assert.equal(wordFromSlots(solved), 'REGALO')
})

test('a full but wrong order is not solved and can be changed', () => {
  const round = createWordRound('RENO', () => 0.5)
  let current = round

  for (const tile of [...round.tiles].reverse()) {
    current = placeLetter(current, tile.id)
  }

  assert.equal(isRoundSolved(current), false)
  assert.equal(wordFromSlots(current).length, 4)

  current = clearRound(current)
  assert.equal(isRoundSolved(current), false)
  assert.equal(current.slots.every((slot) => slot === null), true)
})

test('letters can be removed from any slot and returned to the tray', () => {
  const round = createWordRound('RENO', () => 0.5)
  const [firstTile] = round.tiles

  const placed = placeLetter(round, firstTile.id)
  assert.equal(isTilePlaced(placed, firstTile.id), true)
  assert.equal(placeLetter(placed, firstTile.id), placed, 'a placed tile cannot be placed again')

  const removed = removeLetter(placed, 0)
  assert.equal(removed.slots[0], null)
  assert.equal(isTilePlaced(removed, firstTile.id), false)
  assert.equal(removeLetter(removed, 0), removed)
})

test('duplicate letters remain distinct tiles', () => {
  const round = createWordRound('NIEVE', () => 0.5)
  const eTiles = round.tiles.filter((tile) => tile.char === 'E')

  assert.equal(eTiles.length, 2)
  assert.notEqual(eTiles[0].id, eTiles[1].id)
})
