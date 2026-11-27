/**
 * Day 6 spot-the-difference rules.
 *
 * Both workshop illustrations share the same five intended changes. A change is
 * identified by a normalized rectangle (0..1 on each axis) so the same data
 * works for either image and for any viewport. Marking is shared between both
 * pictures: finding a change in one picture marks it in the other too.
 *
 * A tap outside every change is only feedback, never a penalty. Taps are
 * unlimited and there is no timer.
 */

export type SpotDifferenceId = 'bauble' | 'gift' | 'clock' | 'hat' | 'carrot'

export type SpotZone =
  | 'top-left'
  | 'top-right'
  | 'middle-right'
  | 'bottom-left'
  | 'bottom-right'

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

/** The five approved changes from the specification. */
export const SPOT_DIFFERENCES: readonly DifferenceSpot[] = [
  { id: 'bauble', zone: 'top-left', rect: { x: 0.1, y: 0.19, width: 0.16, height: 0.22 } },
  { id: 'gift', zone: 'top-right', rect: { x: 0.71, y: 0.1, width: 0.16, height: 0.22 } },
  { id: 'clock', zone: 'middle-right', rect: { x: 0.66, y: 0.38, width: 0.18, height: 0.22 } },
  { id: 'hat', zone: 'bottom-left', rect: { x: 0.15, y: 0.53, width: 0.16, height: 0.2 } },
  { id: 'carrot', zone: 'bottom-right', rect: { x: 0.71, y: 0.63, width: 0.16, height: 0.22 } },
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
  const paddingX = 0.14
  const paddingY = 0.12
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
