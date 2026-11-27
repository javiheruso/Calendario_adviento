import { test } from 'node:test'
import { strict as assert } from 'node:assert'
import {
  PATTERN_CHALLENGES,
  PATTERN_COUNT,
  acknowledgePatternResult,
  createPatternState,
  currentPattern,
  isPatternGameComplete,
  patternOptions,
  submitPatternChoice,
} from '../src/domain/games/patterns'

test('the five approved patterns keep their sequence and answer', () => {
  assert.equal(PATTERN_COUNT, 5)
  assert.deepEqual(
    PATTERN_CHALLENGES.map((challenge) => challenge.sequence.join('')),
    ['ABABA', 'ABCAB', 'AABAA', 'ABBAB', 'ABCABCA'],
  )
  assert.deepEqual(
    PATTERN_CHALLENGES.map((challenge) => challenge.answer),
    ['B', 'C', 'B', 'B', 'B'],
  )
})

test('the options always include the answer and never invent a symbol', () => {
  for (const challenge of PATTERN_CHALLENGES) {
    const options = patternOptions(challenge)
    const used = new Set([...challenge.sequence, challenge.answer])

    assert.equal(options.includes(challenge.answer), true)
    assert.equal(options.length, used.size)

    for (const option of options) {
      assert.equal(used.has(option), true)
    }
  }
})

test('a wrong choice is only feedback and can be retried', () => {
  const challenge = PATTERN_CHALLENGES[0]
  const state = createPatternState()

  const wrongChoice = challenge.answer === 'A' ? 'B' : 'A'
  let outcome = submitPatternChoice(state, challenge, wrongChoice)

  assert.equal(outcome.result, 'wrong')
  assert.equal(outcome.state.solved, 0)
  assert.equal(outcome.state.attempts, 1)

  for (let attempt = 0; attempt < 4; attempt += 1) {
    outcome = submitPatternChoice(outcome.state, challenge, wrongChoice)
  }

  assert.equal(outcome.state.solved, 0)
  assert.equal(outcome.state.attempts, 5)

  outcome = submitPatternChoice(outcome.state, challenge, challenge.answer)
  assert.equal(outcome.result, 'correct')
  assert.equal(outcome.state.solved, 1)
})

test('a correct answer is acknowledged before the next pattern', () => {
  const challenge = PATTERN_CHALLENGES[0]
  const correct = submitPatternChoice(
    createPatternState(),
    challenge,
    challenge.answer,
  ).state

  assert.equal(correct.lastResult, 'correct')
  assert.equal(
    submitPatternChoice(correct, challenge, challenge.answer).result,
    'ignored',
  )

  const acknowledged = acknowledgePatternResult(correct)
  assert.equal(acknowledged.lastResult, 'none')
  assert.equal(acknowledged.solved, 1)
  assert.equal(currentPattern(acknowledged)?.id, PATTERN_CHALLENGES[1].id)
})

test('the game completes after all five correct patterns', () => {
  let state = createPatternState()

  for (const challenge of PATTERN_CHALLENGES) {
    assert.equal(currentPattern(state)?.id, challenge.id)
    state = submitPatternChoice(state, challenge, challenge.answer).state
    assert.equal(state.lastResult, 'correct')
    state = acknowledgePatternResult(state)
  }

  assert.equal(state.solved, PATTERN_COUNT)
  assert.equal(isPatternGameComplete(state), true)
  assert.equal(currentPattern(state), null)

  const ignored = submitPatternChoice(
    state,
    PATTERN_CHALLENGES[0],
    PATTERN_CHALLENGES[0].answer,
  )
  assert.equal(ignored.result, 'ignored')
  assert.equal(ignored.state, state)
})
