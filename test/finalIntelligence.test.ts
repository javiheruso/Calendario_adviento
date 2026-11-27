import { test } from 'node:test'
import { strict as assert } from 'node:assert'
import {
  FINAL_INTEL_ANSWERS,
  FINAL_INTEL_CODE,
  FINAL_INTEL_CODE_LENGTH,
  FINAL_INTEL_HIDDEN_SYMBOL,
  FINAL_INTEL_OPERATIONS,
  FINAL_INTEL_VALUES,
  appendFinalIntelCodeDigit,
  clearFinalIntelCode,
  createFinalIntelState,
  finalIntelOperationValue,
  isFinalIntelComplete,
  submitFinalIntelCode,
  submitFinalIntelHiddenValue,
  type FinalIntelState,
} from '../src/domain/games/finalIntelligence'

function solveHidden(state: FinalIntelState): FinalIntelState {
  const next = submitFinalIntelHiddenValue(
    state,
    FINAL_INTEL_VALUES[FINAL_INTEL_HIDDEN_SYMBOL],
  )
  assert.equal(next.hiddenSolved, true)
  return next
}

function enterCode(state: FinalIntelState, code: string): FinalIntelState {
  let current = state

  for (const digit of code) {
    current = appendFinalIntelCodeDigit(current, digit)
  }

  return current
}

test('the approved values, operations and code 64 are fixed', () => {
  assert.deepEqual(FINAL_INTEL_VALUES, { santa: 6, sleigh: 4, gift: 2, reindeer: 4 })
  assert.deepEqual(FINAL_INTEL_ANSWERS, [6, 4])
  assert.equal(FINAL_INTEL_CODE, '64')
  assert.equal(FINAL_INTEL_CODE_LENGTH, 2)
  assert.equal(FINAL_INTEL_OPERATIONS.length, 2)
  assert.deepEqual(
    FINAL_INTEL_OPERATIONS.map((operation) =>
      finalIntelOperationValue(operation),
    ),
    [6, 4],
  )
})

test('the hidden reindeer value is discovered without recording wrong guesses', () => {
  let state = createFinalIntelState()

  assert.equal(submitFinalIntelHiddenValue(state, 1), state)
  assert.equal(submitFinalIntelHiddenValue(state, 9), state)
  assert.equal(submitFinalIntelHiddenValue(state, 4.5), state)
  assert.equal(submitFinalIntelHiddenValue(state, -1), state)

  state = solveHidden(state)
  assert.equal(state.hiddenSolved, true)
  assert.equal(submitFinalIntelHiddenValue(state, 6), state, 'the hidden value is solved once')
})

test('the code stays blocked until the hidden value is correct', () => {
  const locked = createFinalIntelState()
  const outcome = submitFinalIntelCode(enterCode(locked, FINAL_INTEL_CODE))

  assert.equal(outcome.result, 'blocked')
  assert.equal(outcome.state.hiddenSolved, false)
})

test('wrong and incomplete codes keep the input editable', () => {
  const hidden = solveHidden(createFinalIntelState())

  assert.equal(submitFinalIntelCode(enterCode(hidden, '6')).result, 'incomplete')
  assert.equal(submitFinalIntelCode(enterCode(hidden, '12')).result, 'wrong')

  const wrong = submitFinalIntelCode(enterCode(hidden, '12'))
  assert.equal(wrong.state.complete, false)
  assert.equal(wrong.state.codeInput, '12')

  const cleared = clearFinalIntelCode(wrong.state)
  assert.equal(cleared.codeInput, '')
  assert.equal(clearFinalIntelCode(cleared), cleared, 'clearing an empty code is stable')
})

test('code 64 completes the intelligence crystal', () => {
  const hidden = solveHidden(createFinalIntelState())
  const outcome = submitFinalIntelCode(enterCode(hidden, FINAL_INTEL_CODE))

  assert.equal(outcome.result, 'unlocked')
  assert.equal(outcome.state.complete, true)
  assert.equal(isFinalIntelComplete(outcome.state), true)
  assert.equal(submitFinalIntelCode(outcome.state).result, 'unlocked')

  const extra = appendFinalIntelCodeDigit(outcome.state, '9')
  assert.equal(extra, outcome.state, 'a completed crystal accepts no more digits')
})
