/**
 * Day 15 elf-hands pyramid rules.
 *
 * Six plastic cups are stacked in a 3–2–1 pyramid while the child wears thick
 * socks or mittens. Each row is marked manually, the finished pyramid needs an
 * explicit family confirmation, and the sixty-second countdown is playful only:
 * it never blocks success and time can be extended or restarted at any moment.
 */

export const CUP_PYRAMID_ROWS = [3, 2, 1] as const
export const CUP_PYRAMID_CUPS = 6
export const CUP_PYRAMID_TIMER_SECONDS = 60
export const CUP_PYRAMID_EXTENSION_SECONDS = 30

export type CupPyramidPhase = 'building' | 'ready' | 'complete'

export interface CupPyramidState {
  /** Number of rows already placed, from the three-cup base upwards. */
  readonly placedRows: number
  readonly phase: CupPyramidPhase
}

export function createCupPyramidState(): CupPyramidState {
  return { placedRows: 0, phase: 'building' }
}

export function cupsInPyramidRow(rowIndex: number): number {
  return CUP_PYRAMID_ROWS[rowIndex] ?? 0
}

/** Index of the row the child must build next, or `null` when none is left. */
export function nextPyramidRowIndex(state: CupPyramidState): number | null {
  if (state.phase !== 'building') {
    return null
  }

  return state.placedRows < CUP_PYRAMID_ROWS.length ? state.placedRows : null
}

/**
 * Marks the next row as placed. Once every row is placed the state becomes
 * `ready`; mission success still needs the explicit `confirmCupPyramid` call.
 */
export function markPyramidRow(state: CupPyramidState): CupPyramidState {
  if (state.phase !== 'building') {
    return state
  }

  const rowIndex = nextPyramidRowIndex(state)

  if (rowIndex === null) {
    return state
  }

  const placedRows = state.placedRows + 1

  return {
    placedRows,
    phase: placedRows >= CUP_PYRAMID_ROWS.length ? 'ready' : 'building',
  }
}

/** Starts the pyramid over without any penalty while it is not yet confirmed. */
export function resetCupPyramid(state: CupPyramidState): CupPyramidState {
  if (state.phase === 'complete') {
    return state
  }

  return createCupPyramidState()
}

/** Explicit family confirmation; only possible once all three rows are placed. */
export function confirmCupPyramid(state: CupPyramidState): CupPyramidState {
  if (state.phase !== 'ready') {
    return state
  }

  return { ...state, phase: 'complete' }
}

export function isCupPyramidComplete(state: CupPyramidState): boolean {
  return state.phase === 'complete'
}
