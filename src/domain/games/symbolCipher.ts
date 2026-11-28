/**
 * Day 22 secret elf language rules.
 *
 * The approved alphabet has exactly fourteen symbols. The same associations are
 * reused on day 24, so this module is the single source of truth for the table.
 *
 * Approved symbols in specification order:
 * tree=A, bell=E, gift=I, snowman=O, reindeer=U, star=M, mitten=G, sleigh=L,
 * snowflake=N, candy=S, candle=T, sock=R, sparkle=Z and mistletoe=Y.
 *
 * The child deciphers LUNA, TRINEO and ESTRELLA with the built-in keyboard. The
 * intro and help never list the answers. A wrong answer is only feedback: no
 * timer, penalty or attempt limit.
 */

export type CipherSymbolId =
  | 'tree'
  | 'bell'
  | 'gift'
  | 'snowman'
  | 'reindeer'
  | 'star'
  | 'mitten'
  | 'sleigh'
  | 'snowflake'
  | 'candy'
  | 'candle'
  | 'sock'
  | 'sparkle'
  | 'mistletoe'

export interface CipherSymbol {
  readonly id: CipherSymbolId
  readonly letter: string
}

/**
 * Spanish names used as accessible text for the visual symbols. The same table
 * serves day 22 and day 24, so a screen-reader user gets the same associations
 * as a sighted user without exposing the answer letter in the secret word.
 */
export const CIPHER_SYMBOL_NAMES: Readonly<Record<CipherSymbolId, string>> = {
  tree: 'Árbol',
  bell: 'Campana',
  gift: 'Regalo',
  snowman: 'Muñeco de nieve',
  reindeer: 'Reno',
  star: 'Estrella',
  mitten: 'Manopla',
  sleigh: 'Trineo',
  snowflake: 'Copo de nieve',
  candy: 'Caramelo',
  candle: 'Vela',
  sock: 'Calcetín',
  sparkle: 'Destello',
  mistletoe: 'Muérdago',
}

export const CIPHER_ALPHABET: readonly CipherSymbol[] = [
  { id: 'tree', letter: 'A' },
  { id: 'bell', letter: 'E' },
  { id: 'gift', letter: 'I' },
  { id: 'snowman', letter: 'O' },
  { id: 'reindeer', letter: 'U' },
  { id: 'star', letter: 'M' },
  { id: 'mitten', letter: 'G' },
  { id: 'sleigh', letter: 'L' },
  { id: 'snowflake', letter: 'N' },
  { id: 'candy', letter: 'S' },
  { id: 'candle', letter: 'T' },
  { id: 'sock', letter: 'R' },
  { id: 'sparkle', letter: 'Z' },
  { id: 'mistletoe', letter: 'Y' },
]

export const CIPHER_SYMBOL_COUNT = CIPHER_ALPHABET.length
export const CIPHER_WORDS = ['LUNA', 'TRINEO', 'ESTRELLA'] as const

const LETTER_BY_SYMBOL = new Map<CipherSymbolId, string>(
  CIPHER_ALPHABET.map((symbol) => [symbol.id, symbol.letter]),
)

const SYMBOL_BY_LETTER = new Map<string, CipherSymbolId>(
  CIPHER_ALPHABET.map((symbol) => [symbol.letter, symbol.id]),
)

export function letterForCipherSymbol(id: CipherSymbolId): string {
  return LETTER_BY_SYMBOL.get(id) ?? ''
}

/** Accessible Spanish name for a visual symbol. */
export function cipherSymbolName(id: CipherSymbolId): string {
  return CIPHER_SYMBOL_NAMES[id]
}

/**
 * Full reference description, for example "Árbol: letra A". Used only in the
 * visible alphabet table, never next to the symbols of the secret word.
 */
export function describeCipherSymbol(id: CipherSymbolId): string {
  return `${cipherSymbolName(id)}: letra ${letterForCipherSymbol(id)}`
}

export function cipherSymbolForLetter(letter: string): CipherSymbolId | null {
  return SYMBOL_BY_LETTER.get(letter.trim().toUpperCase()) ?? null
}

