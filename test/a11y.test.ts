import { test } from 'node:test'
import { strict as assert } from 'node:assert'
import {
  DEFAULT_COUNTDOWN_MILESTONES,
  TOUCH_TARGET_MIN_PX,
  countdownAnnouncement,
} from '../src/domain/a11y'

test('the touch target rule matches the 44 px requirement', () => {
  assert.equal(TOUCH_TARGET_MIN_PX, 44)
})

test('countdowns only announce meaningful milestones', () => {
  assert.deepEqual(DEFAULT_COUNTDOWN_MILESTONES, [30, 10, 0])

  assert.equal(countdownAnnouncement(31, 'Baile'), null)
  assert.equal(countdownAnnouncement(30, 'Baile'), 'Baile: quedan 30 segundos.')
  assert.equal(countdownAnnouncement(11, 'Baile'), null)
  assert.equal(countdownAnnouncement(10, 'Baile'), 'Baile: quedan 10 segundos.')
  assert.equal(countdownAnnouncement(0, 'Baile'), 'Baile: tiempo terminado.')
})

test('fractional ticks round up so a milestone is not skipped', () => {
  assert.equal(countdownAnnouncement(29.8, 'Villancico'), 'Villancico: quedan 30 segundos.')
  assert.equal(countdownAnnouncement(30.2, 'Villancico'), null)
  assert.equal(countdownAnnouncement(30.0, 'Villancico'), 'Villancico: quedan 30 segundos.')
})

test('custom milestones and invalid values stay predictable', () => {
  assert.equal(
    countdownAnnouncement(5, 'Observación', [5, 0]),
    'Observación: quedan 5 segundos.',
  )
  assert.equal(countdownAnnouncement(-4, 'Observación', [5, 0]), 'Observación: tiempo terminado.')
  assert.equal(countdownAnnouncement(Number.NaN, 'Observación'), null)
  assert.equal(countdownAnnouncement(Number.POSITIVE_INFINITY, 'Observación'), null)
})
