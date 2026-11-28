/**
 * Day 24 magic crystal rules.
 *
 * The child deciphers LUZ, Y and MAGIA with the fixed day 22 alphabet, then
 * pronounces the phrase aloud. Pronunciation is confirmed manually: there is
 * no microphone permission or automatic voice recognition.
 */

import {
  advanceCipherRound,
  clearCipherInput,
  createCipherGame,
  createCipherState,
  currentCipherRound,
  deleteCipherLetter,
  isCipherComplete,
  submitCipherWord,
  typeCipherLetter,
  type CipherGame,
  type CipherResult,
  type CipherRound,
  type SymbolCipherState,
} from './symbolCipher'

export const FINAL_MAGIC_PHRASE = 'LUZ Y MAGIA'
export const FINAL_MAGIC_WORDS = ['LUZ', 'Y', 'MAGIA'] as const

/** The approved day 22 alphabet is reused unchanged. */
const FINAL_MAGIC_GAME: CipherGame = createCipherGame(FINAL_MAGIC_WORDS)

export interface FinalMagicState {
  readonly cipher: SymbolCipherState
  readonly pronunciationConfirmed: boolean
}

export function createFinalMagicState(): FinalMagicState {
  return {
    cipher: createCipherState(FINAL_MAGIC_GAME),
    pronunciationConfirmed: false,
  }
}

export function currentMagicRound(state: FinalMagicState): CipherRound | null {
  return currentCipherRound(FINAL_MAGIC_GAME, state.cipher)
}

export function typeMagicLetter(
  state: FinalMagicState,
  letter: string,
): FinalMagicState {
  const cipher = typeCipherLetter(state.cipher, FINAL_MAGIC_GAME, letter)

  return cipher === state.cipher ? state : { ...state, cipher }
}

export function deleteMagicLetter(state: FinalMagicState): FinalMagicState {
  const cipher = deleteCipherLetter(state.cipher)

  return cipher === state.cipher ? state : { ...state, cipher }
}

export function clearMagicInput(state: FinalMagicState): FinalMagicState {
  const cipher = clearCipherInput(state.cipher)

  return cipher === state.cipher ? state : { ...state, cipher }
}

export interface MagicWordOutcome {
  readonly state: FinalMagicState
  readonly result: CipherResult
}

export function submitMagicWord(state: FinalMagicState): MagicWordOutcome {
  const outcome = submitCipherWord(FINAL_MAGIC_GAME, state.cipher)

  return {
    state:
      outcome.state === state.cipher ? state : { ...state, cipher: outcome.state },
    result: outcome.result,
  }
}

export function advanceMagicWord(state: FinalMagicState): FinalMagicState {
  const cipher = advanceCipherRound(FINAL_MAGIC_GAME, state.cipher)

  return cipher === state.cipher ? state : { ...state, cipher }
}

export function isMagicWordsComplete(state: FinalMagicState): boolean {
  return isCipherComplete(state.cipher)
}

/** Pronunciation is only available after both words are deciphered. */
export function confirmMagicPronunciation(state: FinalMagicState): FinalMagicState {
  if (!isMagicWordsComplete(state) || state.pronunciationConfirmed) {
    return state
  }

  return { ...state, pronunciationConfirmed: true }
}

export function isMagicComplete(state: FinalMagicState): boolean {
  return isMagicWordsComplete(state) && state.pronunciationConfirmed
}

/** Exposed for tests and for the reference table in the UI. */
export function magicGame(): CipherGame {
  return FINAL_MAGIC_GAME
}
