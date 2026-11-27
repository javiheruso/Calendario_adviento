/**
 * Deterministic random source for game-rule tests.
 *
 * Values are consumed in order and clamped to the `[0, 1)` range that the game
 * shuffle expects.
 */
export function sequenceRandom(values: readonly number[]): () => number {
  let index = 0

  return () => {
    const value = values[index % values.length] ?? 0
    index += 1
    return Math.min(0.999, Math.max(0, value))
  }
}
