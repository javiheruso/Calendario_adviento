/**
 * Day 24 memory crystal rules.
 *
 * Three independent bell sequences of 3, 4 and 5 notes. Unlike day 18, the
 * sequences are not cumulative: each one is played on its own. The day 18
 * Simon rules are reused for playback, input and retries, so a wrong note only
 * pauses the current sequence.
 */

import type { SimonGame } from './bellSimon'

export const FINAL_BELL_COUNT = 4
export const FINAL_BELL_ROUND_LENGTHS = [3, 4, 5] as const

function randomBell(random: () => number, bellCount: number): number {
  return Math.min(bellCount - 1, Math.max(0, Math.floor(random() * bellCount)))
}

/** Builds the three independent 3/4/5-note sequences for the memory crystal. */
export function createFinalBellGame(random: () => number = Math.random): SimonGame {
  const rounds = FINAL_BELL_ROUND_LENGTHS.map((length) =>
    Array.from({ length }, () => randomBell(random, FINAL_BELL_COUNT)),
  )

  return { rounds, bellCount: FINAL_BELL_COUNT }
}
