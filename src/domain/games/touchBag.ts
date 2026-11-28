/**
 * Day 20 mystery-bag rules.
 *
 * An adult puts three safe objects inside an opaque bag. The child identifies
 * them by touch only, without looking and without a camera. The family marks
 * each correct identification manually; three marks complete the mission, and
 * a mark can be undone before confirmation.
 */

export const TOUCH_BAG_HITS = 3

export const TOUCH_BAG_SLOT_IDS = ['first', 'second', 'third'] as const

export type TouchBagSlotId = (typeof TOUCH_BAG_SLOT_IDS)[number]

/**
 * The child surface never lists example objects: the family chooses the three
 * objects privately. Keeping the domain free of examples prevents that content
 * from leaking back into the mission view.
 */
export interface TouchBagState {
  readonly marked: Readonly<Record<TouchBagSlotId, boolean>>
}

function emptyMarks(): Record<TouchBagSlotId, boolean> {
  return { first: false, second: false, third: false }
}

export function createTouchBagState(): TouchBagState {
  return { marked: emptyMarks() }
}

export function isTouchBagSlotId(value: string): value is TouchBagSlotId {
  return (TOUCH_BAG_SLOT_IDS as readonly string[]).includes(value)
}

/** Manual marker for one identified object; the family can undo it. */
export function toggleTouchBagHit(
  state: TouchBagState,
  slotId: TouchBagSlotId,
): TouchBagState {
  if (!isTouchBagSlotId(slotId)) {
    return state
  }

  return {
    marked: { ...state.marked, [slotId]: !state.marked[slotId] },
  }
}

export function markedTouchBagHits(state: TouchBagState): number {
  return TOUCH_BAG_SLOT_IDS.filter((slotId) => state.marked[slotId]).length
}

export function isTouchBagComplete(state: TouchBagState): boolean {
  return TOUCH_BAG_SLOT_IDS.every((slotId) => state.marked[slotId])
}
