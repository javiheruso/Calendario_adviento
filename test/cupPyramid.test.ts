import { test } from 'node:test'
import { strict as assert } from 'node:assert'
import {
  CUP_PYRAMID_CUPS,
  CUP_PYRAMID_ROWS,
  confirmCupPyramid,
  createCupPyramidState,
  cupsInPyramidRow,
  isCupPyramidComplete,
  markPyramidRow,
  nextPyramidRowIndex,
  resetCupPyramid,
} from '../src/domain/games/cupPyramid'

test('the pyramid is six cups in a 3-2-1 shape and starts unbuilt', () => {
  const state = createCupPyramidState()

  assert.deepEqual([...CUP_PYRAMID_ROWS], [3, 2, 1])
  assert.equal(CUP_PYRAMID_CUPS, 6)
  assert.equal(cupsInPyramidRow(0), 3)
  assert.equal(cupsInPyramidRow(1), 2)
  assert.equal(cupsInPyramidRow(2), 1)
  assert.equal(state.placedRows, 0)
  assert.equal(state.phase, 'building')
  assert.equal(nextPyramidRowIndex(state), 0)
  assert.equal(isCupPyramidComplete(state), false)
})

test('placing the three rows reaches ready but never completes on its own', () => {
  let state = createCupPyramidState()

  state = markPyramidRow(state)
  assert.equal(state.placedRows, 1)
  assert.equal(state.phase, 'building')
  assert.equal(nextPyramidRowIndex(state), 1)

  state = markPyramidRow(state)
  assert.equal(state.placedRows, 2)
  assert.equal(state.phase, 'building')

  state = markPyramidRow(state)
  assert.equal(state.placedRows, 3)
  assert.equal(state.phase, 'ready')
  assert.equal(nextPyramidRowIndex(state), null)
  assert.equal(isCupPyramidComplete(state), false)

  assert.equal(markPyramidRow(state), state, 'no extra rows are accepted')
})

test('the family confirms the finished pyramid manually', () => {
  let state = createCupPyramidState()

  assert.equal(confirmCupPyramid(state), state, 'confirmation needs the three rows')

  state = markPyramidRow(state)
  state = markPyramidRow(state)
  state = markPyramidRow(state)
  state = confirmCupPyramid(state)

  assert.equal(isCupPyramidComplete(state), true)
  assert.equal(state.phase, 'complete')
  assert.equal(confirmCupPyramid(state), state)
})

test('the pyramid can be restarted without penalty until it is confirmed', () => {
  let state = createCupPyramidState()
  state = markPyramidRow(state)
  state = markPyramidRow(state)

  const reset = resetCupPyramid(state)
  assert.equal(reset.placedRows, 0)
  assert.equal(reset.phase, 'building')

  state = markPyramidRow(state)
  state = markPyramidRow(state)
  state = markPyramidRow(state)
  state = confirmCupPyramid(state)

  assert.equal(resetCupPyramid(state), state, 'confirmed work is not reset')
})
