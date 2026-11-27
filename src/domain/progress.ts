/**
 * Progress transitions.
 *
 * Every function is pure and returns a new state. Repeating a mission is
 * allowed by design, but a day keeps a single record, so a star can never be
 * duplicated.
 */
import { TOTAL_MISSIONS, type DayProgress, type MissionDay, type ProgressState } from './types'

export type HintKind = 'main' | 'location'

export function createDayProgress(day: MissionDay): DayProgress {
  return {
    day,
    missionCompletedAt: null,
    giftFoundAt: null,
    hintRevealedAt: null,
    locationHintRevealedAt: null,
  }
}

export function createEmptyProgress(): ProgressState {
  return { days: {} }
}

function getDayProgress(progress: ProgressState, day: MissionDay): DayProgress {
  return progress.days[day] ?? createDayProgress(day)
}

function withDay(progress: ProgressState, dayProgress: DayProgress): ProgressState {
  return { days: { ...progress.days, [dayProgress.day]: dayProgress } }
}

/** Marks the mission as completed. Repeats keep the first timestamp. */
export function completeMission(
  progress: ProgressState,
  day: MissionDay,
  at: Date = new Date(),
): ProgressState {
  const current = getDayProgress(progress, day)

  if (current.missionCompletedAt) {
    return progress
  }

  return withDay(progress, { ...current, missionCompletedAt: at.toISOString() })
}

/**
 * Confirms the gift was found and awards the day's star. This is the only way
 * to earn a star; confirming again keeps the first timestamp.
 */
export function confirmGiftFound(
  progress: ProgressState,
  day: MissionDay,
  at: Date = new Date(),
): ProgressState {
  const current = getDayProgress(progress, day)

  if (current.giftFoundAt) {
    return progress
  }

  const timestamp = at.toISOString()
  return withDay(progress, {
    ...current,
    missionCompletedAt: current.missionCompletedAt ?? timestamp,
    giftFoundAt: timestamp,
  })
}

/** Stores that a hint was shown, so it stays unlocked after a reload. */
export function revealHint(
  progress: ProgressState,
  day: MissionDay,
  kind: HintKind,
  at: Date = new Date(),
): ProgressState {
  const current = getDayProgress(progress, day)
  const field = kind === 'main' ? 'hintRevealedAt' : 'locationHintRevealedAt'

  if (current[field]) {
    return progress
  }

  return withDay(progress, { ...current, [field]: at.toISOString() })
}

export function countStars(progress: ProgressState): number {
  return Object.values(progress.days).filter((dayProgress) => dayProgress?.giftFoundAt).length
}

export function hasStar(progress: ProgressState, day: MissionDay): boolean {
  return Boolean(progress.days[day]?.giftFoundAt)
}

/** True when every day has its star; used by the final celebration. */
export function isAlbumComplete(progress: ProgressState): boolean {
  return countStars(progress) === TOTAL_MISSIONS
}
