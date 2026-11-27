import { test } from 'node:test'
import { strict as assert } from 'node:assert'
import {
  MEMORY_CARDS,
  MEMORY_PAIRS,
  createMemoryState,
  flipMemoryCard,
  isMemoryComplete,
  matchedMemoryPairs,
  resolveMemoryMismatch,
} from '../src/domain/games/memory'
import type { MemoryState } from '../src/domain/games/memory'
import { sequenceRandom } from './random'

function cardsFor(state: MemoryState, pairId: number) {
  return state.cards.filter((card) => card.pairId === pairId)
}

test('the memory deck has twelve cards in six pairs', () => {
  const state = createMemoryState(MEMORY_PAIRS, sequenceRandom([0.1, 0.7, 0.3, 0.9]))

  assert.equal(MEMORY_PAIRS, 6)
  assert.equal(MEMORY_CARDS, 12)
  assert.equal(state.cards.length, 12)

  for (let pairId = 0; pairId < MEMORY_PAIRS; pairId += 1) {
    assert.equal(cardsFor(state, pairId).length, 2)
  }
})

test('a matching pair stays matched with no mismatch', () => {
  const state = createMemoryState(MEMORY_PAIRS, () => 0.5)
  const [first, second] = cardsFor(state, 0)

  const afterFirst = flipMemoryCard(state, first.id)
  assert.equal(
    afterFirst.cards.find((card) => card.id === first.id)?.faceUp,
    true,
  )

  const afterSecond = flipMemoryCard(afterFirst, second.id)
  assert.equal(afterSecond.hasMismatch, false)
  assert.equal(matchedMemoryPairs(afterSecond), 1)
  assert.equal(
    afterSecond.cards.find((card) => card.id === first.id)?.matched,
    true,
  )
  assert.equal(
    afterSecond.cards.find((card) => card.id === second.id)?.matched,
    true,
  )
})

test('a mismatched pair waits for a resolution and keeps progress', () => {
  const state = createMemoryState(MEMORY_PAIRS, () => 0.5)
  const [first] = cardsFor(state, 0)
  const [other] = cardsFor(state, 1)

  let next = flipMemoryCard(state, first.id)
  next = flipMemoryCard(next, other.id)

  assert.equal(next.hasMismatch, true)
  assert.equal(matchedMemoryPairs(next), 0)

  // A third flip is ignored while the mismatch is pending.
  const [third] = cardsFor(next, 2)
  assert.equal(flipMemoryCard(next, third.id), next)

  const resolved = resolveMemoryMismatch(next)
  assert.equal(resolved.hasMismatch, false)
  assert.equal(
    resolved.cards.filter((card) => card.faceUp && !card.matched).length,
    0,
  )
})

test('flipping the same card twice and repeating a resolved flip is ignored', () => {
  const state = createMemoryState(MEMORY_PAIRS, () => 0.5)
  const [first] = cardsFor(state, 0)

  const facedUp = flipMemoryCard(state, first.id)
  assert.equal(flipMemoryCard(facedUp, first.id), facedUp)

  const resolved = resolveMemoryMismatch(facedUp)
  assert.equal(resolveMemoryMismatch(resolved), resolved)
})

test('the memory mission completes only with all six pairs', () => {
  let state = createMemoryState(MEMORY_PAIRS, () => 0.5)

  for (let pairId = 0; pairId < MEMORY_PAIRS; pairId += 1) {
    const [first, second] = cardsFor(state, pairId)
    state = flipMemoryCard(state, first.id)
    state = flipMemoryCard(state, second.id)

    const complete = pairId === MEMORY_PAIRS - 1
    assert.equal(isMemoryComplete(state), complete)
  }

  assert.equal(matchedMemoryPairs(state), MEMORY_PAIRS)
  assert.equal(state.cards.every((card) => card.matched), true)
})
