/**
 * Day 12 gift-catching rules.
 *
 * The basket moves horizontally with a finger or mouse. Gifts fall from the top
 * and are caught when they reach the basket line. The fall speed and the spawn
 * rate grow smoothly with the number of gifts caught, but there are no lives,
 * no time limit and no penalty for letting a gift fall past the basket.
 */

export const CATCH_TARGET = 15
export const CATCH_BASKET_Y = 0.9
export const CATCH_BASKET_HALF_WIDTH = 0.12
export const CATCH_BASE_FALL_SPEED = 0.18
export const CATCH_MAX_FALL_SPEED = 0.46
export const CATCH_SPEED_PER_GIFT = 0.014
export const CATCH_BASE_SPAWN_MS = 1200
export const CATCH_MIN_SPAWN_MS = 560
export const CATCH_SPAWN_STEP_MS = 30
/** Caps a frame after a hidden tab so gifts never teleport past the basket. */
export const CATCH_MAX_DELTA_MS = 100

export interface FallingGift {
  readonly id: number
  readonly x: number
  readonly y: number
}

export interface CatchGameState {
  readonly basketX: number
  readonly gifts: readonly FallingGift[]
  readonly caught: number
  readonly missed: number
  readonly elapsedMs: number
  readonly spawnCooldownMs: number
  readonly nextGiftId: number
}

export function createCatchGame(): CatchGameState {
  return {
    basketX: 0.5,
    gifts: [],
    caught: 0,
    missed: 0,
    elapsedMs: 0,
    spawnCooldownMs: 0,
    nextGiftId: 1,
  }
}

export function isCatchGameComplete(state: CatchGameState): boolean {
  return state.caught >= CATCH_TARGET
}

/** Moves the basket centre to a normalized horizontal position. */
export function moveCatchBasket(state: CatchGameState, x: number): CatchGameState {
  const basketX = Math.min(1, Math.max(0, x))

  if (basketX === state.basketX) {
    return state
  }

  return { ...state, basketX }
}

/** Smooth, bounded speed growth driven by the gifts already caught. */
export function catchFallSpeed(caught: number): number {
  return Math.min(
    CATCH_MAX_FALL_SPEED,
    CATCH_BASE_FALL_SPEED + Math.max(0, caught) * CATCH_SPEED_PER_GIFT,
  )
}

export function catchSpawnInterval(caught: number): number {
  return Math.max(
    CATCH_MIN_SPAWN_MS,
    CATCH_BASE_SPAWN_MS - Math.max(0, caught) * CATCH_SPAWN_STEP_MS,
  )
}

function clampRandom(value: number): number {
  return Math.min(0.999, Math.max(0, value))
}

/**
 * Advances the simulation by a frame.
 *
 * A gift that reaches the basket line is caught when its centre is within the
 * basket tolerance; otherwise it is only counted as missed. Neither case can
 * end the game, so the only completion condition is reaching the target.
 */
export function stepCatchGame(
  state: CatchGameState,
  deltaMs: number,
  random: () => number = Math.random,
): CatchGameState {
  if (isCatchGameComplete(state)) {
    return state
  }

  const stepMs = Math.min(CATCH_MAX_DELTA_MS, Math.max(0, deltaMs))
  const fallSpeed = catchFallSpeed(state.caught)
  const fallDistance = (fallSpeed * stepMs) / 1000

  let caught = state.caught
  let missed = state.missed
  const remaining: FallingGift[] = []

  for (const gift of state.gifts) {
    const y = gift.y + fallDistance

    if (y >= CATCH_BASKET_Y) {
      if (Math.abs(gift.x - state.basketX) <= CATCH_BASKET_HALF_WIDTH) {
        caught += 1
      } else {
        missed += 1
      }
    } else {
      remaining.push({ ...gift, y })
    }
  }

  let spawnCooldownMs = state.spawnCooldownMs - stepMs
  let nextGiftId = state.nextGiftId

  if (caught < CATCH_TARGET && spawnCooldownMs <= 0) {
    remaining.push({
      id: nextGiftId,
      x: 0.06 + clampRandom(random()) * 0.88,
      y: 0,
    })
    nextGiftId += 1
    spawnCooldownMs = catchSpawnInterval(caught)
  }

  return {
    ...state,
    gifts: remaining,
    caught,
    missed,
    elapsedMs: state.elapsedMs + stepMs,
    spawnCooldownMs,
    nextGiftId,
  }
}
