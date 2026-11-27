import { test } from 'node:test'
import { strict as assert } from 'node:assert'
import {
  createCountdown,
  extendCountdown,
  formatCountdown,
  pauseCountdown,
  startCountdown,
  tickCountdown,
} from '../src/domain/games/timer'

test('a countdown starts stopped at a safe whole number of seconds', () => {
  assert.deepEqual(createCountdown(60), { remainingSeconds: 60, running: false })
  assert.equal(createCountdown(-5).remainingSeconds, 0)
  assert.equal(createCountdown(Number.NaN).remainingSeconds, 0)
  assert.equal(createCountdown(12.9).remainingSeconds, 12)
})

test('an empty countdown cannot start, and ticking it changes nothing', () => {
  const empty = createCountdown(0)

  assert.equal(startCountdown(empty), empty)
  assert.equal(tickCountdown(empty), empty)
})

test('a running countdown decreases once per tick and stops exactly at zero', () => {
  let countdown = startCountdown(createCountdown(2))

  countdown = tickCountdown(countdown)
  assert.deepEqual(countdown, { remainingSeconds: 1, running: true })

  countdown = tickCountdown(countdown)
  assert.deepEqual(countdown, { remainingSeconds: 0, running: false })

  assert.equal(tickCountdown(countdown), countdown)
})

test('pausing freezes the countdown until it is started again', () => {
  const running = startCountdown(createCountdown(30))
  const paused = pauseCountdown(running)

  assert.equal(paused.running, false)
  assert.equal(tickCountdown(paused), paused)
  assert.equal(pauseCountdown(paused), paused)
  assert.equal(startCountdown(paused).running, true)
})

test('extra time is added without stealing the caller control of running', () => {
  const paused = createCountdown(0)
  const extended = extendCountdown(paused, 30)

  assert.deepEqual(extended, { remainingSeconds: 30, running: false })
  assert.equal(extendCountdown(extended, -5), extended)
  assert.equal(extendCountdown(extended, 0), extended)
  assert.equal(startCountdown(extended).running, true)
})

test('the clock format is minutes:seconds with padded seconds', () => {
  assert.equal(formatCountdown(0), '0:00')
  assert.equal(formatCountdown(5), '0:05')
  assert.equal(formatCountdown(60), '1:00')
  assert.equal(formatCountdown(125), '2:05')
  assert.equal(formatCountdown(-4), '0:00')
})
