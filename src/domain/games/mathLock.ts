/**
 * Day 14 maths-chest rules.
 *
 * The table shows three known values and one hidden value. The child discovers
 * the hidden star value, solves the three approved additions/subtractions and
 * finally enters the three-digit code on the chest lock. Wrong guesses are only
 * feedback: there is no timer, penalty or attempt limit.
 *
 * Approved values: tree = 5, gift = 3, reindeer = 4 and star = 2.
 * Approved operations and results: 5 + 3 - 2 = 6, 4 + 4 + 3 - 2 = 9 and
 * 5 + 3 + 2 - 5 = 5, which form the code 695.
 */

export type MathSymbol = 'tree' | 'gift' | 'reindeer' | 'star'

export type MathSign = 1 | -1

export interface MathTerm {
  readonly symbol: MathSymbol
  readonly sign: MathSign
}

export interface MathOperation {
  readonly id: string
  readonly terms: readonly MathTerm[]
}

export type MathValues = Readonly<Record<MathSymbol, number>>

export const MATH_SYMBOLS: readonly MathSymbol[] = ['tree', 'gift', 'reindeer', 'star']

export const MATH_VALUES: MathValues = {
  tree: 5,
  gift: 3,
  reindeer: 4,
  star: 2,
}

/** The only value the child must discover; never rendered before it is solved. */
export const MATH_HIDDEN_SYMBOL: MathSymbol = 'star'

export const MATH_OPERATIONS: readonly MathOperation[] = [
  {
    id: 'tree-gift-star',
    terms: [
      { symbol: 'tree', sign: 1 },
      { symbol: 'gift', sign: 1 },
      { symbol: 'star', sign: -1 },
    ],
  },
  {
    id: 'reindeer-reindeer-gift-star',
    terms: [
      { symbol: 'reindeer', sign: 1 },
      { symbol: 'reindeer', sign: 1 },
      { symbol: 'gift', sign: 1 },
      { symbol: 'star', sign: -1 },
    ],
  },
  {
    id: 'tree-gift-star-tree',
    terms: [
      { symbol: 'tree', sign: 1 },
      { symbol: 'gift', sign: 1 },
      { symbol: 'star', sign: 1 },
      { symbol: 'tree', sign: -1 },
    ],
  },
]

export const MATH_CODE = '695'
export const MATH_CODE_LENGTH = MATH_CODE.length

export function operationValue(
  operation: MathOperation,
  values: MathValues = MATH_VALUES,
): number {
  return operation.terms.reduce(
    (total, term) => total + term.sign * values[term.symbol],
    0,
  )
}

/** The approved operation results, in order: 6, 9 and 5. */
export const MATH_ANSWERS: readonly number[] = MATH_OPERATIONS.map((operation) =>
  operationValue(operation),
)

export type MathAidLevel = 0 | 1 | 2

export const MATH_AID_MESSAGES: readonly (string | null)[] = [
  null,
  'Mira la tabla del cofre: cada dibujo ya tiene su valor al lado.',
  '¿Cuánto falta a 3 para llegar a 5? Ese es el valor de la estrella.',
]

export interface MathLockState {
  /** Last correct hidden value, or null while the star is still unknown. */
  readonly hiddenValue: number | null
  readonly hiddenSolved: boolean
  /** Indexes of the operations already answered correctly. */
  readonly operationsSolved: readonly number[]
  readonly codeInput: string
  readonly unlocked: boolean
  readonly aidLevel: MathAidLevel
}

export function createMathLockState(): MathLockState {
  return {
    hiddenValue: null,
    hiddenSolved: false,
    operationsSolved: [],
    codeInput: '',
    unlocked: false,
    aidLevel: 0,
  }
}

function isOneDigit(value: number): boolean {
  return Number.isInteger(value) && value >= 0 && value <= 9
}

/**
 * Checks the hidden value. A wrong guess is ignored rather than recorded, so
 * the child can keep trying without any attempt counter.
 */
