import { test } from 'node:test'
import { strict as assert } from 'node:assert'
import {
  SPOT_DIFFERENCES,
  SPOT_DIFFERENCE_COUNT,
  createSpotDifferenceState,
  foundSpotCount,
  isSpotDifferenceComplete,
  markSpotDifference,
  nextUnfoundSpot,
  pointInRect,
  spotHintRect,
  type DifferenceSpot,
  type SpotDifferenceState,
} from '../src/domain/games/spotDifference'

function center(spot: DifferenceSpot): { x: number; y: number } {
  return {
    x: spot.rect.x + spot.rect.width / 2,
    y: spot.rect.y + spot.rect.height / 2,
  }
}

function markSpot(
  state: SpotDifferenceState,
  spot: DifferenceSpot,
): ReturnType<typeof markSpotDifference> {
  const point = center(spot)
  return markSpotDifference(state, point.x, point.y)
}

test('the five approved differences are defined once with valid rectangles', () => {
  assert.equal(SPOT_DIFFERENCE_COUNT, 5)
  assert.equal(SPOT_DIFFERENCES.length, 5)
  assert.equal(new Set(SPOT_DIFFERENCES.map((spot) => spot.id)).size, 5)
  assert.deepEqual(
    SPOT_DIFFERENCES.map((spot) => spot.id),
    ['bauble', 'gift', 'clock', 'hat', 'carrot'],
  )

  for (const spot of SPOT_DIFFERENCES) {
    assert.ok(spot.rect.x >= 0 && spot.rect.x + spot.rect.width <= 1)
    assert.ok(spot.rect.y >= 0 && spot.rect.y + spot.rect.height <= 1)
  }
})

test('marking a difference in either picture shares the same found state', () => {
  const initial = createSpotDifferenceState()
  const spot = SPOT_DIFFERENCES[0]

  const firstMark = markSpot(initial, spot)
  assert.equal(firstMark.result, 'found')
  assert.equal(foundSpotCount(firstMark.state), 1)

  // The second picture uses the same shared state and the same handler.
  const secondMark = markSpot(firstMark.state, spot)
  assert.equal(secondMark.result, 'already-found')
  assert.equal(foundSpotCount(secondMark.state), 1)
})

test('taps outside every change are unlimited and never lose progress', () => {
  const state = createSpotDifferenceState()
  const miss = markSpotDifference(state, 0.5, 0.05)
  assert.equal(miss.result, 'miss')
  assert.equal(foundSpotCount(miss.state), 0)

  for (let attempt = 0; attempt < 5; attempt += 1) {
    assert.equal(markSpotDifference(miss.state, 0.5, 0.05).result, 'miss')
  }
})

test('the mission completes only after all five differences', () => {
  let state = createSpotDifferenceState()

  SPOT_DIFFERENCES.forEach((spot, index) => {
    const outcome = markSpot(state, spot)
    assert.equal(outcome.result, 'found')
    state = outcome.state
    assert.equal(foundSpotCount(state), index + 1)
    assert.equal(isSpotDifferenceComplete(state), index === SPOT_DIFFERENCES.length - 1)
  })
})

test('the zone hint points at the next change and stays inside the image', () => {
  let state = createSpotDifferenceState()

  for (const spot of SPOT_DIFFERENCES) {
    assert.equal(nextUnfoundSpot(state)?.id, spot.id)

    const hint = spotHintRect(spot)
    assert.ok(hint.x >= 0 && hint.y >= 0)
    assert.ok(hint.x + hint.width <= 1)
    assert.ok(hint.y + hint.height <= 1)
    assert.equal(pointInRect(hint, center(spot).x, center(spot).y), true)

    state = markSpot(state, spot).state
  }

  assert.equal(nextUnfoundSpot(state), null)
})
