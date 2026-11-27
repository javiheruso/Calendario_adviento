import { test } from 'node:test'
import { strict as assert } from 'node:assert'
import {
  MATH_AID_MESSAGES,
  MATH_ANSWERS,
  MATH_CODE,
  MATH_CODE_LENGTH,
  MATH_HIDDEN_SYMBOL,
  MATH_OPERATIONS,
  MATH_VALUES,
  answerMathOperation,
  appendMathCodeDigit,
  clearMathCode,
  createMathLockState,
  currentMathOperation,
  isMathOperationsComplete,
  operationValue,
  requestMathAid,
  submitHiddenValue,
  submitMathCode,
  type MathLockState,
} from '../src/domain/games/mathLock'

function solveHidden(state: MathLockState): MathLockState {
  const next = submitHiddenValue(state, MATH_VALUES[MATH_HIDDEN_SYMBOL])
  assert.equal(next.hiddenSolved, true)
  return next
}

function solveOperations(state: MathLockState): MathLockState {
  let current = state

  MATH_OPERATIONS.forEach((operation, index) => {
    const outcome = answerMathOperation(current, index, operationValue(operation))
    assert.equal(outcome.result, 'correct')
    current = outcome.state
  })

  return current
}

function enterCode(state: MathLockState, code: string): MathLockState {
  let current = state

  for (const digit of code) {
    current = appendMathCodeDigit(current, digit)
  }

  return current
}

test('the approved values, operations and code are fixed', () => {
  assert.deepEqual(MATH_VALUES, { tree: 5, gift: 3, reindeer: 4, star: 2 })
  assert.deepEqual(MATH_ANSWERS, [6, 9, 5])
  assert.equal(MATH_CODE, '695')
  assert.equal(MATH_CODE_LENGTH, 3)
  assert.equal(MATH_OPERATIONS.length, 3)
})

test('the hidden star value is discovered without recording wrong guesses', () => {
  let state = createMathLockState()

  assert.equal(submitHiddenValue(state, 1), state)
  assert.equal(submitHiddenValue(state, 9), state)
  assert.equal(submitHiddenValue(state, 2.5), state)
  assert.equal(submitHiddenValue(state, -1), state)

  state = submitHiddenValue(state, MATH_VALUES[MATH_HIDDEN_SYMBOL])
  assert.equal(state.hiddenSolved, true)
  assert.equal(state.hiddenValue, 2)
  assert.equal(submitHiddenValue(state, 8), state, 'the hidden value is only solved once')
})

test('operations stay blocked until the hidden value is correct', () => {
  const locked = createMathLockState()
  const outcome = answerMathOperation(locked, 0, MATH_ANSWERS[0])

  assert.equal(outcome.result, 'ignored')
  assert.equal(currentMathOperation(locked), null)
  assert.equal(isMathOperationsComplete(locked), false)
})

test('a wrong operation answer is feedback and can be retried', () => {
  let state = solveHidden(createMathLockState())
  const current = currentMathOperation(state)
  assert.ok(current)

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const wrong = answerMathOperation(state, current.index, MATH_ANSWERS[0] + 10)
    assert.equal(wrong.result, 'wrong')
    assert.equal(wrong.state.operationsSolved.length, 0)
  }

  const correct = answerMathOperation(state, current.index, MATH_ANSWERS[0])
  assert.equal(correct.result, 'correct')
  state = correct.state
  assert.deepEqual(state.operationsSolved, [0])
  assert.equal(currentMathOperation(state)?.index, 1)
})

test('solving the three operations opens the code step', () => {
  let state = solveHidden(createMathLockState())
  state = solveOperations(state)

  assert.equal(isMathOperationsComplete(state), true)
  assert.equal(currentMathOperation(state), null)
  assert.equal(answerMathOperation(state, 0, MATH_ANSWERS[0]).result, 'ignored')
})

test('progressive help stops at two levels', () => {
  let state = createMathLockState()
  assert.equal(MATH_AID_MESSAGES[0], null)

  state = requestMathAid(state)
  assert.equal(state.aidLevel, 1)
  assert.match(MATH_AID_MESSAGES[1] ?? '', /árbol 5/)

  state = requestMathAid(state)
  assert.equal(state.aidLevel, 2)
  assert.match(MATH_AID_MESSAGES[2] ?? '', /3 para llegar a 5/)

  assert.equal(requestMathAid(state), state)
})

test('the keypad keeps three digits and can be cleared', () => {
  let state = createMathLockState()

  for (const digit of ['6', '9', '5', '1']) {
    state = appendMathCodeDigit(state, digit)
  }

  assert.equal(state.codeInput, '695')
  assert.equal(appendMathCodeDigit(state, 'a'), state)

  const empty = createMathLockState()
  assert.equal(clearMathCode(empty), empty, 'clearing an empty code is stable')
  assert.equal(clearMathCode(state).codeInput, '')
})

test('the chest opens only with the hidden value, the operations and code 695', () => {
  const hiddenOnly = solveHidden(createMathLockState())
  assert.equal(submitMathCode(enterCode(hiddenOnly, MATH_CODE)).result, 'blocked')

  const operationsOnly = solveOperations(hiddenOnly)
  assert.equal(submitMathCode(enterCode(operationsOnly, '69')).result, 'incomplete')
  assert.equal(submitMathCode(enterCode(operationsOnly, '123')).result, 'wrong')

  const wrong = submitMathCode(enterCode(operationsOnly, '123'))
  assert.equal(wrong.state.unlocked, false)

  const correct = submitMathCode(enterCode(operationsOnly, MATH_CODE))
  assert.equal(correct.result, 'unlocked')
  assert.equal(correct.state.unlocked, true)
  assert.equal(submitMathCode(correct.state).result, 'unlocked')
})
