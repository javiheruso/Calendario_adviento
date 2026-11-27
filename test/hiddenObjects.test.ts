import { test } from 'node:test'
import { strict as assert } from 'node:assert'
import {
  HIDDEN_OBJECTS,
  HIDDEN_OBJECT_COUNT,
  createHiddenObjectsState,
  findHiddenObjectAt,
  foundHiddenObjectCount,
  hiddenObjectHintRect,
  isHiddenObjectsComplete,
  markHiddenObject,
  nextUnfoundHiddenObject,
  pointInHiddenRect,
  type HiddenObject,
  type HiddenObjectsState,
} from '../src/domain/games/hiddenObjects'

function center(object: HiddenObject): { x: number; y: number } {
  return {
    x: object.rect.x + object.rect.width / 2,
    y: object.rect.y + object.rect.height / 2,
  }
}

function mark(
  state: HiddenObjectsState,
  object: HiddenObject,
): ReturnType<typeof markHiddenObject> {
  const point = center(object)
  return findHiddenObjectAt(state, point.x, point.y)
}

test('the six approved hidden objects are defined once with valid rectangles', () => {
  assert.equal(HIDDEN_OBJECT_COUNT, 6)
  assert.equal(HIDDEN_OBJECTS.length, 6)
  assert.deepEqual(
    HIDDEN_OBJECTS.map((object) => object.id),
    ['key', 'sock', 'carrot', 'bell', 'teddy', 'candy'],
  )
  assert.equal(new Set(HIDDEN_OBJECTS.map((object) => object.zone)).size, 6)

  for (const object of HIDDEN_OBJECTS) {
    assert.ok(object.rect.x >= 0 && object.rect.x + object.rect.width <= 1)
    assert.ok(object.rect.y >= 0 && object.rect.y + object.rect.height <= 1)
  }
})

test('an object is found once and repeated taps are harmless', () => {
  const initial = createHiddenObjectsState()
  const key = HIDDEN_OBJECTS[0]

  const first = markHiddenObject(initial, key.id)
  assert.equal(first.result, 'found')
  assert.equal(foundHiddenObjectCount(first.state), 1)

  const repeated = markHiddenObject(first.state, key.id)
  assert.equal(repeated.result, 'already-found')
  assert.equal(foundHiddenObjectCount(repeated.state), 1)
})

test('taps outside every object are unlimited and never lose progress', () => {
  const state = createHiddenObjectsState()

  for (let attempt = 0; attempt < 5; attempt += 1) {
    assert.equal(findHiddenObjectAt(state, 0.52, 0.02).result, 'miss')
  }

  assert.equal(foundHiddenObjectCount(state), 0)
})

test('the mission completes only after all six objects', () => {
  let state = createHiddenObjectsState()

  HIDDEN_OBJECTS.forEach((object, index) => {
    const outcome = mark(state, object)
    assert.equal(outcome.result, 'found')
    state = outcome.state
    assert.equal(foundHiddenObjectCount(state), index + 1)
    assert.equal(isHiddenObjectsComplete(state), index === HIDDEN_OBJECTS.length - 1)
  })
})

test('the zone help points at the next object and stays inside the scene', () => {
  let state = createHiddenObjectsState()

  for (const object of HIDDEN_OBJECTS) {
    assert.equal(nextUnfoundHiddenObject(state)?.id, object.id)

    const hint = hiddenObjectHintRect(object)
    assert.ok(hint.x >= 0 && hint.y >= 0)
    assert.ok(hint.x + hint.width <= 1)
    assert.ok(hint.y + hint.height <= 1)
    assert.equal(pointInHiddenRect(hint, center(object).x, center(object).y), true)

    state = mark(state, object).state
  }

  assert.equal(nextUnfoundHiddenObject(state), null)
})
