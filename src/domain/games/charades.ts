/**
 * Day 17 silent-elf charades rules.
 *
 * Three animals are drawn at random from a bank of twelve. Only the child who
 * acts may look at the current animal; the card is hidden by default and can be
 * shown or hidden again without any audio that would reveal the answer. Every
 * guessed animal is confirmed manually by the family, and no camera is used.
 */
import { shuffle } from './shuffle'

export const CHARADES_ANIMAL_BANK_SIZE = 12
export const CHARADES_ROUNDS = 3

export interface CharadeAnimal {
  readonly id: string
  readonly label: string
}

/**
 * Approved animal bank. Labels are the answer the actor must not say out loud.
 */
export const CHARADE_ANIMALS: readonly CharadeAnimal[] = [
  { id: 'dog', label: 'Perro' },
  { id: 'cat', label: 'Gato' },
  { id: 'elephant', label: 'Elefante' },
  { id: 'lion', label: 'León' },
  { id: 'monkey', label: 'Mono' },
  { id: 'penguin', label: 'Pingüino' },
  { id: 'frog', label: 'Rana' },
  { id: 'duck', label: 'Pato' },
  { id: 'rabbit', label: 'Conejo' },
  { id: 'bear', label: 'Oso' },
  { id: 'horse', label: 'Caballo' },
  { id: 'fish', label: 'Pez' },
]

export type CharadesPhase = 'playing' | 'complete'

export interface CharadesState {
  /** Three distinct animals chosen from the bank for this session. */
  readonly animals: readonly CharadeAnimal[]
  readonly roundIndex: number
  readonly hits: number
  /** Hidden by default so only the actor can choose to look. */
  readonly animalVisible: boolean
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
    phase: 'playing',
  }
}

export function currentCharadeAnimal(
  state: CharadesState,
): CharadeAnimal | null {
  return state.animals[state.roundIndex] ?? null
}

/** Shows or hides the current card. Never plays audio and never changes progress. */
export function toggleCharadeAnimal(state: CharadesState): CharadesState {
  if (state.phase !== 'playing') {
    return state
  }

  return { ...state, animalVisible: !state.animalVisible }
}

/**
 * Registers one guessed animal. The card hides again and the next animal waits
 * hidden. Three confirmed hits complete the mission.
 */
export function confirmCharadeHit(state: CharadesState): CharadesState {
  if (state.phase !== 'playing') {
    return state
  }

  const hits = state.hits + 1

  if (hits >= CHARADES_ROUNDS) {
    return { ...state, hits, animalVisible: false, phase: 'complete' }
  }

  return {
    ...state,
    hits,
    roundIndex: state.roundIndex + 1,
    animalVisible: false,
  }
}

export function isCharadesComplete(state: CharadesState): boolean {
  return state.phase === 'complete'
}
