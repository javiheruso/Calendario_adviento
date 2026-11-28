/**
 * Reward-flow rules shared by the mission panel and the calendar shell.
 *
 * The star is persisted before the celebration starts. A child confirmation
 * that could not be written must never navigate away or pretend the star was
 * saved, and an adult preview/demo must never return to the child calendar.
 *
 * The custom event is prepared for a future audio layer: a listener can react
 * to an earned star without the domain code importing Web Audio.
 */

export const STAR_EARNED_EVENT = 'advent:star-earned'

/** Delay between a saved star and the automatic return to the calendar. */
export const REWARD_RETURN_DELAY_MS = 1800

export interface StarEarnedDetail {
  readonly day: number
  readonly stars: number
  readonly total: number
}

/**
 * Only a saved child reward navigates automatically. Demo/preview progress is
 * isolated, so it stays on the adult surface instead of moving the child to
 * the calendar as if a real star had been earned.
 */
export function shouldReturnToCalendar(saved: boolean, demoMode: boolean): boolean {
  return saved && !demoMode
}

/** Builds the detail payload for the future-audio reward event. */
export function starEarnedDetail(
  day: number,
  stars: number,
  total: number,
): StarEarnedDetail {
  return { day, stars, total }
}

/**
 * Persists a progress snapshot before publishing it in memory. A failed write
 * never reaches `publish`, so the UI cannot show a star, hint or completion
 * that the device did not store. Returns the persistence result so callers can
 * gate celebrations and navigation on it.
 */
export function persistBeforePublish<T>(
  next: T,
  persist: (value: T) => boolean,
  publish: (value: T) => void,
): boolean {
  const saved = persist(next)

  if (saved) {
    publish(next)
  }

  return saved
}
