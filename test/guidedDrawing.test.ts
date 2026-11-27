import { test } from 'node:test'
import { strict as assert } from 'node:assert'
import {
  GUIDED_DRAWING_EXTENSION_SECONDS,
  GUIDED_DRAWING_SCRIPT_END_SECONDS,
  GUIDED_DRAWING_STEPS,
  createGuidedDrawingState,
  currentGuidedDrawingStep,
  extendGuidedDrawingStep,
  finishGuidedDrawing,
  guidedDrawingStepDuration,
  isGuidedDrawingComplete,
  pauseGuidedDrawing,
  repeatGuidedDrawingStep,
  resetGuidedDrawing,
  startGuidedDrawing,
  tickGuidedDrawing,
  type GuidedDrawingState,
} from '../src/domain/games/guidedDrawing'

function tickMany(state: GuidedDrawingState, count: number): GuidedDrawingState {
  let next = state

  for (let index = 0; index < count; index += 1) {
    next = tickGuidedDrawing(next)
  }

  return next
}

test('the drawing script keeps the approved absolute times', () => {
  assert.deepEqual(
    GUIDED_DRAWING_STEPS.map((step) => step.atSeconds),
    [0, 5, 15, 25, 35, 45, 55, 65],
  )
  assert.equal(GUIDED_DRAWING_SCRIPT_END_SECONDS, 75)
  assert.equal(guidedDrawingStepDuration(0), 5)
  assert.equal(guidedDrawingStepDuration(1), 10)
  assert.equal(guidedDrawingStepDuration(7), 10)
})

test('the guided script advances only while running', () => {
  const initial = createGuidedDrawingState()

  assert.equal(currentGuidedDrawingStep(initial).title, 'Cierra los ojos')
  assert.equal(tickGuidedDrawing(initial), initial)

  const running = startGuidedDrawing(initial)
  assert.equal(running.running, true)

  const four = tickMany(running, 4)
  assert.equal(four.stepIndex, 0)
  assert.equal(four.secondsInStep, 4)

  const five = tickGuidedDrawing(four)
  assert.equal(five.stepIndex, 1)
  assert.equal(five.secondsInStep, 0)
})

test('extra time extends the current step instead of skipping it', () => {
  const running = startGuidedDrawing(createGuidedDrawingState())
  const stepOne = tickMany(running, 5)
  const extended = extendGuidedDrawingStep(stepOne)

  const tenMore = tickMany(extended, 10)
  assert.equal(tenMore.stepIndex, 1)
  assert.equal(tenMore.extraSeconds, GUIDED_DRAWING_EXTENSION_SECONDS)

  const afterExtension = tickMany(tenMore, GUIDED_DRAWING_EXTENSION_SECONDS)
  assert.equal(afterExtension.stepIndex, 2)
  assert.equal(afterExtension.extraSeconds, 0)
})

test('repeating an instruction restarts its own countdown', () => {
  const running = startGuidedDrawing(createGuidedDrawingState())
  const stepOne = tickMany(running, 12)

  assert.equal(stepOne.stepIndex, 1)
  assert.equal(stepOne.secondsInStep, 7)

  const repeated = repeatGuidedDrawingStep(stepOne)
  assert.equal(repeated.stepIndex, 1)
  assert.equal(repeated.secondsInStep, 0)
  assert.equal(repeated.running, true)
})

test('pausing freezes the script and restarting resets it', () => {
  const running = tickMany(startGuidedDrawing(createGuidedDrawingState()), 3)
  const paused = pauseGuidedDrawing(running)

  assert.equal(paused.running, false)
  assert.equal(tickGuidedDrawing(paused), paused)

  assert.deepEqual(resetGuidedDrawing(), createGuidedDrawingState())
})

test('the full script ends after the last approved step without failing', () => {
  let state = startGuidedDrawing(createGuidedDrawingState())

  for (let index = 0; index < 300 && state.running; index += 1) {
    state = tickGuidedDrawing(state)
  }

  assert.equal(state.running, false)
  assert.equal(state.scriptComplete, true)
  assert.equal(state.stepIndex, GUIDED_DRAWING_STEPS.length - 1)
  assert.equal(state.finished, false)
})

test('manual completion works at any time and stops the timer', () => {
  const early = finishGuidedDrawing(startGuidedDrawing(createGuidedDrawingState()))

  assert.equal(isGuidedDrawingComplete(early), true)
  assert.equal(early.running, false)
  assert.equal(early.stepIndex, 0)
  assert.equal(tickGuidedDrawing(early), early)
  assert.equal(finishGuidedDrawing(early), early)
  assert.equal(repeatGuidedDrawingStep(early), early)
  assert.equal(extendGuidedDrawingStep(early), early)
})
