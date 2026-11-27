/**
 * Day 8 word scramble rules.
 *
 * Three words (RENO, NIEVE, REGALO) are ordered letter by letter. Letters are
 * placed in the next empty slot and can always be taken back: there is no
 * timer, penalty or attempt limit.
 */
import { shuffle } from './shuffle'

export const SCRAMBLE_WORDS = ['RENO', 'NIEVE', 'REGALO'] as const
export type ScrambleWord = (typeof SCRAMBLE_WORDS)[number]

export interface LetterTile {
  readonly id: string
  readonly char: string
}

export interface WordRound {
  readonly word: string
  readonly tiles: readonly LetterTile[]
  /** Each slot holds a tile id or `null` while empty. */
  readonly slots: readonly (string | null)[]
}

export interface ScrambleGame {
  readonly rounds: readonly WordRound[]
}

export function normalizeWord(word: string): string {
  return word.trim().toUpperCase()
}

export function createWordRound(
  word: string,
  random: () => number = Math.random,
): WordRound {
  const normalized = normalizeWord(word)
  const tiles: LetterTile[] = normalized
    .split('')
    .map((char, index) => ({ id: `${char}-${index}`, char }))
  let shuffled = shuffle(tiles, random)

  // Keep every round a real challenge even if the shuffle happens to spell it.
  if (shuffled.length > 1 && shuffled.map((tile) => tile.char).join('') === normalized) {
    shuffled = [...shuffled.slice(1), shuffled[0]]
  }

  return {
    word: normalized,
    tiles: shuffled,
    slots: shuffled.map(() => null),
  }
}

export function createScrambleGame(
  words: readonly string[] = SCRAMBLE_WORDS,
  random: () => number = Math.random,
): ScrambleGame {
  return { rounds: words.map((word) => createWordRound(word, random)) }
}

export function placeLetter(round: WordRound, tileId: string): WordRound {
  const tile = round.tiles.find((candidate) => candidate.id === tileId)

  if (!tile || round.slots.includes(tileId)) {
    return round
  }

  const slotIndex = round.slots.findIndex((slot) => slot === null)

  if (slotIndex === -1) {
    return round
  }

  const slots = [...round.slots]
  slots[slotIndex] = tileId
  return { ...round, slots }
}

export function removeLetter(round: WordRound, slotIndex: number): WordRound {
  if (slotIndex < 0 || slotIndex >= round.slots.length || round.slots[slotIndex] === null) {
    return round
  }

  const slots = [...round.slots]
  slots[slotIndex] = null
  return { ...round, slots }
}

/** Returns every placed letter to the tray without touching the word. */
export function clearRound(round: WordRound): WordRound {
  return { ...round, slots: round.slots.map(() => null) }
}

export function isTilePlaced(round: WordRound, tileId: string): boolean {
  return round.slots.includes(tileId)
}

export function wordFromSlots(round: WordRound): string {
  return round.slots
    .map((tileId) =>
      tileId === null
        ? ''
        : round.tiles.find((tile) => tile.id === tileId)?.char ?? '',
    )
    .join('')
}

export function isRoundSolved(round: WordRound): boolean {
  return (
    round.slots.every((slot) => slot !== null) && wordFromSlots(round) === round.word
  )
}
