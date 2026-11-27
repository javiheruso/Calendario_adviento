/**
 * Core domain contracts for the Advent calendar.
 *
 * These types describe data, not behavior. Mission games are implemented in
 * later phases; this module only fixes the contracts Phase P1 builds on
 * (calendar, unlocks, hints and stars).
 */
import type { AssetId } from './assets'

export type MissionDay =
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 11
  | 12
  | 13
  | 14
  | 15
  | 16
  | 17
  | 18
  | 19
  | 20
  | 21
  | 22
  | 23
  | 24

export const MISSION_DAYS: readonly MissionDay[] = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24,
]

export const TOTAL_MISSIONS = MISSION_DAYS.length

/**
 * Mechanic identifier used to route a day to its game component in P1.
 * The games themselves are out of scope for P0.
 */
export type MissionKind =
  | 'dance'
  | 'memory'
  | 'red-outfit'
  | 'reindeer-maze'
  | 'snowball-toss'
  | 'spot-difference'
  | 'karaoke'
  | 'word-scramble'
  | 'sock-pairs'
  | 'patterns'
  | 'guided-drawing'
  | 'catch-gifts'
  | 'no-laugh'
  | 'math-lock'
  | 'cup-pyramid'
  | 'jigsaw'
  | 'charades'
  | 'bell-simon'
  | 'hidden-objects'
  | 'touch-bag'
  | 'snowman-build'
  | 'symbol-cipher'
  | 'craft'
  | 'finale'

export interface MissionDefinition {
  readonly day: MissionDay
  readonly title: string
  readonly kind: MissionKind
  /** Key into the centralized asset catalog. */
  readonly illustration: AssetId
  /**
   * `planned` until the game UI exists. The P1 calendar must not open a
   * placeholder game for a planned mission.
   */
  readonly status: 'planned' | 'implemented'
}

/** Per-day hints. `null` means "not configured yet", never "invent a location". */
export interface MissionHints {
  /** Reward clue shown after the mission; independent from the challenge. */
  readonly main: string | null
  /** Optional extra help for finding the gift. */
  readonly location: string | null
}

export interface DaySettings {
  /** Parent-only hiding place. Must never be rendered in child mode. */
  readonly hidingSpot: string | null
  readonly hints: MissionHints
  /** Parental override for this specific day. */
  readonly manuallyUnlocked: boolean
}

/** Local parental PIN. A deterrent, not cryptographic security (see docs). */
export interface PinRecord {
  readonly algorithm: 'PBKDF2-SHA-256'
  readonly iterations: number
  readonly salt: string
  readonly hash: string
}

export interface ParentalSettings {
  readonly pin: PinRecord | null
  /**
   * Local parental switch for the optional camera and recording surfaces.
   * When false, no feature may call `getUserMedia`; the mission and album keep
   * working without media.
   */
  readonly cameraEnabled: boolean
}

export interface AppConfig {
  readonly parental: ParentalSettings
  readonly days: Readonly<Record<MissionDay, DaySettings>>
}

export interface DayProgress {
  readonly day: MissionDay
  readonly missionCompletedAt: string | null
  readonly giftFoundAt: string | null
  readonly hintRevealedAt: string | null
  readonly locationHintRevealedAt: string | null
}

/** One record per day, so a star can never be duplicated. */
export interface ProgressState {
  readonly days: Readonly<Partial<Record<MissionDay, DayProgress>>>
}

export type DayStatus = 'locked' | 'available' | 'mission-complete' | 'gift-found'

/**
 * Session-only adult access. Preview must never be persisted and must never
 * write child progress.
 */
export interface CalendarAccess {
  readonly adultPreview: boolean
}

/** Persisted snapshot. `schemaVersion` allows explicit migrations later. */
export interface AppState {
  readonly schemaVersion: number
  readonly config: AppConfig
  readonly progress: ProgressState
}
