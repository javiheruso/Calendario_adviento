/**
 * Day 6 spot-the-difference rules.
 *
 * Both final workshop illustrations (`taller_A` and `taller_B`) share the same
 * seven approved changes. A change is identified by a normalized rectangle
 * (0..1 on each axis) measured on the real artwork, so the same data works for
 * either image and for any viewport. Marking is shared between both pictures:
 * finding a change in one picture marks it in the other too.
 *
 * A tap outside every change is only feedback, never a penalty. Taps are
 * unlimited and there is no timer.
 */

export type SpotDifferenceId =
  | 'bear-hat'
  | 'elf-pompom'
  | 'scarf'
  | 'train-symbol'
  | 'rudolph-bow'
  | 'mug'
  | 'paint-pot'

export type SpotZone =
  | 'top-left'
  | 'upper-left'
  | 'middle-left'
  | 'center'
  | 'middle-right'
  | 'bottom-right'
  | 'bottom-center'

export interface NormalizedRect {
  readonly x: number
  readonly y: number
  readonly width: number
  readonly height: number
}

export interface DifferenceSpot {
  readonly id: SpotDifferenceId
  readonly zone: SpotZone
  readonly rect: NormalizedRect
}

/**
 * The seven approved changes, in reading order. Coordinates were measured on
 * `public/assets/final/06_diferencias/taller_A.webp` (768×1024) and checked
 * against `taller_B`.
 */
export const SPOT_DIFFERENCES: readonly DifferenceSpot[] = [
  // Teddy bear: bow in A, Santa hat in B.
  { id: 'bear-hat', zone: 'top-left', rect: { x: 0.02, y: 0.13, width: 0.14, height: 0.11 } },
  // Trasto's hat tip: golden bell in A, white pompom in B.
  { id: 'elf-pompom', zone: 'upper-left', rect: { x: 0.01, y: 0.38, width: 0.1, height: 0.08 } },
  // Trasto's scarf: red in A, green in B.
  { id: 'scarf', zone: 'middle-left', rect: { x: 0.08, y: 0.46, width: 0.23, height: 0.14 } },
  // Train side: star in A, snowflake in B.
  { id: 'train-symbol', zone: 'center', rect: { x: 0.62, y: 0.575, width: 0.13, height: 0.11 } },
  // Rodolfo's collar: bells in A, red bow in B.
  { id: 'rudolph-bow', zone: 'middle-right', rect: { x: 0.75, y: 0.51, width: 0.19, height: 0.11 } },
  // Mug: red with dots in A, white with holly in B.
  { id: 'mug', zone: 'bottom-right', rect: { x: 0.77, y: 0.67, width: 0.2, height: 0.13 } },
  // Middle paint pot: green in A, blue in B.
  { id: 'paint-pot', zone: 'bottom-center', rect: { x: 0.32, y: 0.805, width: 0.15, height: 0.14 } },
]

export const SPOT_DIFFERENCE_COUNT = SPOT_DIFFERENCES.length

export interface SpotDifferenceState {
  readonly found: readonly SpotDifferenceId[]
}

export type SpotMarkResult = 'found' | 'already-found' | 'miss'

export interface SpotMarkOutcome {
  readonly state: SpotDifferenceState
  readonly result: SpotMarkResult
}

export function createSpotDifferenceState(): SpotDifferenceState {
  return { found: [] }
}

export function pointInRect(rect: NormalizedRect, x: number, y: number): boolean {
  return (
    x >= rect.x &&
    x <= rect.x + rect.width &&
    y >= rect.y &&
    y <= rect.y + rect.height
  )
}

function clampUnit(value: number): number {
  return Math.min(1, Math.max(0, value))
}

/**
 * Region shown by the optional zone hint. It surrounds the change without
 * exposing the exact spot, and stays inside the image.
 */
export function spotHintRect(spot: DifferenceSpot): NormalizedRect {
  const paddingX = 0.1
  const paddingY = 0.09
  const x = clampUnit(spot.rect.x - paddingX)
  const y = clampUnit(spot.rect.y - paddingY)
  const right = clampUnit(spot.rect.x + spot.rect.width + paddingX)
  const bottom = clampUnit(spot.rect.y + spot.rect.height + paddingY)

  return { x, y, width: right - x, height: bottom - y }
}

/** Marks the change under a normalized point, if any. */
export function markSpotDifference(
  state: SpotDifferenceState,
  x: number,
  y: number,
): SpotMarkOutcome {
  const hit = SPOT_DIFFERENCES.find((spot) => pointInRect(spot.rect, x, y))

  if (!hit) {
    return { state, result: 'miss' }
  }

  if (state.found.includes(hit.id)) {
    return { state, result: 'already-found' }
  }

  return {
    state: { found: [...state.found, hit.id] },
    result: 'found',
  }
}

export function foundSpotCount(state: SpotDifferenceState): number {
  return state.found.length
}

export function isSpotDifferenceComplete(state: SpotDifferenceState): boolean {
  return foundSpotCount(state) === SPOT_DIFFERENCE_COUNT
}

/** Next change used by the zone hint, in catalog order. */
export function nextUnfoundSpot(
  state: SpotDifferenceState,
): DifferenceSpot | null {
  return (
    SPOT_DIFFERENCES.find((spot) => !state.found.includes(spot.id)) ?? null
  )
}
