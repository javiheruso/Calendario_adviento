/**
 * Local-first persistence.
 *
 * Config and progress are small JSON documents, so `localStorage` is enough
 * and synchronous. Album media will use IndexedDB in a later phase; it must not
 * be stored here.
 *
 * Child progress and demo progress use separate keys. The demo snapshot is
 * therefore isolated from the child one: previewing or resetting a demo can
 * never grant or remove a child star.
 *
 * Loading is defensive: anything missing, corrupt or from an unknown schema is
 * discarded in favour of defaults. Add a migration before bumping
 * `SCHEMA_VERSION`; there is no silent upgrade path yet.
 */
import { createDefaultConfig, createDefaultDaySettings } from '../domain/config'
import { parsePinRecord } from '../security/pin'
import { createDayProgress, createEmptyProgress } from '../domain/progress'
import {
  MISSION_DAYS,
  type AppConfig,
  type AppState,
  type DayProgress,
  type DaySettings,
  type MissionDay,
  type PinRecord,
  type ProgressState,
} from '../domain/types'

export const STORAGE_KEY = 'los24regalos:v1'
/**
 * Demo progress lives under its own key. The demo mode itself is session-only,
 * but keeping its progress here lets QA verify persistence without ever
 * touching the child snapshot in `STORAGE_KEY`.
 */
export const DEMO_STORAGE_KEY = 'los24regalos:demo:v1'
export const SCHEMA_VERSION = 1

interface DemoSnapshot {
  readonly schemaVersion: number
  readonly progress: ProgressState
}

export function createInitialState(): AppState {
  return {
    schemaVersion: SCHEMA_VERSION,
    config: createDefaultConfig(),
    progress: createEmptyProgress(),
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function stringOrNull(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value : null
}

function isoTimestampOrNull(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null
  }
  return Number.isNaN(Date.parse(value)) ? null : value
}

function normalizePin(value: unknown): PinRecord | null {
  return parsePinRecord(value)
}

function normalizeDaySettings(value: unknown): DaySettings {
  const defaults = createDefaultDaySettings()

  if (!isObject(value)) {
    return defaults
  }

  const hints = isObject(value.hints) ? value.hints : {}

  return {
    hidingSpot: stringOrNull(value.hidingSpot),
    hints: {
      main: stringOrNull(hints.main),
      location: stringOrNull(hints.location),
    },
    manuallyUnlocked: value.manuallyUnlocked === true,
  }
}

function normalizeConfig(value: unknown): AppConfig {
  if (!isObject(value)) {
    return createDefaultConfig()
  }

  const storedDays = isObject(value.days) ? value.days : {}
  const days = {} as Record<MissionDay, DaySettings>

  for (const day of MISSION_DAYS) {
    days[day] = normalizeDaySettings(storedDays[day])
  }

  const parental = isObject(value.parental) ? value.parental : {}

  return {
    parental: {
      pin: normalizePin(parental.pin),
      // Older snapshots did not store this switch; keeping the camera available
      // preserves their behaviour instead of silently disabling it on upgrade.
      cameraEnabled: parental.cameraEnabled !== false,
    },
    days,
  }
}

function normalizeDayProgress(value: unknown, day: MissionDay): DayProgress | null {
  if (!isObject(value)) {
    return null
  }

  const fallback = createDayProgress(day)

  return {
    day,
    missionCompletedAt: isoTimestampOrNull(value.missionCompletedAt) ?? fallback.missionCompletedAt,
    giftFoundAt: isoTimestampOrNull(value.giftFoundAt) ?? fallback.giftFoundAt,
    hintRevealedAt: isoTimestampOrNull(value.hintRevealedAt) ?? fallback.hintRevealedAt,
    locationHintRevealedAt:
      isoTimestampOrNull(value.locationHintRevealedAt) ?? fallback.locationHintRevealedAt,
  }
}

function normalizeProgress(value: unknown): ProgressState {
  if (!isObject(value)) {
    return createEmptyProgress()
  }

  const storedDays = isObject(value.days) ? value.days : {}
  const days: Partial<Record<MissionDay, DayProgress>> = {}

  for (const day of MISSION_DAYS) {
    const dayProgress = normalizeDayProgress(storedDays[day], day)
    if (dayProgress) {
      days[day] = dayProgress
    }
  }

  return { days }
}

function normalizeState(value: unknown): AppState {
  if (!isObject(value) || value.schemaVersion !== SCHEMA_VERSION) {
    return createInitialState()
  }

  return {
    schemaVersion: SCHEMA_VERSION,
    config: normalizeConfig(value.config),
    progress: normalizeProgress(value.progress),
  }
}

function normalizeDemoSnapshot(value: unknown): ProgressState {
  if (!isObject(value) || value.schemaVersion !== SCHEMA_VERSION) {
    return createEmptyProgress()
  }

  return normalizeProgress(value.progress)
}

function defaultStorage(): Storage | null {
  try {
    return window.localStorage
  } catch {
    // Blocked storage (private mode or hardened settings).
    return null
  }
}

function readSnapshot<T>(
  storage: Storage | null,
  key: string,
  parse: (value: unknown) => T,
  fallback: () => T,
): T {
  if (!storage) {
    return fallback()
  }

  try {
    const raw = storage.getItem(key)
    if (!raw) {
      return fallback()
    }
    return parse(JSON.parse(raw) as unknown)
  } catch {
    return fallback()
  }
}

/** Returns false when the browser refuses to persist (quota or privacy mode). */
function writeSnapshot(storage: Storage | null, key: string, value: unknown): boolean {
  if (!storage) {
    return false
  }

  try {
    storage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

function removeSnapshot(storage: Storage | null, key: string): boolean {
  if (!storage) {
    return false
  }

  try {
    storage.removeItem(key)
    return true
  } catch {
    return false
  }
}

export function loadAppState(storage: Storage | null = defaultStorage()): AppState {
  return readSnapshot(storage, STORAGE_KEY, normalizeState, createInitialState)
}

export function saveAppState(state: AppState, storage: Storage | null = defaultStorage()): boolean {
  return writeSnapshot(storage, STORAGE_KEY, state)
}

export function resetAppState(storage: Storage | null = defaultStorage()): AppState {
  removeSnapshot(storage, STORAGE_KEY)
  return createInitialState()
}

export function loadDemoProgress(storage: Storage | null = defaultStorage()): ProgressState {
  return readSnapshot(storage, DEMO_STORAGE_KEY, normalizeDemoSnapshot, createEmptyProgress)
}

export function saveDemoProgress(
  progress: ProgressState,
  storage: Storage | null = defaultStorage(),
): boolean {
  const snapshot: DemoSnapshot = { schemaVersion: SCHEMA_VERSION, progress }
  return writeSnapshot(storage, DEMO_STORAGE_KEY, snapshot)
}

/**
 * Removes the demo snapshot. Returns `false` when the browser could not clear
 * it, so the UI reports the failure instead of claiming a reset was saved.
 */
export function resetDemoProgress(storage: Storage | null = defaultStorage()): boolean {
  return removeSnapshot(storage, DEMO_STORAGE_KEY)
}