/** Maps every letter of a word to its approved symbol, in order. */
export function symbolsForWord(word: string): readonly CipherSymbolId[] {
  const normalized = word.trim().toUpperCase()

  return normalized.split('').map((letter) => {
    const symbol = cipherSymbolForLetter(letter)

    if (!symbol) {
      throw new Error(`Letter ${letter} is not part of the approved elf alphabet`)
    }

    return symbol
  })
}

export interface CipherRound {
  readonly word: string
  readonly symbols: readonly CipherSymbolId[]
}

export interface CipherGame {
  readonly rounds: readonly CipherRound[]
}

export function createCipherGame(
  words: readonly string[] = CIPHER_WORDS,
): CipherGame {
  return {
    rounds: words.map((word) => {
      const normalized = word.trim().toUpperCase()
      return { word: normalized, symbols: symbolsForWord(normalized) }
    }),
  }
}

export type CipherFeedback = 'none' | 'correct' | 'wrong'

export interface SymbolCipherState {
  readonly roundIndex: number
  readonly input: string
  readonly solvedRounds: number
  readonly lastResult: CipherFeedback
  readonly complete: boolean
}

export function createCipherState(game: CipherGame): SymbolCipherState {
  return {
    roundIndex: 0,
    input: '',
    solvedRounds: 0,
    lastResult: 'none',
    complete: game.rounds.length === 0,
  }
}

export function currentCipherRound(
  game: CipherGame,
  state: SymbolCipherState,
): CipherRound | null {
  return game.rounds[state.roundIndex] ?? null
}

function isLetter(letter: string): boolean {
  return /^[A-Z]$/.test(letter)
}

/** Appends one letter while the current round still has empty slots. */
export function typeCipherLetter(
  state: SymbolCipherState,
  game: CipherGame,
  letter: string,
): SymbolCipherState {
  const round = currentCipherRound(game, state)

  if (!round || state.complete || state.lastResult === 'correct') {
    return state
  }

  const normalized = letter.trim().toUpperCase()

  if (!isLetter(normalized) || state.input.length >= round.word.length) {
    return state
  }

  return {
    ...state,
    input: `${state.input}${normalized}`,
    lastResult: 'none',
  }
}

export function deleteCipherLetter(state: SymbolCipherState): SymbolCipherState {
  if (state.complete || state.lastResult === 'correct' || state.input.length === 0) {
    return state
  }

  return { ...state, input: state.input.slice(0, -1), lastResult: 'none' }
}

export function clearCipherInput(state: SymbolCipherState): SymbolCipherState {
  if (state.complete || state.lastResult === 'correct' || state.input.length === 0) {
    return state
  }

  return { ...state, input: '', lastResult: 'none' }
}

export type CipherResult = 'correct' | 'wrong' | 'incomplete' | 'ignored'

export interface CipherOutcome {
  readonly state: SymbolCipherState
  readonly result: CipherResult
}

/**
 * Checks the current word. A correct answer unlocks the "next word" step; a
 * wrong or incomplete answer leaves the input editable.
 */
export function submitCipherWord(
  game: CipherGame,
  state: SymbolCipherState,
): CipherOutcome {
  const round = currentCipherRound(game, state)

  if (!round || state.complete || state.lastResult === 'correct') {
    return { state, result: 'ignored' }
  }

  if (state.input.length < round.word.length) {
    return { state, result: 'incomplete' }
  }

  if (state.input !== round.word) {
    return {
      state: { ...state, lastResult: 'wrong' },
      result: 'wrong',
    }
  }

  return {
    state: {
      ...state,
      solvedRounds: state.solvedRounds + 1,
      lastResult: 'correct',
    },
    result: 'correct',
  }
}

/** Moves to the next word after a correct answer, or finishes the mission. */
export function advanceCipherRound(
  game: CipherGame,
  state: SymbolCipherState,
): SymbolCipherState {
  if (state.complete || state.lastResult !== 'correct') {
    return state
  }

  if (state.roundIndex + 1 >= game.rounds.length) {
    return { ...state, complete: true, lastResult: 'none' }
  }

  return {
    ...state,
    roundIndex: state.roundIndex + 1,
    input: '',
    lastResult: 'none',
  }
}

export function isCipherComplete(state: SymbolCipherState): boolean {
  return state.complete
}
