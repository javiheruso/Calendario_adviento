import { test } from 'node:test'
import { strict as assert } from 'node:assert'
import {
  completeMission,
  confirmGiftFound,
  countStars,
  createEmptyProgress,
  hasStar,
  isAlbumComplete,
  revealHint,
} from '../src/domain/progress'
import { MISSION_DAYS } from '../src/domain/types'

const FIRST = new Date('2026-12-01T10:00:00.000Z')
const LATER = new Date('2026-12-01T12:00:00.000Z')

test('completeMission keeps the first timestamp and never mutates the input', () => {
  const initial = createEmptyProgress()
  const completed = completeMission(initial, 1, FIRST)

  assert.equal(initial.days[1], undefined)
  assert.equal(completed.days[1]?.missionCompletedAt, FIRST.toISOString())

  const repeated = completeMission(completed, 1, LATER)
  assert.equal(repeated, completed)
})

test('confirmGiftFound awards exactly one star per day', () => {
  let progress = confirmGiftFound(createEmptyProgress(), 1, FIRST)
  progress = confirmGiftFound(progress, 1, LATER)

  assert.equal(countStars(progress), 1)
  assert.equal(hasStar(progress, 1), true)
  assert.equal(progress.days[1]?.giftFoundAt, FIRST.toISOString())
  assert.equal(progress.days[1]?.missionCompletedAt, FIRST.toISOString())
})

test('confirmGiftFound preserves an earlier mission completion time', () => {
  const completed = completeMission(createEmptyProgress(), 2, FIRST)
  const withGift = confirmGiftFound(completed, 2, LATER)

  assert.equal(withGift.days[2]?.missionCompletedAt, FIRST.toISOString())
  assert.equal(withGift.days[2]?.giftFoundAt, LATER.toISOString())
})

test('stars are counted per day, never per confirmation', () => {
  let progress = createEmptyProgress()

  for (const day of [1, 1, 2, 2, 3] as const) {
    progress = confirmGiftFound(progress, day, FIRST)
  }

  assert.equal(countStars(progress), 3)
})

test('replaying a completed mission never changes its star or timestamps', () => {
  const completed = confirmGiftFound(completeMission(createEmptyProgress(), 4, FIRST), 4, FIRST)
  const replayedMission = completeMission(completed, 4, LATER)
  const replayedGift = confirmGiftFound(replayedMission, 4, LATER)

  assert.equal(replayedMission, completed)
  assert.equal(replayedGift, completed)
  assert.equal(countStars(replayedGift), 1)
  assert.equal(replayedGift.days[4]?.missionCompletedAt, FIRST.toISOString())
  assert.equal(replayedGift.days[4]?.giftFoundAt, FIRST.toISOString())
})

test('hints stay revealed once shown', () => {
  let progress = revealHint(createEmptyProgress(), 3, 'main', FIRST)
  progress = revealHint(progress, 3, 'main', LATER)

  assert.equal(progress.days[3]?.hintRevealedAt, FIRST.toISOString())
  assert.equal(progress.days[3]?.locationHintRevealedAt, null)

  const withLocation = revealHint(progress, 3, 'location', LATER)
  assert.equal(withLocation.days[3]?.locationHintRevealedAt, LATER.toISOString())
  assert.equal(withLocation.days[3]?.hintRevealedAt, FIRST.toISOString())
})

test('the album is complete only with all 24 stars', () => {
  let progress = createEmptyProgress()

  for (const day of MISSION_DAYS.slice(0, 23)) {
    progress = confirmGiftFound(progress, day, FIRST)
  }

  assert.equal(isAlbumComplete(progress), false)

  progress = confirmGiftFound(progress, 24, FIRST)
  assert.equal(isAlbumComplete(progress), true)
  assert.equal(countStars(progress), 24)
})
