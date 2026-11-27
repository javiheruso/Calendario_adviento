/**
 * Day 2 memory rules.
 *
 * Twelve cards pair into six illustrations. There is no timer, no attempt
 * limit and no penalty: the only failure state is a temporary mismatch that the
 * UI resolves after a short pause.
 */
import { shuffle } from './shuffle'

export const MEMORY_PAIRS = 6
export const MEMORY_CARDS = MEMORY_PAIRS * 2

export interface MemoryCard {
  readonly id: number
  readonly pairId: number
  readonly faceUp: boolean
  readonly matched: boolean
}

export interface MemoryState {
  readonly cards: readonly MemoryCard[]
  /** True while two different cards are face up, before the UI flips them back. */
  readonly hasMismatch: boolean
}

export function createMemoryState(
  pairCount: number = MEMORY_PAIRS,
  random: () => number = Math.random,
): MemoryState {
  const cards: MemoryCard[] = []

  for (let pairId = 0; pairId < pairCount; pairId += 1) {
    cards.push({ id: pairId * 2, pairId, faceUp: false, matched: false })
    cards.push({ id: pairId * 2 + 1, pairId, faceUp: false, matched: false })
  }

  return { cards: shuffle(cards, random), hasMismatch: false }
}

/**
 * Reveals one card. A matching second card locks the pair; a non-matching one
 * sets `hasMismatch` so the UI can call `resolveMemoryMismatch` after a pause.
 */
export function flipMemoryCard(state: MemoryState, cardId: number): MemoryState {
  if (state.hasMismatch) {
    return state
  }

  const openCards = state.cards.filter((card) => card.faceUp && !card.matched)

  if (openCards.length >= 2) {
    return state
  }

  const target = state.cards.find((card) => card.id === cardId)

  if (!target || target.faceUp || target.matched) {
    return state
  }

  const cards = state.cards.map((card) =>
    card.id === cardId ? { ...card, faceUp: true } : card,
  )
  const nowOpen = cards.filter((card) => card.faceUp && !card.matched)

  if (nowOpen.length === 2 && nowOpen[0].pairId === nowOpen[1].pairId) {
    const matchedIds = new Set(nowOpen.map((card) => card.id))
    return {
      cards: cards.map((card) =>
        matchedIds.has(card.id) ? { ...card, matched: true } : card,
      ),
      hasMismatch: false,
    }
  }

  return { cards, hasMismatch: nowOpen.length === 2 }
}

/** Turns the two mismatched cards face down again. Never loses progress. */
export function resolveMemoryMismatch(state: MemoryState): MemoryState {
  if (!state.hasMismatch) {
    return state
  }

  return {
    cards: state.cards.map((card) =>
      card.faceUp && !card.matched ? { ...card, faceUp: false } : card,
    ),
    hasMismatch: false,
  }
}

export function matchedMemoryPairs(state: MemoryState): number {
  return new Set(
    state.cards.filter((card) => card.matched).map((card) => card.pairId),
  ).size
}

export function isMemoryComplete(state: MemoryState): boolean {
  return state.cards.length > 0 && state.cards.every((card) => card.matched)
}
