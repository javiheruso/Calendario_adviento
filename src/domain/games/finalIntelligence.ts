/**
 * Day 24 intelligence crystal rules.
 *
 * Approved values: Papá Noel = 6, trineo = 4, regalo = 2 and reindeer = 4.
 * The child discovers the hidden reindeer value and then enters the two-digit
 * code formed by the approved operation results: 6 and 4 → 64.
 *
 * Wrong values and codes are feedback only. There is no timer, penalty or
 * attempt limit.
 */

export type FinalIntelSymbol = 'santa' | 'sleigh' | 'gift' | 'reindeer'

export type FinalIntelSign = 1 | -1

export interface FinalIntelTerm {
  readonly symbol: FinalIntelSymbol
  readonly sign: FinalIntelSign
}

export interface FinalIntelOperation {
  readonly id: string
  readonly terms: readonly FinalIntelTerm[]
}

export type FinalIntelValues = Readonly<Record<FinalIntelSymbol, number>>

export const FINAL_INTEL_SYMBOLS: readonly FinalIntelSymbol[] = [
  'santa',
  'sleigh',
  'gift',
  'reindeer',
]

export const FINAL_INTEL_VALUES: FinalIntelValues = {
  santa: 6,
  sleigh: 4,
  gift: 2,
  reindeer: 4,
}

/** The only value the child must discover; never rendered before it is solved. */
export const FINAL_INTEL_HIDDEN_SYMBOL: FinalIntelSymbol = 'reindeer'

export const FINAL_INTEL_OPERATIONS: readonly FinalIntelOperation[] = [
  {
    id: 'reindeer-sleigh-gift',
    terms: [
      { symbol: 'reindeer', sign: 1 },
      { symbol: 'sleigh', sign: 1 },
      { symbol: 'gift', sign: -1 },
    ],
  },
  {
    id: 'santa-gift-reindeer',
    terms: [
      { symbol: 'santa', sign: 1 },
      { symbol: 'gift', sign: 1 },
      { symbol: 'reindeer', sign: -1 },
    ],
  },
]

export const FINAL_INTEL_CODE = '64'
export const FINAL_INTEL_CODE_LENGTH = FINAL_INTEL_CODE.length

export function finalIntelOperationValue(
  operation: FinalIntelOperation,
  values: FinalIntelValues = FINAL_INTEL_VALUES,
): number {
  return operation.terms.reduce(
    (total, term) => total + term.sign * values[term.symbol],
    0,
  )
}

/** The approved operation results, in order: 6 and 4. */
export const FINAL_INTEL_ANSWERS: readonly number[] = FINAL_INTEL_OPERATIONS.map(
  (operation) => finalIntelOperationValue(operation),
)

export interface FinalIntelState {
  readonly hiddenSolved: boolean
  readonly codeInput: string
  readonly complete: boolean
}

export function createFinalIntelState(): FinalIntelState {
  return {
    hiddenSolved: false,
    codeInput: '',
    complete: false,
  }
}

function isOneDigit(value: number): boolean {
  return Number.isInteger(value) && value >= 0 && value <= 9
}

/**
 * Checks the hidden reindeer value. A wrong guess is ignored rather than
 * recorded, so the child can keep trying without any attempt counter.
 */
export function submitFinalIntelHiddenValue(
  state: FinalIntelState,
  value: number,
): FinalIntelState {
  if (state.hiddenSolved || state.complete || !isOneDigit(value)) {
    return state
  }

  if (value !== FINAL_INTEL_VALUES[FINAL_INTEL_HIDDEN_SYMBOL]) {
    return state
  }

  return { ...state, hiddenSolved: true }
}

export function appendFinalIntelCodeDigit(
  state: FinalIntelState,
  digit: string,
): FinalIntelState {
  if (
    state.complete ||
    !state.hiddenSolved ||
    state.codeInput.length >= FINAL_INTEL_CODE_LENGTH ||
    !/^[0-9]$/.test(digit)
  ) {
    return state
  }

  return { ...state, codeInput: `${state.codeInput}${digit}` }
}

export function clearFinalIntelCode(state: FinalIntelState): FinalIntelState {
  if (state.complete || state.codeInput.length === 0) {
    return state
  }

  return { ...state, codeInput: '' }
}

export type FinalIntelCodeResult = 'unlocked' | 'wrong' | 'incomplete' | 'blocked'

export interface FinalIntelCodeOutcome {
  readonly state: FinalIntelState
  readonly result: FinalIntelCodeResult
}

/**
 * Opens the intelligence crystal only after the hidden value and the exact
 * code 64. Early or wrong attempts never reset progress.
 */
export function submitFinalIntelCode(
  state: FinalIntelState,
): FinalIntelCodeOutcome {
  if (state.complete) {
    return { state, result: 'unlocked' }
  }

  if (!state.hiddenSolved) {
    return { state, result: 'blocked' }
  }

  if (state.codeInput.length < FINAL_INTEL_CODE_LENGTH) {
    return { state, result: 'incomplete' }
  }

  if (state.codeInput !== FINAL_INTEL_CODE) {
    return { state, result: 'wrong' }
  }

  return { state: { ...state, complete: true }, result: 'unlocked' }
}

export function isFinalIntelComplete(state: FinalIntelState): boolean {
  return state.complete
}
