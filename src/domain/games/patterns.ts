/**
 * Day 10 ornament-pattern rules.
 *
 * The five approved sequences are progressive: ABABA, ABCAB, AABAA, ABBAB and
 * ABCABCA. Each challenge asks which symbol comes next. A wrong answer is only
 * feedback; the child can retry as many times as needed.
 */

export type PatternToken = 'A' | 'B' | 'C'

export interface PatternChallenge {
  readonly id: string
  readonly sequence: readonly PatternToken[]
  readonly answer: PatternToken
}

export const PATTERN_CHALLENGES: readonly PatternChallenge[] = [
  { id: 'ababa', sequence: ['A', 'B', 'A', 'B', 'A'], answer: 'B' },
  { id: 'abcab', sequence: ['A', 'B', 'C', 'A', 'B'], answer: 'C' },
  { id: 'aabaa', sequence: ['A', 'A', 'B', 'A', 'A'], answer: 'B' },
  { id: 'abbab', sequence: ['A', 'B', 'B', 'A', 'B'], answer: 'B' },
  { id: 'abcabca', sequence: ['A', 'B', 'C', 'A', 'B', 'C', 'A'], answer: 'B' },
]

export const PATTERN_COUNT = PATTERN_CHALLENGES.length

export type PatternResult = 'correct' | 'wrong' | 'ignored'

export interface PatternState {
  readonly solved: number
  readonly attempts: number
  readonly lastResult: 'none' | 'correct' | 'wrong'
}

export interface PatternOutcome {
  readonly state: PatternState
  readonly result: PatternResult
}

export function createPatternState(): PatternState {
  return { solved: 0, attempts: 0, lastResult: 'none' }
}

export function currentPattern(state: PatternState): PatternChallenge | null {
  return PATTERN_CHALLENGES[state.solved] ?? null
}

export function isPatternGameComplete(state: PatternState): boolean {
  return state.solved >= PATTERN_COUNT
}

/**
 * Options shown for a challenge: only the symbols that appear in it plus the
 * answer, so a symbol that is not part of the pattern never becomes a distractor.
 */
export function patternOptions(challenge: PatternChallenge): PatternToken[] {
  const tokens = new Set<PatternToken>([...challenge.sequence, challenge.answer])
  const order: readonly PatternToken[] = ['A', 'B', 'C']
  return order.filter((token) => tokens.has(token))
}

export function submitPatternChoice(
  state: PatternState,
  challenge: PatternChallenge,
  choice: PatternToken,
): PatternOutcome {
  if (isPatternGameComplete(state) || state.lastResult === 'correct') {
    return { state, result: 'ignored' }
  }

  if (choice !== challenge.answer) {
    return {
      state: { ...state, attempts: state.attempts + 1, lastResult: 'wrong' },
      result: 'wrong',
    }
  }

  return {
    state: { ...state, solved: state.solved + 1, lastResult: 'correct' },
    result: 'correct',
  }
}

/** Clears a successful result so the child can move to the next pattern. */
export function acknowledgePatternResult(state: PatternState): PatternState {
  if (state.lastResult !== 'correct' || isPatternGameComplete(state)) {
    return state
  }

  return { ...state, lastResult: 'none' }
}
