import { test } from 'node:test'
import { strict as assert } from 'node:assert'
import {
  CATCH_BASKET_HALF_WIDTH,
  CATCH_BASKET_Y,
  CATCH_MAX_FALL_SPEED,
  CATCH_TARGET,
  catchFallSpeed,
  catchSpawnInterval,
  createCatchGame,
  isCatchGameComplete,
  moveCatchBasket,
  stepCatchGame,
  type CatchGameState,
} from '../src/domain/games/catchGifts'
import { sequenceRandom } from './random'

function withGift(
  x: number,
  y: number,
  patch: Partial<CatchGameState> = {},
): CatchGameState {
  return {
    ...createCatchGame(),
    gifts: [{ id: 1, x, y }],
    spawnCooldownMs: 999_999,
    ...patch,
  }
}

test('the game starts centred with no catches and no lives or timer to lose', () => {
  const state = createCatchGame()

  assert.equal(CATCH_TARGET, 15)
  assert.equal(state.basketX, 0.5)
  assert.equal(state.caught, 0)
  assert.equal(state.missed, 0)
  assert.equal(isCatchGameComplete(state), false)
})

test('the basket is clamped to the play field', () => {
  const state = createCatchGame()

  assert.equal(moveCatchBasket(state, -2).basketX, 0)
  assert.equal(moveCatchBasket(state, 2).basketX, 1)
  assert.equal(moveCatchBasket(state, 0.25).basketX, 0.25)
  assert.equal(moveCatchBasket(state, 0.5), state, 'unchanged position is stable')
})

test('a gift aligned with the basket is caught', () => {
  const state = withGift(0.5, CATCH_BASKET_Y - 0.001, { basketX: 0.5 })
  const next = stepCatchGame(state, 16)

  assert.equal(next.caught, 1)
  assert.equal(next.missed, 0)
  assert.equal(next.gifts.length, 0)
  assert.equal(isCatchGameComplete(next), false)
})

test('a missed gift is not a penalty and cannot end the game', () => {
  const state = withGift(0.5 + CATCH_BASKET_HALF_WIDTH + 0.1, CATCH_BASKET_Y - 0.001)
  const next = stepCatchGame(state, 16)

  assert.equal(next.caught, 0)
  assert.equal(next.missed, 1)
  assert.equal(next.gifts.length, 0)
  assert.equal(isCatchGameComplete(next), false)

  const manyMisses = stepCatchGame(
    { ...createCatchGame(), missed: 200, elapsedMs: 600_000 },
    16,
  )
  assert.equal(isCatchGameComplete(manyMisses), false)
})

test('speed and spawn rate change smoothly and stay bounded', () => {
  assert.ok(catchFallSpeed(0) < catchFallSpeed(5))
  assert.ok(catchFallSpeed(5) < catchFallSpeed(15))
  assert.equal(catchFallSpeed(500), CATCH_MAX_FALL_SPEED)

  assert.ok(catchSpawnInterval(0) > catchSpawnInterval(7))
  assert.ok(catchSpawnInterval(7) > catchSpawnInterval(15))

  const slow = stepCatchGame(withGift(0.5, 0.1, { caught: 0 }), 50)
  const fast = stepCatchGame(withGift(0.5, 0.1, { caught: 10 }), 50)
  assert.ok(fast.gifts[0].y > slow.gifts[0].y)
})

test('a gift spawns after the cooldown at a normalized horizontal position', () => {
  const state = { ...createCatchGame(), spawnCooldownMs: 0 }
  const next = stepCatchGame(state, 16, sequenceRandom([0.5]))

  assert.equal(next.gifts.length, 1)
  assert.ok(Math.abs(next.gifts[0].x - 0.5) < 1e-9)
  assert.equal(next.gifts[0].y, 0)
  assert.equal(next.nextGiftId, 2)
  assert.ok(next.spawnCooldownMs > 0)
})

test('catching the fifteenth gift completes the mission and freezes the game', () => {
  const state = withGift(0.5, CATCH_BASKET_Y - 0.001, {
    caught: CATCH_TARGET - 1,
  })
  const complete = stepCatchGame(state, 16)

  assert.equal(complete.caught, CATCH_TARGET)
  assert.equal(isCatchGameComplete(complete), true)
  assert.equal(stepCatchGame(complete, 16), complete)
})
