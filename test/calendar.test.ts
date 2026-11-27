import { test } from 'node:test'
import { strict as assert } from 'node:assert'
import {
  SEASON,
  getDayStatus,
  getReleasedDaysWithoutStar,
  getTodayMissionDay,
  isDayReleased,
  isDayUnlocked,
} from '../src/domain/calendar'
import { createDefaultConfig } from '../src/domain/config'
import {
  completeMission,
  confirmGiftFound,
  createEmptyProgress,
} from '../src/domain/progress'
import type { AppConfig } from '../src/domain/types'

function localDate(year: number, month: number, day: number, hours = 0): Date {
  return new Date(year, month - 1, day, hours, 0, 0, 0)
}

test('the season is December 2026', () => {
  assert.deepEqual(SEASON, { year: 2026, month: 12, firstDay: 1, lastDay: 24 })
})

test('doors release at local midnight, not at UTC midnight', () => {
  assert.equal(isDayReleased(1, localDate(2026, 11, 30, 23)), false)
  assert.equal(isDayReleased(1, localDate(2026, 12, 1, 0)), true)
  assert.equal(isDayReleased(2, localDate(2026, 12, 1, 23)), false)
  assert.equal(isDayReleased(24, localDate(2026, 12, 24, 0)), true)
  assert.equal(isDayReleased(24, localDate(2027, 1, 1, 0)), true)
})

test('today only resolves inside the 24-day season', () => {
  assert.equal(getTodayMissionDay(localDate(2026, 11, 30, 23)), null)
  assert.equal(getTodayMissionDay(localDate(2026, 12, 1, 0)), 1)
  assert.equal(getTodayMissionDay(localDate(2026, 12, 24, 23)), 24)
  assert.equal(getTodayMissionDay(localDate(2026, 12, 25, 0)), null)
})

test('adult preview and manual unlock bypass the date; child mode does not', () => {
  const config = createDefaultConfig()
  const future = localDate(2026, 11, 30)

  assert.equal(isDayUnlocked(5, config, { adultPreview: false }, future), false)
  assert.equal(isDayUnlocked(5, config, { adultPreview: true }, future), true)

  const unlockedConfig: AppConfig = {
    ...config,
    days: {
      ...config.days,
      5: { ...config.days[5], manuallyUnlocked: true },
    },
  }

  assert.equal(isDayUnlocked(5, unlockedConfig, { adultPreview: false }, future), true)
})

test('day status follows unlock, mission and gift transitions', () => {
  const config = createDefaultConfig()
  const release = localDate(2026, 12, 3)

  let progress = createEmptyProgress()
  assert.equal(getDayStatus(1, progress, config, { adultPreview: false }, release), 'available')
  assert.equal(getDayStatus(4, progress, config, { adultPreview: false }, release), 'locked')

  progress = completeMission(progress, 1, localDate(2026, 12, 3, 10))
  assert.equal(
    getDayStatus(1, progress, config, { adultPreview: false }, release),
    'mission-complete',
  )

  progress = confirmGiftFound(progress, 1, localDate(2026, 12, 3, 11))
  assert.equal(getDayStatus(1, progress, config, { adultPreview: false }, release), 'gift-found')
})

test('a found gift stays visible even when the date rules would lock it', () => {
  const config = createDefaultConfig()
  const progress = confirmGiftFound(
    createEmptyProgress(),
    20,
    localDate(2026, 12, 3, 12),
  )

  assert.equal(
    getDayStatus(20, progress, config, { adultPreview: false }, localDate(2026, 12, 3)),
    'gift-found',
  )
})

test('released days without a star show honest pending progress', () => {
  const progress = confirmGiftFound(createEmptyProgress(), 1, localDate(2026, 12, 2, 10))

  assert.deepEqual(getReleasedDaysWithoutStar(progress, localDate(2026, 12, 3)), [2, 3])
  assert.deepEqual(getReleasedDaysWithoutStar(createEmptyProgress(), localDate(2026, 11, 30)), [])
  assert.deepEqual(getReleasedDaysWithoutStar(progress, localDate(2026, 12, 1)), [])
})
