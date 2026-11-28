import { test } from 'node:test'
import { strict as assert } from 'node:assert'
import {
  SNOWMAN_CATEGORIES,
  SNOWMAN_FIXED_TARGET,
  SNOWMAN_OBSERVE_MS,
  SNOWMAN_OBSERVE_SECONDS,
  SNOWMAN_PHASES,
  SNOWMAN_PHASE_COUNT,
  SNOWMAN_VARIANTS_PER_CATEGORY,
  chooseSnowmanOption,
  completedSnowmanPhases,
  createSnowmanState,
  currentSnowmanPhase,
  isSnowmanComplete,
  startSnowmanBuilding,
  type SnowmanState,
} from '../src/domain/games/snowman'

function solvePhase(state: SnowmanState): SnowmanState {
  const phase = currentSnowmanPhase(state)
  assert.ok(phase)
  return chooseSnowmanOption(state, phase.correctOptionId)
}

test('the fixed model has four consecutive phases and three options each', () => {
  assert.equal(SNOWMAN_CATEGORIES.length, 4)
  assert.equal(SNOWMAN_VARIANTS_PER_CATEGORY, 3)
  assert.equal(SNOWMAN_OBSERVE_SECONDS, 15)
  assert.equal(SNOWMAN_OBSERVE_MS, 15_000)
  assert.equal(SNOWMAN_PHASE_COUNT, 4)
  assert.equal(SNOWMAN_PHASES.length, 4)

  assert.deepEqual(
    SNOWMAN_PHASES.map((phase) => phase.category),
    ['hat', 'nose', 'scarf', 'buttons'],
  )
  assert.deepEqual(
    SNOWMAN_PHASES.map((phase) => phase.correctOptionId),
    ['top', 'carrot', 'red', 'coal'],
  )
  assert.deepEqual(SNOWMAN_FIXED_TARGET, {
    hat: 'top',
    nose: 'carrot',
    scarf: 'red',
    buttons: 'coal',
  })

  for (const phase of SNOWMAN_PHASES) {
    assert.equal(phase.options.length, 3, phase.category)
    assert.equal(
      new Set(phase.options.map((option) => option.id)).size,
      3,
      phase.category,
    )
    assert.ok(
      phase.options.some((option) => option.id === phase.correctOptionId),
      phase.category,
    )
  }
})

test('the game starts observing and only accepts choices while building', () => {
  const initial = createSnowmanState()

  assert.equal(initial.stage, 'observing')
  assert.equal(completedSnowmanPhases(initial), 0)
  assert.equal(currentSnowmanPhase(initial), null)
  assert.equal(chooseSnowmanOption(initial, 'top'), initial)

  const building = startSnowmanBuilding(initial)
  assert.equal(building.stage, 'building')
  assert.equal(startSnowmanBuilding(building), building, 'building is not restarted')
  assert.equal(currentSnowmanPhase(building)?.category, 'hat')
})

test('a wrong choice is kind feedback and keeps the same phase open', () => {
  const building = startSnowmanBuilding(createSnowmanState())
  const wrong = chooseSnowmanOption(building, 'santa')

  assert.equal(wrong.stage, 'building')
  assert.equal(wrong.step, 0)
  assert.equal(wrong.lastResult, 'wrong')
  assert.equal(wrong.attempts, 1)
  assert.equal(isSnowmanComplete(wrong), false)

  const repeated = chooseSnowmanOption(wrong, 'green')
  assert.equal(repeated.step, 0)
  assert.equal(repeated.attempts, 2)
})

test('unknown options are ignored without changing the state', () => {
  const building = startSnowmanBuilding(createSnowmanState())
  assert.equal(chooseSnowmanOption(building, 'not-an-option'), building)
})

test('correct choices advance through the four complete phases in order', () => {
  let state = startSnowmanBuilding(createSnowmanState())

  for (let step = 0; step < SNOWMAN_PHASE_COUNT; step += 1) {
    assert.equal(state.step, step)
    assert.equal(completedSnowmanPhases(state), step)
    assert.equal(isSnowmanComplete(state), false)

    state = solvePhase(state)
    assert.equal(state.lastResult, 'correct')
    assert.equal(state.step, step + 1)
  }

  assert.equal(isSnowmanComplete(state), true)
  assert.equal(completedSnowmanPhases(state), SNOWMAN_PHASE_COUNT)
  assert.equal(currentSnowmanPhase(state), null)
  assert.equal(chooseSnowmanOption(state, 'top'), state)
})

test('the mission completes only after the last phase', () => {
  let state = startSnowmanBuilding(createSnowmanState())

  for (let step = 0; step < SNOWMAN_PHASE_COUNT - 1; step += 1) {
    state = solvePhase(state)
    assert.equal(isSnowmanComplete(state), false)
  }

  state = solvePhase(state)
  assert.equal(isSnowmanComplete(state), true)
})
