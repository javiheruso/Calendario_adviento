/**
 * Day 3 red-invasion checklist.
 *
 * The child finds two red garments and one red object, wears the garments and
 * poses with the object. There is no automatic validation: the family marks
 * each item and confirms the checklist manually. Nothing here can fail.
 */

export const RED_OUTFIT_ITEM_IDS = [
  'red-garment-one',
  'red-garment-two',
  'red-object',
] as const

export type RedOutfitItemId = (typeof RED_OUTFIT_ITEM_IDS)[number]

export type RedOutfitChecklist = Readonly<Record<RedOutfitItemId, boolean>>

export interface RedOutfitState {
  readonly checked: RedOutfitChecklist
}

function emptyChecklist(): Record<RedOutfitItemId, boolean> {
  return {
    'red-garment-one': false,
    'red-garment-two': false,
    'red-object': false,
  }
}

export function createRedOutfitState(): RedOutfitState {
  return { checked: emptyChecklist() }
}

export function isRedOutfitItemId(value: string): value is RedOutfitItemId {
  return (RED_OUTFIT_ITEM_IDS as readonly string[]).includes(value)
}

export function toggleRedOutfitItem(
  state: RedOutfitState,
  itemId: RedOutfitItemId,
): RedOutfitState {
  if (!isRedOutfitItemId(itemId)) {
    return state
  }

  return {
    checked: { ...state.checked, [itemId]: !state.checked[itemId] },
  }
}

export function checkedRedOutfitItems(state: RedOutfitState): number {
  return RED_OUTFIT_ITEM_IDS.filter((itemId) => state.checked[itemId]).length
}

export function isRedOutfitComplete(state: RedOutfitState): boolean {
  return RED_OUTFIT_ITEM_IDS.every((itemId) => state.checked[itemId])
}