export function submitHiddenValue(
  state: MathLockState,
  value: number,
): MathLockState {
  if (state.hiddenSolved || state.unlocked || !isOneDigit(value)) {
    return state
  }

  if (value !== MATH_VALUES[MATH_HIDDEN_SYMBOL]) {
    return state
  }

  return { ...state, hiddenValue: value, hiddenSolved: true }
}

export type MathOperationResult = 'correct' | 'wrong' | 'ignored'

export interface MathOperationOutcome {
  readonly state: MathLockState
  readonly result: MathOperationResult
}

export function isMathOperationsComplete(state: MathLockState): boolean {
  return state.operationsSolved.length === MATH_OPERATIONS.length
}

export interface CurrentMathOperation {
  readonly index: number
  readonly operation: MathOperation
}

export function currentMathOperation(
  state: MathLockState,
): CurrentMathOperation | null {
  if (!state.hiddenSolved || state.unlocked || isMathOperationsComplete(state)) {
    return null
  }

  const index = MATH_OPERATIONS.findIndex(
    (_, candidate) => !state.operationsSolved.includes(candidate),
  )

  if (index === -1) {
    return null
  }

  return { index, operation: MATH_OPERATIONS[index] }
}

/** Answers one operation. A wrong answer only returns feedback. */
export function answerMathOperation(
  state: MathLockState,
  index: number,
  answer: number,
): MathOperationOutcome {
  const operation = MATH_OPERATIONS[index]

  if (
    !operation ||
    state.unlocked ||
    !state.hiddenSolved ||
    state.operationsSolved.includes(index) ||
    !Number.isInteger(answer)
  ) {
    return { state, result: 'ignored' }
  }

  if (answer !== operationValue(operation)) {
    return { state, result: 'wrong' }
  }

  return {
    state: { ...state, operationsSolved: [...state.operationsSolved, index] },
    result: 'correct',
  }
}

/** Progressive help: 0 = none, 1 = numeric substitution, 2 = star clue. */
export function requestMathAid(state: MathLockState): MathLockState {
  if (state.aidLevel >= 2) {
    return state
  }

  return { ...state, aidLevel: (state.aidLevel + 1) as MathAidLevel }
}

export function mathAidMessage(state: MathLockState): string | null {
  return state.aidLevel === 0 ? null : MATH_AID_MESSAGES[state.aidLevel] ?? null
}

export function appendMathCodeDigit(
  state: MathLockState,
  digit: string,
): MathLockState {
  if (state.unlocked || state.codeInput.length >= MATH_CODE_LENGTH) {
    return state
  }

  if (!/^[0-9]$/.test(digit)) {
    return state
  }

  return { ...state, codeInput: `${state.codeInput}${digit}` }
}

export function clearMathCode(state: MathLockState): MathLockState {
  if (state.unlocked || state.codeInput.length === 0) {
    return state
  }

  return { ...state, codeInput: '' }
}

export type MathCodeResult = 'unlocked' | 'wrong' | 'incomplete' | 'blocked'

export interface MathCodeOutcome {
  readonly state: MathLockState
  readonly result: MathCodeResult
}

/**
 * Opens the chest only after the hidden value, the three operations and the
 * exact code 695 are correct. Early or wrong attempts never reset progress.
 */
export function submitMathCode(state: MathLockState): MathCodeOutcome {
  if (state.unlocked) {
    return { state, result: 'unlocked' }
  }

  if (!state.hiddenSolved || !isMathOperationsComplete(state)) {
    return { state, result: 'blocked' }
  }

  if (state.codeInput.length < MATH_CODE_LENGTH) {
    return { state, result: 'incomplete' }
  }

  if (state.codeInput !== MATH_CODE) {
    return { state, result: 'wrong' }
  }

  return { state: { ...state, unlocked: true }, result: 'unlocked' }
}
