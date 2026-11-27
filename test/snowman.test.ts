import { test } from 'node:test'
import { strict as assert } from 'node:assert'
import {
  SNOWMAN_CATEGORIES,
  SNOWMAN_OBSERVE_MS,
  SNOWMAN_OBSERVE_SECONDS,
  SNOWMAN_VARIANTS_PER_CATEGORY,
  clearSnowmanSelection,
  createSnowmanState,
  createSnowmanTarget,
  isSnowmanComplete,
  isSnowmanSelectionComplete,
  matchingSnowmanCategories,
  selectSnowmanVariant,
  selectedSnowmanCategories,
  startSnowmanBuilding,
  type SnowmanState,
} from '../src/domain/games/snowman'
import { sequenceRandom } from './random'

function selectCombination(
  state: SnowmanState,
  combination: SnowmanState['target'],
): SnowmanState {
  let current = state

  for (const category of SNOWMAN_CATEGORIES) {
    current = selectSnowmanVariant(current, category, combination[category])
  }

  return current
}

test('there are three variants per category and a fifteen-second observation', () => {
  assert.equal(SNOWMAN_CATEGORIES.length, 4)
  assert.equal(SNOWMAN_VARIANTS_PER_CATEGORY, 3)
  assert.equal(SNOWMAN_OBSERVE_SECONDS, 15)
  assert.equal(SNOWMAN_OBSERVE_MS, 15_000)
})

test('the random target uses one valid variant per category', () => {
  const target = createSnowmanTarget(sequenceRandom([0.1, 0.4, 0.8, 0.99]))

  assert.deepEqual(target, { hat: 0, scarf: 1, nose: 2, buttons: 2 })

  for (const category of SNOWMAN_CATEGORIES) {
    const value: number = target[category]
    assert.ok(Number.isInteger(value))
    assert.ok(value >= 0 && value < SNOWMAN_VARIANTS_PER_CATEGORY)
  }
})

test('the game starts observing and only accepts choices while building', () => {
  const initial = createSnowmanState(sequenceRandom([0.1, 0.4, 0.8, 0.99]))

  assert.equal(initial.phase, 'observing')
  assert.equal(selectedSnowmanCategories(initial), 0)
  assert.equal(selectSnowmanVariant(initial, 'hat', 0), initial)

  const building = startSnowmanBuilding(initial)
  assert.equal(building.phase, 'building')
  assert.equal(startSnowmanBuilding(building), building, 'building is not restarted')
})

test('invalid variants are ignored and the selection can be cleared', () => {
  const state = startSnowmanBuilding(
    createSnowmanState(sequenceRandom([0.1, 0.4, 0.8, 0.99])),
  )

  assert.equal(selectSnowmanVariant(state, 'hat', -1), state)
  assert.equal(selectSnowmanVariant(state, 'hat', 3), state)
  assert.equal(selectSnowmanVariant(state, 'hat', 1.5), state)

  const withHat = selectSnowmanVariant(state, 'hat', 2)
  assert.equal(withHat.selection.hat, 2)
  assert.equal(selectedSnowmanCategories(withHat), 1)

  const cleared = clearSnowmanSelection(withHat)
  assert.equal(cleared.selection.hat, null)
  assert.equal(selectedSnowmanCategories(cleared), 0)
})

test('a wrong full combination is feedback only and can be retried', () => {
  let state = startSnowmanBuilding(
    createSnowmanState(sequenceRandom([0.1, 0.4, 0.8, 0.99])),
  )
  const target = state.target
  const wrong = {
    hat: (target.hat + 1) % SNOWMAN_VARIANTS_PER_CATEGORY,
    scarf: (target.scarf + 1) % SNOWMAN_VARIANTS_PER_CATEGORY,
    nose: (target.nose + 1) % SNOWMAN_VARIANTS_PER_CATEGORY,
    buttons: (target.buttons + 1) % SNOWMAN_VARIANTS_PER_CATEGORY,
  }

  state = selectCombination(state, wrong)
  assert.equal(isSnowmanSelectionComplete(state), true)
  assert.equal(isSnowmanComplete(state), false)
  assert.equal(matchingSnowmanCategories(state), 0)
  assert.equal(state.phase, 'building')

  state = selectCombination(state, target)
  assert.equal(isSnowmanComplete(state), true)
  assert.equal(state.phase, 'complete')
})

test('the mission completes as soon as the full target is rebuilt', () => {
  const building = startSnowmanBuilding(
    createSnowmanState(sequenceRandom([0.1, 0.4, 0.8, 0.99])),
  )
  const completed = selectCombination(building, building.target)

  assert.equal(isSnowmanComplete(completed), true)
  assert.equal(matchingSnowmanCategories(completed), 4)
  assert.equal(selectSnowmanVariant(completed, 'hat', 0), completed)
  assert.equal(clearSnowmanSelection(completed), completed)
})
