/**
 * Deterministic-friendly Fisher-Yates shuffle.
 *
 * Callers may inject a random source so game setup is reproducible in tests.
 * The source must return a value in the `[0, 1)` range, like `Math.random`.
 */
export function shuffle<T>(items: readonly T[], random: () => number = Math.random): T[] {
  const result = [...items]

  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = Math.min(index, Math.max(0, Math.floor(random() * (index + 1))))
    const swap = result[index]
    result[index] = result[target]
    result[target] = swap
  }

  return result
}
