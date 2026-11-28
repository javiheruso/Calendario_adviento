/**
 * Day 24 magic crystal rules.
 *
 * One secret phrase is written as a single cipher: nine symbols grouped 3-1-5
 * with visual spaces between the groups. The child fills one slot per letter,
 * verifies once and can erase letters before checking. The phrase is never
 * shown in the intro or the help; it only appears after the cipher is solved,
 * when the child is asked to pronounce it aloud.
 *
 * Pronunciation is confirmed manually: there is no microphone permission or
 * automatic voice recognition. The fixed day 22 alphabet is reused unchanged.
 */

import {
  symbolsForWord,
  type CipherSymbolId,
} from './symbolCipher'

export const FINAL_MAGIC_PHRASE = 'LUZ Y MAGIA'
export const FINAL_MAGIC_GROUPS = ['LUZ', 'Y', 'MAGIA'] as const
export const FINAL_MAGIC_GROUP_LENGTHS = FINAL_MAGIC_GROUPS.map(
  (group) => group.length,
)
/** Letters without the visual spaces: nine input slots. */
export const FINAL_MAGIC_LETTERS = FINAL_MAGIC_GROUPS.join('')
export const FINAL_MAGIC_SYMBOL_GROUPS: readonly (readonly CipherSymbolId[])[] =
  FINAL_MAGIC_GROUPS.map((group) => symbolsForWord(group))
export const FINAL_MAGIC_SYMBOLS: readonly CipherSymbolId[] =
  FINAL_MAGIC_SYMBOL_GROUPS.flat()

export interface FinalMagicState {
  readonly input: string
  readonly solved: boolean
  readonly pronunciationConfirmed: boolean
}

export function createFinalMagicState(): FinalMagicState {
  return { input: '', solved: false, pronunciationConfirmed: false }
}

function isLetter(letter: string): boolean {
  return /^[A-Z]$/.test(letter)
}

/** Appends one letter while the single nine-letter cipher has empty slots. */
export function typeMagicLetter(
  state: FinalMagicState,
  letter: string,
): FinalMagicState {
  if (state.solved || state.input.length >= FINAL_MAGIC_LETTERS.length) {
    return state
  }

  const normalized = letter.trim().toUpperCase()

  if (!isLetter(normalized)) {
    return state
  }

  return { ...state, input: `${state.input}${normalized}` }
}

export function deleteMagicLetter(state: FinalMagicState): FinalMagicState {
  if (state.solved || state.input.length === 0) {
    return state
  }

  return { ...state, input: state.input.slice(0, -1) }
}

export function clearMagicInput(state: FinalMagicState): FinalMagicState {
  if (state.solved || state.input.length === 0) {
    return state
  }

  return { ...state, input: '' }
}

export type FinalMagicResult = 'correct' | 'wrong' | 'incomplete' | 'ignored'

export interface FinalMagicOutcome {
  readonly state: FinalMagicState
  readonly result: FinalMagicResult
}

/**
 * Single verification for the whole phrase. An incomplete or wrong answer
 * leaves every letter editable; a correct answer locks the input and opens the
 * pronunciation step.
 */
export function submitMagicPhrase(state: FinalMagicState): FinalMagicOutcome {
  if (state.solved) {
    return { state, result: 'ignored' }
  }

  if (state.input.length < FINAL_MAGIC_LETTERS.length) {
    return { state, result: 'incomplete' }
  }

  if (state.input !== FINAL_MAGIC_LETTERS) {
    return { state, result: 'wrong' }
  }

  return { state: { ...state, solved: true }, result: 'correct' }
}

export function isMagicWordsComplete(state: FinalMagicState): boolean {
  return state.solved
}

/** Pronunciation is only available after the single cipher is solved. */
export function confirmMagicPronunciation(state: FinalMagicState): FinalMagicState {
  if (!state.solved || state.pronunciationConfirmed) {
    return state
  }

  return { ...state, pronunciationConfirmed: true }
}

export function isMagicComplete(state: FinalMagicState): boolean {
  return state.solved && state.pronunciationConfirmed
}
