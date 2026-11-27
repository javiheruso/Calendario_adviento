/**
 * Day 18 Simon rules.
 *
 * Four bells, five cumulative rounds of two to six notes. Every round appends
 * one note to the previous sequence. A wrong note only pauses the round: the
 * child can replay and retry without losing progress.
 *
 * The game is intentionally silent. The UI shows coloured bells with tone
 * labels until real audio exists, and no background music plays during a
 * sequence.
 */

export const SIMON_BELL_COUNT = 4
export const SIMON_ROUNDS = 5
export const SIMON_FIRST_NOTES = 2

export interface SimonGame {
  /** Cumulative sequences; each one starts with the previous one. */
  readonly rounds: readonly (readonly number[])[]
  readonly bellCount: number
}

export type SimonPhase = 'showing' | 'input' | 'failed' | 'complete'

export interface SimonProgress {
  readonly round: number
  readonly inputIndex: number
  readonly phase: SimonPhase
}

export type SimonPressResult =
  | 'ignored'
  | 'progress'
  | 'round-complete'
  | 'game-complete'
  | 'failed'

export interface SimonPressOutcome {
  readonly progress: SimonProgress
  readonly result: SimonPressResult
}

function randomBell(random: () => number, bellCount: number): number {
  return Math.min(bellCount - 1, Math.max(0, Math.floor(random() * bellCount)))
}

export function createSimonGame(
  bellCount: number = SIMON_BELL_COUNT,
  rounds: number = SIMON_ROUNDS,
  firstNotes: number = SIMON_FIRST_NOTES,
  random: () => number = Math.random,
): SimonGame {
  const sequences: number[][] = []
  let current: number[] = []

  for (let index = 0; index < Math.max(1, firstNotes); index += 1) {
    current.push(randomBell(random, bellCount))
  }
  sequences.push(current)

  while (sequences.length < Math.max(1, rounds)) {
    current = [...current, randomBell(random, bellCount)]
    sequences.push(current)
  }

  return { rounds: sequences, bellCount }
}

export function createSimonProgress(game: SimonGame): SimonProgress {
  return {
    round: 0,
    inputIndex: 0,
    phase: game.rounds.length > 0 ? 'showing' : 'complete',
  }
}

export function currentSimonSequence(
  game: SimonGame,
  progress: SimonProgress,
): readonly number[] {
  return game.rounds[progress.round] ?? []
}

/** Called by the UI after playback so the child may answer. */
export function beginSimonInput(progress: SimonProgress): SimonProgress {
  if (progress.phase !== 'showing') {
    return progress
  }

  return { ...progress, inputIndex: 0, phase: 'input' }
}

export function pressSimonBell(
  game: SimonGame,
  progress: SimonProgress,
  bell: number,
): SimonPressOutcome {
  if (progress.phase !== 'input') {
    return { progress, result: 'ignored' }
  }

  const sequence = currentSimonSequence(game, progress)

  if (sequence.length === 0 || bell !== sequence[progress.inputIndex]) {
    return {
      progress: { ...progress, inputIndex: 0, phase: 'failed' },
      result: 'failed',
    }
  }

  const nextIndex = progress.inputIndex + 1

  if (nextIndex < sequence.length) {
    return {
      progress: { ...progress, inputIndex: nextIndex },
      result: 'progress',
    }
  }

  if (progress.round + 1 >= game.rounds.length) {
    return {
      progress: { ...progress, inputIndex: nextIndex, phase: 'complete' },
      result: 'game-complete',
    }
  }

  return {
    progress: { round: progress.round + 1, inputIndex: 0, phase: 'showing' },
    result: 'round-complete',
  }
}

/** Replays the current sequence from the start. Used after a mismatch too. */
export function replaySimonRound(progress: SimonProgress): SimonProgress {
  if (progress.phase === 'complete') {
    return progress
  }

  return { ...progress, inputIndex: 0, phase: 'showing' }
}

export function isSimonComplete(progress: SimonProgress): boolean {
  return progress.phase === 'complete'
}
