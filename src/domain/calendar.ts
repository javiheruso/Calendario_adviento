/**
 * Calendar rules for December 2026.
 *
 * Unlocking is based on the visitor's LOCAL date, not UTC: the door must open
 * at local midnight. Completed days stay accessible afterwards; the spec does
 * not chain days, so an unfinished previous day never blocks today's door.
 */
import {
  MISSION_DAYS,
  type AppConfig,
  type CalendarAccess,
  type DayStatus,
  type MissionDay,
  type ProgressState,
} from './types'

export const SEASON = {
  year: 2026,
  /** 1-based month. 12 = December. */
  month: 12,
  firstDay: 1,
  lastDay: 24,
} as const

const NO_ADULT_ACCESS: CalendarAccess = { adultPreview: false }

function localDateKey(date: Date): number {
  return date.getFullYear() * 10_000 + (date.getMonth() + 1) * 100 + date.getDate()
}

/** True from local midnight of the mission's December day onwards. */
export function isDayReleased(day: MissionDay, now: Date = new Date()): boolean {
  const releaseDate = new Date(SEASON.year, SEASON.month - 1, day)
  return localDateKey(now) >= localDateKey(releaseDate)
}

/**
 * Mission day matching the visitor's local date, or `null` outside the
 * 24-day December season. Used only to highlight "today"; it never gates
 * access by itself.
 */
export function getTodayMissionDay(now: Date = new Date()): MissionDay | null {
  if (now.getFullYear() !== SEASON.year || now.getMonth() !== SEASON.month - 1) {
    return null
  }

  const day = now.getDate()
  return day >= SEASON.firstDay && day <= SEASON.lastDay ? (day as MissionDay) : null
}

/**
 * Days already released by the local date that still have no star. The UI uses
 * this to show honest progress when previous doors are pending; it never
 * blocks a later day.
 */
export function getReleasedDaysWithoutStar(
  progress: ProgressState,
  now: Date = new Date(),
): MissionDay[] {
  return MISSION_DAYS.filter(
    (day) => isDayReleased(day, now) && !progress.days[day]?.giftFoundAt,
  )
}

export function isDayUnlocked(
  day: MissionDay,
  config: AppConfig,
  access: CalendarAccess = NO_ADULT_ACCESS,
  now: Date = new Date(),
): boolean {
  if (access.adultPreview) {
    return true
  }

  if (config.days[day].manuallyUnlocked) {
    return true
  }

  return isDayReleased(day, now)
}

export function getDayStatus(
  day: MissionDay,
  progress: ProgressState,
  config: AppConfig,
  access: CalendarAccess = NO_ADULT_ACCESS,
  now: Date = new Date(),
): DayStatus {
  const dayProgress = progress.days[day]

  if (dayProgress?.giftFoundAt) {
    return 'gift-found'
  }

  if (!isDayUnlocked(day, config, access, now)) {
    return 'locked'
  }

  if (dayProgress?.missionCompletedAt) {
    return 'mission-complete'
  }

  return 'available'
}
