import { test } from 'node:test'
import { strict as assert } from 'node:assert'
import {
  DANCE_CELEBRATION_SECONDS,
  DANCE_COUNTDOWN_SECONDS,
  DANCE_CUES,
  DANCE_MUSIC_END_SECONDS,
  DANCE_STATUE_HOLD_SECONDS,
  DANCE_TOTAL_SECONDS,
  activeDanceCue,
  advanceDance,
  createDanceState,
  danceCountdownValue,
  dancePhase,
  danceSnapshot,
  isDanceComplete,
  isStatuePause,
  restartDance,
  startDance,
} from '../src/domain/games/dance'

function atMusic(seconds: number) {
  const started = startDance(createDanceState())
  return advanceDance(started, DANCE_COUNTDOWN_SECONDS + seconds)
}

test('the approved choreography keeps its exact cue times and labels', () => {
  assert.deepEqual(
    DANCE_CUES.map((cue) => cue.atSeconds),
    [4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48],
  )
  assert.deepEqual(
    DANCE_CUES.map((cue) => cue.label),
    [
      '¡Salta!',
      '¡Vuelta!',
      '¡Agáchate!',
      '¡Vuelta!',
      '¡Palmas!',
      '¡Salta, salta!',
      '¡Mueve el culete!',
      '¡Estatua!',
      '¡Sigue bailando!',
      '¡Vuelta!',
      '¡Palmas!',
      '¡Pose de duende!',
    ],
  )
  assert.equal(DANCE_MUSIC_END_SECONDS, 48)
  assert.equal(DANCE_STATUE_HOLD_SECONDS, 36 - 32)
  assert.equal(
    DANCE_TOTAL_SECONDS,
    DANCE_COUNTDOWN_SECONDS + DANCE_MUSIC_END_SECONDS + DANCE_CELEBRATION_SECONDS,
  )
})

test('the countdown starts on request and counts 3, 2, 1', () => {
  const ready = createDanceState()
  assert.equal(dancePhase(ready), 'ready')
  assert.equal(danceCountdownValue(ready), null)
  assert.equal(advanceDance(ready, 5), ready, 'the timeline does not move before starting')

  const started = startDance(ready)
  assert.equal(started.started, true)
  assert.equal(startDance(started), started, 'starting twice never resets the countdown')
  assert.equal(danceCountdownValue(started), 3)
  assert.equal(danceCountdownValue(advanceDance(started, 1)), 2)
  assert.equal(danceCountdownValue(advanceDance(started, 2)), 1)
  assert.equal(danceCountdownValue(advanceDance(started, 3)), null)
  assert.equal(dancePhase(advanceDance(started, 3)), 'dancing')
})

test('cues arrive at their exact approved boundaries', () => {
  assert.equal(activeDanceCue(atMusic(0)), null)
  assert.equal(activeDanceCue(atMusic(3.9)), null)
  assert.equal(activeDanceCue(atMusic(4))?.label, '¡Salta!')
  assert.equal(activeDanceCue(atMusic(7.9))?.label, '¡Salta!')
  assert.equal(activeDanceCue(atMusic(8))?.label, '¡Vuelta!')
  assert.equal(activeDanceCue(atMusic(24))?.label, '¡Salta, salta!')
  assert.equal(activeDanceCue(atMusic(32))?.label, '¡Estatua!')
  assert.equal(activeDanceCue(atMusic(48))?.label, '¡Pose de duende!')
})

test('the statue cue holds the approved four-second musical pause', () => {
  assert.equal(isStatuePause(atMusic(32)), true)
  assert.equal(isStatuePause(atMusic(35.9)), true)
  assert.equal(isStatuePause(atMusic(36)), false)
  assert.equal(activeDanceCue(atMusic(35.9))?.label, '¡Estatua!')
  assert.equal(activeDanceCue(atMusic(36))?.label, '¡Sigue bailando!')
})

test('the final pose leads to celebration and then completion', () => {
  const pose = atMusic(48)
  assert.equal(dancePhase(pose), 'celebrating')
  assert.equal(isDanceComplete(pose), false)

  const complete = atMusic(48 + DANCE_CELEBRATION_SECONDS)
  assert.equal(dancePhase(complete), 'complete')
  assert.equal(isDanceComplete(complete), true)
  assert.equal(activeDanceCue(complete)?.move, 'pose')

  const clamped = advanceDance(complete, 100)
  assert.equal(clamped, complete, 'the timeline never advances past completion')
})

test('restarting repeats the whole choreography from the countdown', () => {
  const restarted = restartDance()
  assert.equal(restarted.started, true)
  assert.equal(restarted.elapsedSeconds, 0)
  assert.equal(dancePhase(restarted), 'countdown')
  assert.equal(danceCountdownValue(restarted), 3)
  assert.equal(danceSnapshot(restarted).progress, 0)
})
