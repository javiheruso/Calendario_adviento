import { test } from 'node:test'
import { strict as assert } from 'node:assert'
import {
  SNOWBALL_HITS_TO_WIN,
  SNOWBALL_THROWS_PER_ROUND,
  createSnowballState,
  isSnowballRoundWon,
  recordSnowballThrow,
  resetSnowballRound,
  snowballsLeft,
} from '../src/domain/games/snowballToss'

test('a snowball round starts with five balls and no hits', () => {
  const state = createSnowballState()

  assert.equal(SNOWBALL_THROWS_PER_ROUND, 5)
  assert.equal(SNOWBALL_HITS_TO_WIN, 3)
  assert.deepEqual(state, { throws: 0, hits: 0, phase: 'playing' })
  assert.equal(snowballsLeft(state), 5)
})

test('three hits win the round even before all five throws', () => {
  let state = createSnowballState()

  assert.equal(recordSnowballThrow(state, false).hits, 0)
  state = recordSnowballThrow(state, true)
  state = recordSnowballThrow(state, true)

  const won = recordSnowballThrow(state, true)
  assert.equal(won.phase, 'won')
  assert.equal(won.hits, 3)
  assert.equal(won.throws, 3)
  assert.equal(isSnowballRoundWon(won), true)
  assert.equal(snowballsLeft(won), 2)
})

test('five throws under three hits only end the round as feedback', () => {
  let state = createSnowballState()

  state = recordSnowballThrow(state, true)
  state = recordSnowballThrow(state, true)
  state = recordSnowballThrow(state, false)
  state = recordSnowballThrow(state, false)
  assert.equal(state.phase, 'playing')

  state = recordSnowballThrow(state, false)
  assert.equal(state.phase, 'round-lost')
  assert.equal(state.hits, 2)
  assert.equal(state.throws, 5)
})

test('a third hit on the last allowed throw still wins', () => {
  let state = createSnowballState()

  state = recordSnowballThrow(state, true)
  state = recordSnowballThrow(state, true)
  state = recordSnowballThrow(state, false)
  state = recordSnowballThrow(state, false)
  state = recordSnowballThrow(state, true)

  assert.equal(state.phase, 'won')
  assert.equal(state.throws, 5)
})

test('throws after the round is decided are ignored and retry starts fresh', () => {
  const won = recordSnowballThrow(
    recordSnowballThrow(recordSnowballThrow(createSnowballState(), true), true),
    true,
  )

  assert.equal(recordSnowballThrow(won, true), won)
  assert.deepEqual(resetSnowballRound(), createSnowballState())
})
