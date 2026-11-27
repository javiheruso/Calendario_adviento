/**
 * Day 24 final mission orchestration.
 *
 * Three crystals must be activated: intelligence, memory and magic. The
 * component walks them in order, but the rules only require all three and make
 * duplicate completion idempotent. No timer is involved.
 */

export const FINAL_CRYSTALS = ['intelligence', 'memory', 'magic'] as const

export type FinalCrystal = (typeof FINAL_CRYSTALS)[number]

export interface FinalMissionState {
  readonly completed: readonly FinalCrystal[]
}

export function createFinalMissionState(): FinalMissionState {
  return { completed: [] }
}

export function completeFinalCrystal(
  state: FinalMissionState,
  crystal: FinalCrystal,
): FinalMissionState {
  if (state.completed.includes(crystal)) {
    return state
  }

  return { ...state, completed: [...state.completed, crystal] }
}

export function completedCrystalCount(state: FinalMissionState): number {
  return state.completed.length
}

export function isFinalMissionComplete(state: FinalMissionState): boolean {
  return FINAL_CRYSTALS.every((crystal) => state.completed.includes(crystal))
}

/** First crystal in approved order that still needs to be activated. */
export function currentFinalCrystal(state: FinalMissionState): FinalCrystal | null {
  return FINAL_CRYSTALS.find((crystal) => !state.completed.includes(crystal)) ?? null
}
