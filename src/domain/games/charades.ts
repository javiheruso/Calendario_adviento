/**
 * Day 17 silent-elf charades rules.
 *
 * Three animals are drawn at random from the approved bank of twelve. Only the
 * child who acts may look at the current animal; the card is hidden by default
 * and can be shown or hidden again without any audio that would reveal the
 * answer. Every guessed animal is confirmed manually by the family, and no
 * camera is used.
 */
import { shuffle } from './shuffle'

export const CHARADES_ANIMAL_BANK_SIZE = 12
export const CHARADES_ROUNDS = 3

export interface CharadeAnimal {
  readonly id: string
  readonly label: string
}

/**
 * Exact approved animal bank and order. Labels are the answer the actor must
 * not say out loud.
 */
export const CHARADE_ANIMALS: readonly CharadeAnimal[] = [
  { id: 'elephant', label: 'Elefante' },
  { id: 'cat', label: 'Gato' },
  { id: 'dog', label: 'Perro' },
  { id: 'lion', label: 'León' },
  { id: 'monkey', label: 'Mono' },
  { id: 'penguin', label: 'Pingüino' },
  { id: 'rabbit', label: 'Conejo' },
  { id: 'hen', label: 'Gallina' },
  { id: 'gorilla', label: 'Gorila' },
  { id: 'duck', label: 'Pato' },
  { id: 'frog', label: 'Rana' },
  { id: 'reindeer', label: 'Reno' },
]

export type CharadesPhase = 'playing' | 'complete'

export interface CharadesState {
  /** Three distinct animals chosen from the bank for this session. */
  readonly animals: readonly CharadeAnimal[]
  readonly roundIndex: number
  readonly hits: number
  /** Visible only while the actor holds the reveal control. */
  readonly animalVisible: boolean
  /**
   * True when the card was shown and then hidden again during the current
   * animal. The manual hit is unavailable until that full cycle happened.
   */
  readonly revealedOnce: boolean
  readonly phase: CharadesPhase
}

/** Picks three distinct animals, preserving the bank order returned by shuffle. */
export function createCharadesState(
  random: () => number = Math.random,
): CharadesState {
  const animals = shuffle(CHARADE_ANIMALS, random).slice(0, CHARADES_ROUNDS)

  return {
    animals,
    roundIndex: 0,
    hits: 0,
    animalVisible: false,
    revealedOnce: false,
    phase: 'playing',
  }
}

export function currentCharadeAnimal(
  state: CharadesState,
): CharadeAnimal | null {
  return state.animals[state.roundIndex] ?? null
}

/**
 * Reveals the card while the actor holds the control. Repeating the call is
 * idempotent. No audio is played and progress never changes.
 */
export function revealCharadeAnimal(state: CharadesState): CharadesState {
  if (state.phase !== 'playing' || state.animalVisible) {
    return state
  }

  return { ...state, animalVisible: true }
}

/**
 * Hides the card on release, cancel, outside, focus loss or a visibility
 * change. The first completed show → hide cycle unlocks the manual hit.
 */
export function hideCharadeAnimal(state: CharadesState): CharadesState {
  if (state.phase !== 'playing' || !state.animalVisible) {
    return state
  }

  return { ...state, animalVisible: false, revealedOnce: true }
}

/** Backwards-compatible helper used by tests and simple toggles. */
export function toggleCharadeAnimal(state: CharadesState): CharadesState {
  return state.animalVisible ? hideCharadeAnimal(state) : revealCharadeAnimal(state)
}

/** The manual hit requires a card that was shown and then hidden again. */
export function canConfirmCharadeHit(state: CharadesState): boolean {
  return (
    state.phase === 'playing' && state.revealedOnce && !state.animalVisible
  )
}

/**
 * Registers one guessed animal only after the reveal gate is satisfied. The
 * next animal waits hidden with a fresh reveal gate. Three confirmed hits
 * complete the mission.
 */
export function confirmCharadeHit(state: CharadesState): CharadesState {
  if (!canConfirmCharadeHit(state)) {
    return state
  }

  const hits = state.hits + 1

  if (hits >= CHARADES_ROUNDS) {
    return {
      ...state,
      hits,
      animalVisible: false,
      revealedOnce: false,
      phase: 'complete',
    }
  }

  return {
    ...state,
    hits,
    roundIndex: state.roundIndex + 1,
    animalVisible: false,
    revealedOnce: false,
  }
}

export function isCharadesComplete(state: CharadesState): boolean {
  return state.phase === 'complete'
}
