/**
 * Day 5 snowball-fight rules.
 *
 * Each round allows up to five paper snowballs and the adult marks every throw
 * as inside or outside. Three hits win the round. A round that ends under three
 * hits is only feedback: the child can start unlimited new rounds.
 */

export const SNOWBALL_THROWS_PER_ROUND = 5
export const SNOWBALL_HITS_TO_WIN = 3

export type SnowballPhase = 'playing' | 'won' | 'round-lost'

export interface SnowballState {
  readonly throws: number
  readonly hits: number
  readonly phase: SnowballPhase
}

export function createSnowballState(): SnowballState {
  return { throws: 0, hits: 0, phase: 'playing' }
}

/** Records one adult verdict. Throws are ignored once the round is over. */
export function recordSnowballThrow(
  state: SnowballState,
  inside: boolean,
): SnowballState {
  if (state.phase !== 'playing') {
    return state
  }

  const throws = state.throws + 1
  const hits = state.hits + (inside ? 1 : 0)

  if (hits >= SNOWBALL_HITS_TO_WIN) {
    return { throws, hits, phase: 'won' }
  }

  if (throws >= SNOWBALL_THROWS_PER_ROUND) {
    return { throws, hits, phase: 'round-lost' }
  }

  return { throws, hits, phase: 'playing' }
}

export function resetSnowballRound(): SnowballState {
  return createSnowballState()
}

export function isSnowballRoundWon(state: SnowballState): boolean {
  return state.phase === 'won'
}

export function snowballsLeft(state: SnowballState): number {
  return Math.max(0, SNOWBALL_THROWS_PER_ROUND - state.throws)
}
