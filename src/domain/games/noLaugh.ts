/**
 * Day 13 no-laughing rules.
 *
 * Two rounds of thirty seconds: the child holds back laughter while an adult
 * jokes, then the adult holds back while the child jokes. Tickling is excluded.
 * Both rounds count as complete whatever happens inside them: there is no
 * mandatory winner and no penalty.
 */

export const NO_LAUGH_ROUNDS = 2
export const NO_LAUGH_ROUND_SECONDS = 30

export interface NoLaughRoundInfo {
  readonly title: string
  readonly instruction: string
}

export const NO_LAUGH_ROUND_INFOS: readonly NoLaughRoundInfo[] = [
  {
    title: 'Ronda 1: Leyre aguanta',
    instruction:
      'Leyre intenta no reírse mientras un adulto hace bromas y sonidos. Sin cosquillas.',
  },
  {
    title: 'Ronda 2: el adulto aguanta',
    instruction:
      'Ahora el adulto intenta no reírse mientras Leyre hace bromas. Sin cosquillas.',
  },
]

export type NoLaughPhase = 'idle' | 'playing' | 'round-complete' | 'complete'

export interface NoLaughState {
  readonly roundIndex: number
  readonly completedRounds: number
  readonly phase: NoLaughPhase
}

export function createNoLaughState(): NoLaughState {
  return { roundIndex: 0, completedRounds: 0, phase: 'idle' }
}

export function startNoLaughRound(state: NoLaughState): NoLaughState {
  if (state.phase !== 'idle') {
    return state
  }

  return { ...state, phase: 'playing' }
}

/** Ends the current round. The timer and the manual button both call this. */
export function finishNoLaughRound(state: NoLaughState): NoLaughState {
  if (state.phase !== 'playing') {
    return state
  }

  const completedRounds = state.completedRounds + 1

  if (completedRounds >= NO_LAUGH_ROUNDS) {
    return { ...state, completedRounds, phase: 'complete' }
  }

  return { ...state, completedRounds, phase: 'round-complete' }
}

/** Moves from the break screen to the next round's starting screen. */
export function prepareNextNoLaughRound(state: NoLaughState): NoLaughState {
  if (state.phase !== 'round-complete') {
    return state
  }

  return {
    ...state,
    roundIndex: Math.min(state.roundIndex + 1, NO_LAUGH_ROUNDS - 1),
    phase: 'idle',
  }
}

export function isNoLaughComplete(state: NoLaughState): boolean {
  return state.phase === 'complete'
}

export function currentNoLaughRound(state: NoLaughState): NoLaughRoundInfo {
  return NO_LAUGH_ROUND_INFOS[state.roundIndex] ?? NO_LAUGH_ROUND_INFOS[0]
}
