import { test } from 'node:test'
import { strict as assert } from 'node:assert'
import {
  REWARD_RETURN_DELAY_MS,
  STAR_EARNED_EVENT,
  persistBeforePublish,
  shouldReturnToCalendar,
  starEarnedDetail,
} from '../src/domain/reward'
import {
  confirmGiftFound,
  countStars,
  createEmptyProgress,
} from '../src/domain/progress'
import { TOTAL_MISSIONS } from '../src/domain/types'

test('only a saved child star returns automatically to the calendar', () => {
  assert.equal(shouldReturnToCalendar(true, false), true)
  assert.equal(shouldReturnToCalendar(false, false), false, 'a failed write never navigates')
  assert.equal(shouldReturnToCalendar(true, true), false, 'preview/demo stays isolated')
  assert.ok(REWARD_RETURN_DELAY_MS >= 1500)
})

test('the reward event carries the earned day and real star count', () => {
  const detail = starEarnedDetail(7, 3, TOTAL_MISSIONS)

  assert.deepEqual(detail, { day: 7, stars: 3, total: 24 })
  assert.equal(STAR_EARNED_EVENT, 'advent:star-earned')
})

test('a repeated gift confirmation keeps a single star', () => {
  let progress = confirmGiftFound(createEmptyProgress(), 9, new Date('2026-12-09T10:00:00Z'))
  progress = confirmGiftFound(progress, 9, new Date('2026-12-09T12:00:00Z'))

  assert.equal(countStars(progress), 1)
  assert.equal(progress.days[9]?.giftFoundAt, '2026-12-09T10:00:00.000Z')
})

test('demo progress is a separate object and cannot mutate child progress', () => {
  const child = confirmGiftFound(createEmptyProgress(), 1)
  const demo = confirmGiftFound(createEmptyProgress(), 2)

  assert.equal(countStars(child), 1)
  assert.equal(countStars(demo), 1)
  assert.equal(child.days[2], undefined)
  assert.equal(demo.days[1], undefined)
})

test('progress is published only after the save succeeds', () => {
  const events: string[] = []
  const saved = persistBeforePublish(
    2,
    (value) => {
      events.push(`save:${value}`)
      return true
    },
    (value) => {
      events.push(`publish:${value}`)
    },
  )

  assert.equal(saved, true)
  assert.deepEqual(events, ['save:2', 'publish:2'])
})

test('a failed save never publishes the new progress or star', () => {
  const published: number[] = []
  const saved = persistBeforePublish(
    2,
    () => false,
    (value) => {
      published.push(value)
    },
  )

  assert.equal(saved, false)
  assert.deepEqual(published, [])
})
