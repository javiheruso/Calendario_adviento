import { test } from 'node:test'
import { strict as assert } from 'node:assert'
import {
  NO_LAUGH_ROUNDS,
  NO_LAUGH_ROUND_SECONDS,
  createNoLaughState,
  currentNoLaughRound,
  finishNoLaughRound,
  isNoLaughComplete,
  prepareNextNoLaughRound,
  startNoLaughRound,
} from '../src/domain/games/noLaugh'

test('day 13 runs two rounds of thirty seconds', () => {
  assert.equal(NO_LAUGH_ROUNDS, 2)
  assert.equal(NO_LAUGH_ROUND_SECONDS, 30)
  assert.equal(currentNoLaughRound(createNoLaughState()).title, 'Ronda 1: Leyre aguanta')
})

test('a round can only finish after it starts', () => {
  const idle = createNoLaughState()

  assert.equal(finishNoLaughRound(idle), idle)
  assert.equal(prepareNextNoLaughRound(idle), idle)

  const playing = startNoLaughRound(idle)
  assert.equal(playing.phase, 'playing')
  assert.equal(startNoLaughRound(playing), playing)
})

test('the first round is a break, not the end of the mission', () => {
  const afterRoundOne = finishNoLaughRound(startNoLaughRound(createNoLaughState()))

  assert.deepEqual(afterRoundOne, {
    roundIndex: 0,
    completedRounds: 1,
    phase: 'round-complete',
  })
  assert.equal(isNoLaughComplete(afterRoundOne), false)
  assert.equal(finishNoLaughRound(afterRoundOne), afterRoundOne)

  const readyForRoundTwo = prepareNextNoLaughRound(afterRoundOne)
  assert.equal(readyForRoundTwo.roundIndex, 1)
  assert.equal(readyForRoundTwo.phase, 'idle')
  assert.equal(currentNoLaughRound(readyForRoundTwo).title, 'Ronda 2: el adulto aguanta')
})

test('both rounds always complete without a winner condition', () => {
  let state = startNoLaughRound(createNoLaughState())
  state = finishNoLaughRound(state)
  state = startNoLaughRound(prepareNextNoLaughRound(state))
  state = finishNoLaughRound(state)

  assert.equal(state.completedRounds, 2)
  assert.equal(state.phase, 'complete')
  assert.equal(isNoLaughComplete(state), true)
  assert.equal(finishNoLaughRound(state), state)
})
