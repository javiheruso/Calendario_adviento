/**
 * Pure accessibility rules shared by the UI.
 *
 * Timers and progress counters update several times per second. The visible
 * text may keep changing, but screen-reader announcements must stay meaningful:
 * only the configured milestones (and the final zero) are announced. This module
 * keeps that rule separate from React so it can be covered by the domain tests.
 */

/** Minimum touch target recommended by the bounded accessibility slice. */
export const TOUCH_TARGET_MIN_PX = 44

/** Default meaningful checkpoints for playful countdowns. */
export const DEFAULT_COUNTDOWN_MILESTONES: readonly number[] = [30, 10, 0]

/**
 * Returns the announcement for a countdown checkpoint, or `null` when the
 * current second is not a milestone. Fractions are rounded up so a 0.2-second
 * tick cannot hide a milestone such as 30 seconds.
 */
export function countdownAnnouncement(
  remainingSeconds: number,
  label: string,
  milestones: readonly number[] = DEFAULT_COUNTDOWN_MILESTONES,
): string | null {
  if (!Number.isFinite(remainingSeconds)) {
    return null
  }

  const remaining = Math.max(0, Math.ceil(remainingSeconds))

  if (!milestones.includes(remaining)) {
    return null
  }

  return remaining === 0
    ? `${label}: tiempo terminado.`
    : `${label}: quedan ${remaining} segundos.`
}
