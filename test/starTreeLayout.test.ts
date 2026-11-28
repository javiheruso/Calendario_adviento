import { test } from 'node:test'
import { strict as assert } from 'node:assert'
import {
  STAR_FINAL_SIZE_PERCENT,
  STAR_POSITIONS,
  STAR_SIZE_PERCENT,
} from '../src/domain/starTreeLayout'
import { MISSION_DAYS } from '../src/domain/types'

test('the tree has exactly one scalable position per mission day', () => {
  assert.equal(STAR_POSITIONS.length, 24)

  const days = STAR_POSITIONS.map((position) => position.day)

  assert.deepEqual(
    [...days].sort((first, second) => first - second),
    [...MISSION_DAYS],
    'every mission day must have exactly one star position',
  )
  assert.equal(new Set(days).size, 24, 'no mission day may be repeated')
})

test('every star position stays inside the tree artwork', () => {
  assert.ok(
    STAR_SIZE_PERCENT > 0 && STAR_SIZE_PERCENT < 20,
    'the star size must stay a small percentage of the tree width',
  )

  for (const { day, left, top } of STAR_POSITIONS) {
    assert.ok(left > 0 && left < 100, `day ${day} must keep its left inside 0–100%`)
    assert.ok(top > 0 && top < 100, `day ${day} must keep its top inside 0–100%`)
  }
})

test('day 24 sits at the tip and is the largest star', () => {
  const final = STAR_POSITIONS.find((position) => position.day === 24)
  assert.ok(final)
  assert.equal(final.left, 50, 'the final star is centred on the tip')
  assert.equal(final.top, 10, 'the final star is the highest star')
  assert.equal(final.size, STAR_FINAL_SIZE_PERCENT)
  assert.ok(STAR_FINAL_SIZE_PERCENT > STAR_SIZE_PERCENT)

  for (const position of STAR_POSITIONS) {
    if (position.day === 24) {
      continue
    }

    assert.equal(position.size, STAR_SIZE_PERCENT)
    assert.ok(position.top >= final.top, 'no other star sits above the final star')
  }
})

test('no two stars share the same centre', () => {
  const seen = new Set<string>()

  for (const { day, left, top } of STAR_POSITIONS) {
    const key = `${left}:${top}`

    assert.equal(seen.has(key), false, `day ${day} collides with another star at ${key}`)
    seen.add(key)
  }
})
