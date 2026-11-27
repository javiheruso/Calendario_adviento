import { test } from 'node:test'
import { strict as assert } from 'node:assert'
import {
  FINAL_CRYSTALS,
  completeFinalCrystal,
  completedCrystalCount,
  createFinalMissionState,
  currentFinalCrystal,
  isFinalMissionComplete,
} from '../src/domain/games/finalMission'

test('the final mission starts with the intelligence crystal', () => {
  const state = createFinalMissionState()

  assert.deepEqual(state.completed, [])
  assert.deepEqual([...FINAL_CRYSTALS], ['intelligence', 'memory', 'magic'])
  assert.equal(currentFinalCrystal(state), 'intelligence')
  assert.equal(completedCrystalCount(state), 0)
  assert.equal(isFinalMissionComplete(state), false)
})

test('the three crystals are required in approved order', () => {
  let state = createFinalMissionState()

  state = completeFinalCrystal(state, 'intelligence')
  assert.equal(currentFinalCrystal(state), 'memory')
  assert.equal(completedCrystalCount(state), 1)
  assert.equal(isFinalMissionComplete(state), false)

  state = completeFinalCrystal(state, 'memory')
  assert.equal(currentFinalCrystal(state), 'magic')
  assert.equal(completedCrystalCount(state), 2)
  assert.equal(isFinalMissionComplete(state), false)

  state = completeFinalCrystal(state, 'magic')
  assert.equal(currentFinalCrystal(state), null)
  assert.equal(completedCrystalCount(state), 3)
  assert.equal(isFinalMissionComplete(state), true)
})

test('completing the same crystal twice is idempotent', () => {
  const once = completeFinalCrystal(createFinalMissionState(), 'intelligence')

  assert.equal(completeFinalCrystal(once, 'intelligence'), once)
  assert.equal(completedCrystalCount(once), 1)
})
