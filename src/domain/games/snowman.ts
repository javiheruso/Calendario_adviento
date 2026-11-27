/**
 * Day 21 absent-minded-snowman rules.
 *
 * Copito wears a hat, a scarf, a nose and buttons. Each category has exactly
 * three variants; the target combination is random. The child observes it for
 * fifteen seconds, then rebuilds it from the options. The model can be
 * consulted at any time after the observation, and a wrong attempt is only
 * feedback with unlimited retries.
 */

export type SnowmanCategory = 'hat' | 'scarf' | 'nose' | 'buttons'

export const SNOWMAN_CATEGORIES: readonly SnowmanCategory[] = [
  'hat',
  'scarf',
  'nose',
  'buttons',
]

export const SNOWMAN_VARIANTS_PER_CATEGORY = 3
export const SNOWMAN_OBSERVE_SECONDS = 15
export const SNOWMAN_OBSERVE_MS = SNOWMAN_OBSERVE_SECONDS * 1000

export interface SnowmanCombination {
  readonly hat: number
  readonly scarf: number
  readonly nose: number
  readonly buttons: number
}

export type SnowmanPhase = 'observing' | 'building' | 'complete'

export interface SnowmanState {
  readonly target: SnowmanCombination
  readonly selection: Readonly<Record<SnowmanCategory, number | null>>
  readonly phase: SnowmanPhase
}

function pickVariant(random: () => number): number {
  const value = Math.min(0.999, Math.max(0, random()))
  return Math.min(
    SNOWMAN_VARIANTS_PER_CATEGORY - 1,
    Math.floor(value * SNOWMAN_VARIANTS_PER_CATEGORY),
  )
}

export function createSnowmanTarget(
  random: () => number = Math.random,
): SnowmanCombination {
  return {
    hat: pickVariant(random),
    scarf: pickVariant(random),
    nose: pickVariant(random),
    buttons: pickVariant(random),
  }
}

function emptySelection(): Record<SnowmanCategory, number | null> {
  return { hat: null, scarf: null, nose: null, buttons: null }
}

export function createSnowmanState(
  random: () => number = Math.random,
): SnowmanState {
  return {
    target: createSnowmanTarget(random),
    selection: emptySelection(),
    phase: 'observing',
  }
}

/** Called when the fifteen-second observation ends. */
export function startSnowmanBuilding(state: SnowmanState): SnowmanState {
  if (state.phase !== 'observing') {
    return state
  }

  return { ...state, phase: 'building' }
}

function isCategory(value: string): value is SnowmanCategory {
  return (SNOWMAN_CATEGORIES as readonly string[]).includes(value)
}

export function isSnowmanVariant(value: number): boolean {
  return (
    Number.isInteger(value) &&
    value >= 0 &&
    value < SNOWMAN_VARIANTS_PER_CATEGORY
  )
}

/**
 * Stores one accessory choice. Selecting the full correct combination
 * completes the mission; a wrong full attempt stays editable.
 */
export function selectSnowmanVariant(
  state: SnowmanState,
  category: SnowmanCategory,
  variant: number,
): SnowmanState {
  if (state.phase !== 'building' || !isCategory(category) || !isSnowmanVariant(variant)) {
    return state
  }

  const selection = { ...state.selection, [category]: variant }

  if (
    SNOWMAN_CATEGORIES.every(
      (candidate) => selection[candidate] === state.target[candidate],
    )
  ) {
    return { ...state, selection, phase: 'complete' }
  }

  return { ...state, selection }
}

export function clearSnowmanSelection(state: SnowmanState): SnowmanState {
  if (state.phase === 'complete') {
    return state
  }

  return { ...state, selection: emptySelection() }
}

export function selectedSnowmanCategories(state: SnowmanState): number {
  return SNOWMAN_CATEGORIES.filter(
    (category) => state.selection[category] !== null,
  ).length
}

export function matchingSnowmanCategories(state: SnowmanState): number {
  return SNOWMAN_CATEGORIES.filter(
    (category) => state.selection[category] === state.target[category],
  ).length
}

export function isSnowmanSelectionComplete(state: SnowmanState): boolean {
  return selectedSnowmanCategories(state) === SNOWMAN_CATEGORIES.length
}

export function isSnowmanComplete(state: SnowmanState): boolean {
  return state.phase === 'complete'
}
