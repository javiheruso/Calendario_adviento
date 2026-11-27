import { test } from 'node:test'
import { strict as assert } from 'node:assert'
import {
  SOCK_COUNT,
  SOCK_PAIRS,
  createSockState,
  isSockComplete,
  matchedSockPairs,
  resolveSockMismatch,
  selectSock,
} from '../src/domain/games/sockPairs'
import type { SockState } from '../src/domain/games/sockPairs'
import { sequenceRandom } from './random'

function socksFor(state: SockState, pairId: number) {
  return state.socks.filter((sock) => sock.pairId === pairId)
}

test('the sock pile has ten socks in five pairs', () => {
  const state = createSockState(SOCK_PAIRS, sequenceRandom([0.1, 0.7, 0.3, 0.9]))

  assert.equal(SOCK_PAIRS, 5)
  assert.equal(SOCK_COUNT, 10)
  assert.equal(state.socks.length, 10)

  for (let pairId = 0; pairId < SOCK_PAIRS; pairId += 1) {
    assert.equal(socksFor(state, pairId).length, 2)
  }
})

test('a matching pair locks and can never be unselected', () => {
  const state = createSockState(SOCK_PAIRS, () => 0.5)
  const [first, second] = socksFor(state, 0)

  const afterFirst = selectSock(state, first.id)
  assert.equal(afterFirst.socks.find((sock) => sock.id === first.id)?.selected, true)

  const afterSecond = selectSock(afterFirst, second.id)
  assert.equal(afterSecond.hasMismatch, false)
  assert.equal(matchedSockPairs(afterSecond), 1)
  assert.equal(
    afterSecond.socks.find((sock) => sock.id === first.id)?.matched,
    true,
  )
  assert.equal(selectSock(afterSecond, first.id), afterSecond)
})

test('a mismatch waits for resolution and keeps matched pairs safe', () => {
  const state = createSockState(SOCK_PAIRS, () => 0.5)
  const [first] = socksFor(state, 0)
  const [other] = socksFor(state, 1)

  let next = selectSock(state, first.id)
  next = selectSock(next, other.id)

  assert.equal(next.hasMismatch, true)
  assert.equal(matchedSockPairs(next), 0)

  const [third] = socksFor(next, 2)
  assert.equal(selectSock(next, third.id), next)

  const resolved = resolveSockMismatch(next)
  assert.equal(resolved.hasMismatch, false)
  assert.equal(
    resolved.socks.filter((sock) => sock.selected && !sock.matched).length,
    0,
  )
  assert.equal(resolveSockMismatch(resolved), resolved)
})

test('the mission completes only after all five pairs are matched', () => {
  let state = createSockState(SOCK_PAIRS, () => 0.5)

  for (let pairId = 0; pairId < SOCK_PAIRS; pairId += 1) {
    const [first, second] = socksFor(state, pairId)
    state = selectSock(state, first.id)
    state = selectSock(state, second.id)

    const expected = pairId === SOCK_PAIRS - 1
    assert.equal(isSockComplete(state), expected)
  }

  assert.equal(matchedSockPairs(state), SOCK_PAIRS)
  assert.equal(state.socks.every((sock) => sock.matched), true)
})
