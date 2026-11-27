/**
 * Day 19 hidden-object rules.
 *
 * A workshop scene hides the six approved objects: key, sock, carrot, bell,
 * teddy and candy. Coordinates are normalized (0..1 on each axis), so the same
 * data works at every viewport size and with the visual zoom/pan controls.
 *
 * A tap outside every object is only feedback. There is no timer, penalty or
 * attempt limit. Trasto may appear in the scene as an optional decoy but is
 * never required to finish the mission.
 */

export type HiddenObjectId = 'key' | 'sock' | 'carrot' | 'bell' | 'teddy' | 'candy'

export type HiddenZone =
  | 'top-left'
  | 'top-right'
  | 'middle-left'
  | 'middle-right'
  | 'bottom-left'
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
  { id: 'key', zone: 'top-left', rect: { x: 0.07, y: 0.1, width: 0.11, height: 0.16 } },
  { id: 'sock', zone: 'top-right', rect: { x: 0.77, y: 0.13, width: 0.12, height: 0.17 } },
  { id: 'carrot', zone: 'middle-left', rect: { x: 0.14, y: 0.45, width: 0.1, height: 0.16 } },
  { id: 'bell', zone: 'middle-right', rect: { x: 0.73, y: 0.48, width: 0.1, height: 0.15 } },
  { id: 'teddy', zone: 'bottom-left', rect: { x: 0.17, y: 0.74, width: 0.13, height: 0.17 } },
  { id: 'candy', zone: 'bottom-center', rect: { x: 0.47, y: 0.79, width: 0.11, height: 0.14 } },
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
  const paddingX = 0.11
  const paddingY = 0.1
  const x = clampUnit(object.rect.x - paddingX)
  const y = clampUnit(object.rect.y - paddingY)
  const right = clampUnit(object.rect.x + object.rect.width + paddingX)
  const bottom = clampUnit(object.rect.y + object.rect.height + paddingY)

  return { x, y, width: right - x, height: bottom - y }
}
