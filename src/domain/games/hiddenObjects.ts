/**
 * Day 19 hidden-object rules.
 *
 * The final workshop scene hides the six approved objects: gift (centre),
 * bell (left shelf), candy cane (behind the green cup), Santa hat (top), blue
 * bauble (top right) and star (above the staircase). Coordinates are
 * normalized (0..1 on each axis) measured on
 * `public/assets/final/19_taller_desordenado/escena_objetos.webp` (1672×941),
 * so the same data works at every viewport size and with the visual zoom/pan
 * controls.
 *
 * A tap outside every object is only feedback. There is no timer, penalty or
 * attempt limit.
 */

export type HiddenObjectId =
  | 'gift'
  | 'bell'
  | 'candyCane'
  | 'santaHat'
  | 'blueBauble'
  | 'star'

export type HiddenZone =
  | 'top-center'
  | 'top-staircase'
  | 'top-right'
  | 'middle-left'
  | 'middle-right'
  | 'bottom-center'

export interface NormalizedRect {
  readonly x: number
  readonly y: number
  readonly width: number
  readonly height: number
}

export interface HiddenObject {
  readonly id: HiddenObjectId
  readonly zone: HiddenZone
  readonly rect: NormalizedRect
}

/** The six approved objects, each in a different part of the workshop. */
export const HIDDEN_OBJECTS: readonly HiddenObject[] = [
  // Santa hat on the top shelf.
  { id: 'santaHat', zone: 'top-center', rect: { x: 0.36, y: 0.05, width: 0.19, height: 0.17 } },
  // Golden star above the staircase.
  { id: 'star', zone: 'top-staircase', rect: { x: 0.71, y: 0.02, width: 0.1, height: 0.12 } },
  // Blue bauble in the top-right corner.
  { id: 'blueBauble', zone: 'top-right', rect: { x: 0.915, y: 0.15, width: 0.08, height: 0.13 } },
  // Bell with the red bow on the left shelf.
  { id: 'bell', zone: 'middle-left', rect: { x: 0.35, y: 0.28, width: 0.09, height: 0.11 } },
  // Candy cane behind the green cup.
  { id: 'candyCane', zone: 'middle-right', rect: { x: 0.575, y: 0.25, width: 0.08, height: 0.13 } },
  // Central wrapped gift.
  { id: 'gift', zone: 'bottom-center', rect: { x: 0.47, y: 0.55, width: 0.14, height: 0.2 } },
]

export const HIDDEN_OBJECT_COUNT = HIDDEN_OBJECTS.length

export interface HiddenObjectsState {
  readonly found: readonly HiddenObjectId[]
}

export type HiddenObjectResult = 'found' | 'already-found' | 'miss'

export interface HiddenObjectOutcome {
  readonly state: HiddenObjectsState
  readonly result: HiddenObjectResult
}

export function createHiddenObjectsState(): HiddenObjectsState {
  return { found: [] }
}

export function pointInHiddenRect(
  rect: NormalizedRect,
  x: number,
  y: number,
): boolean {
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

/** Marks one known object. Repeating a found object is harmless. */
export function markHiddenObject(
  state: HiddenObjectsState,
  id: HiddenObjectId,
): HiddenObjectOutcome {
  const object = HIDDEN_OBJECTS.find((candidate) => candidate.id === id)

  if (!object) {
    return { state, result: 'miss' }
  }

  if (state.found.includes(id)) {
    return { state, result: 'already-found' }
  }

  return { state: { found: [...state.found, id] }, result: 'found' }
}

/** Finds the object under a normalized point, if any. */
export function findHiddenObjectAt(
  state: HiddenObjectsState,
  x: number,
  y: number,
): HiddenObjectOutcome {
  const object = HIDDEN_OBJECTS.find((candidate) =>
    pointInHiddenRect(candidate.rect, x, y),
  )

  if (!object) {
    return { state, result: 'miss' }
  }

  return markHiddenObject(state, object.id)
}

export function foundHiddenObjectCount(state: HiddenObjectsState): number {
  return state.found.length
}

export function isHiddenObjectsComplete(state: HiddenObjectsState): boolean {
  return foundHiddenObjectCount(state) === HIDDEN_OBJECT_COUNT
}

/** Next object used by the zone help, in catalog order. */
export function nextUnfoundHiddenObject(
  state: HiddenObjectsState,
): HiddenObject | null {
  return HIDDEN_OBJECTS.find((object) => !state.found.includes(object.id)) ?? null
}

/**
 * Padded region shown by the zone help. It points at an area without drawing
 * the exact object outline, and always stays inside the scene.
 */
export function hiddenObjectHintRect(object: HiddenObject): NormalizedRect {
  const paddingX = 0.08
  const paddingY = 0.07
  const x = clampUnit(object.rect.x - paddingX)
  const y = clampUnit(object.rect.y - paddingY)
  const right = clampUnit(object.rect.x + object.rect.width + paddingX)
  const bottom = clampUnit(object.rect.y + object.rect.height + paddingY)

  return { x, y, width: right - x, height: bottom - y }
}
