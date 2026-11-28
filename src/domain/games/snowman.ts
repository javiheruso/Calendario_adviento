/**
 * Day 21 absent-minded-snowman rules.
 *
 * The final artwork fixes one model: a top hat, a carrot nose, a red scarf and
 * coal buttons. Copito is shown wearing it for fifteen seconds; afterwards the
 * child rebuilds it one phase at a time, choosing from three complete options
 * per phase. Only the five complete phase images (`00_base`…`04_botones`) are
 * displayed, never an overlay or an arbitrary combination. A wrong choice is
 * only kind feedback with unlimited retries.
 */

export type SnowmanCategory = 'hat' | 'nose' | 'scarf' | 'buttons'

export const SNOWMAN_CATEGORIES: readonly SnowmanCategory[] = [
  'hat',
  'nose',
  'scarf',
  'buttons',
]

export const SNOWMAN_VARIANTS_PER_CATEGORY = 3
export const SNOWMAN_OBSERVE_SECONDS = 15
export const SNOWMAN_OBSERVE_MS = SNOWMAN_OBSERVE_SECONDS * 1000

export interface SnowmanOption {
  readonly id: string
  readonly label: string
}

export interface SnowmanPhaseDefinition {
  readonly category: SnowmanCategory
  readonly title: string
  readonly correctOptionId: string
  readonly options: readonly SnowmanOption[]
}

/** The approved fixed model, in consecutive order. */
export const SNOWMAN_FIXED_TARGET: Readonly<Record<SnowmanCategory, string>> = {
  hat: 'top',
  nose: 'carrot',
  scarf: 'red',
  buttons: 'coal',
}

export const SNOWMAN_PHASES: readonly SnowmanPhaseDefinition[] = [
  {
    category: 'hat',
    title: 'El sombrero',
    correctOptionId: 'top',
    options: [
      { id: 'santa', label: 'Gorro de Papá Noel' },
      { id: 'green', label: 'Gorro verde' },
      { id: 'top', label: 'Sombrero de copa' },
    ],
  },
  {
    category: 'nose',
    title: 'La nariz',
    correctOptionId: 'carrot',
    options: [
      { id: 'carrot', label: 'Nariz de zanahoria' },
      { id: 'button', label: 'Nariz de botón' },
      { id: 'pompon', label: 'Nariz de pompón' },
    ],
  },
  {
    category: 'scarf',
    title: 'La bufanda',
    correctOptionId: 'red',
    options: [
      { id: 'blue', label: 'Bufanda azul' },
      { id: 'red', label: 'Bufanda roja' },
      { id: 'green', label: 'Bufanda verde' },
    ],
  },
  {
    category: 'buttons',
    title: 'Los botones',
    correctOptionId: 'coal',
    options: [
      { id: 'colors', label: 'Botones de colores' },
      { id: 'gold', label: 'Botones dorados' },
      { id: 'coal', label: 'Botones de carbón' },
    ],
  },
]

export const SNOWMAN_PHASE_COUNT = SNOWMAN_PHASES.length

export type SnowmanStage = 'observing' | 'building' | 'complete'

export type SnowmanResult = 'none' | 'correct' | 'wrong'

export interface SnowmanState {
  readonly stage: SnowmanStage
  /** Number of phases already solved; 0..SNOWMAN_PHASE_COUNT. */
  readonly step: number
  readonly lastResult: SnowmanResult
  /** Wrong attempts only, for kind feedback; never blocks progress. */
  readonly attempts: number
}

export function createSnowmanState(): SnowmanState {
  return { stage: 'observing', step: 0, lastResult: 'none', attempts: 0 }
}

/** Called when the fifteen-second observation ends. */
export function startSnowmanBuilding(state: SnowmanState): SnowmanState {
  if (state.stage !== 'observing') {
    return state
  }

  return { ...state, stage: 'building' }
}

export function currentSnowmanPhase(
  state: SnowmanState,
): SnowmanPhaseDefinition | null {
  if (state.stage !== 'building') {
    return null
  }

  return SNOWMAN_PHASES[state.step] ?? null
}

export function completedSnowmanPhases(state: SnowmanState): number {
  return state.stage === 'complete' ? SNOWMAN_PHASE_COUNT : state.step
}

export function isSnowmanComplete(state: SnowmanState): boolean {
  return state.stage === 'complete'
}

/**
 * Applies one option for the current phase. A correct answer advances to the
 * next complete phase; a wrong answer is recorded as feedback only and the
 * same phase stays open for another try.
 */
export function chooseSnowmanOption(
  state: SnowmanState,
  optionId: string,
): SnowmanState {
  if (state.stage !== 'building') {
    return state
  }

  const phase = SNOWMAN_PHASES[state.step]

  if (!phase || !phase.options.some((option) => option.id === optionId)) {
    return state
  }

  if (optionId !== phase.correctOptionId) {
    return { ...state, lastResult: 'wrong', attempts: state.attempts + 1 }
  }

  const nextStep = state.step + 1

  if (nextStep >= SNOWMAN_PHASE_COUNT) {
    return { ...state, stage: 'complete', step: SNOWMAN_PHASE_COUNT, lastResult: 'correct' }
  }

  return { ...state, step: nextStep, lastResult: 'correct' }
}
