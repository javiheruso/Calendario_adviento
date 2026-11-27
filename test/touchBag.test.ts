import { test } from 'node:test'
import { strict as assert } from 'node:assert'
import {
  TOUCH_BAG_HITS,
  TOUCH_BAG_SAFE_IDEAS,
  TOUCH_BAG_SLOT_IDS,
  createTouchBagState,
  isTouchBagComplete,
  markedTouchBagHits,
  toggleTouchBagHit,
} from '../src/domain/games/touchBag'

test('the mystery bag needs three manual hits and starts empty', () => {
  const state = createTouchBagState()

  assert.equal(TOUCH_BAG_HITS, 3)
  assert.equal(TOUCH_BAG_SLOT_IDS.length, 3)
  assert.equal(TOUCH_BAG_SAFE_IDEAS.length, 3)
  assert.equal(markedTouchBagHits(state), 0)
  assert.equal(isTouchBagComplete(state), false)
})

test('each hit is marked independently and can be undone', () => {
  let state = createTouchBagState()

  state = toggleTouchBagHit(state, 'first')
  assert.equal(state.marked.first, true)
  assert.equal(markedTouchBagHits(state), 1)
  assert.equal(isTouchBagComplete(state), false)

  state = toggleTouchBagHit(state, 'first')
  assert.equal(state.marked.first, false)
  assert.equal(markedTouchBagHits(state), 0)
})

test('three marked identifications complete the mission', () => {
  let state = createTouchBagState()

  state = toggleTouchBagHit(state, 'first')
  state = toggleTouchBagHit(state, 'second')
  assert.equal(isTouchBagComplete(state), false)

  state = toggleTouchBagHit(state, 'third')
  assert.equal(markedTouchBagHits(state), 3)
  assert.equal(isTouchBagComplete(state), true)
})
