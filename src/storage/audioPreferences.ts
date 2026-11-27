/**
 * Local persistence for audio preferences.
 *
 * Kept out of `AppState` on purpose: these are device settings, not mission
 * progress or parental configuration. A corrupt or outdated snapshot falls back
 * to defaults, and every write returns `false` when the browser refuses to
 * persist instead of pretending the change was saved.
 */
import {
  DEFAULT_AUDIO_PREFERENCES,
  normalizeAudioPreferences,
  type AudioPreferences,
} from '../domain/audioPreferences'

export const AUDIO_PREFERENCES_KEY = 'los24regalos:audio:v1'
export const AUDIO_PREFERENCES_SCHEMA_VERSION = 1

interface AudioPreferencesSnapshot {
  readonly schemaVersion: number
  readonly preferences: AudioPreferences
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function defaultStorage(): Storage | null {
  try {
    return window.localStorage
  } catch {
    return null
  }
}

export function loadAudioPreferences(
  storage: Storage | null = defaultStorage(),
): AudioPreferences {
  if (!storage) {
    return { ...DEFAULT_AUDIO_PREFERENCES }
  }

  try {
    const raw = storage.getItem(AUDIO_PREFERENCES_KEY)

    if (!raw) {
      return { ...DEFAULT_AUDIO_PREFERENCES }
    }

    const parsed: unknown = JSON.parse(raw)

    if (!isRecord(parsed) || parsed.schemaVersion !== AUDIO_PREFERENCES_SCHEMA_VERSION) {
      return { ...DEFAULT_AUDIO_PREFERENCES }
    }

    return normalizeAudioPreferences(parsed.preferences)
  } catch {
    return { ...DEFAULT_AUDIO_PREFERENCES }
  }
}

export function saveAudioPreferences(
  preferences: AudioPreferences,
  storage: Storage | null = defaultStorage(),
): boolean {
  if (!storage) {
    return false
  }

  const snapshot: AudioPreferencesSnapshot = {
    schemaVersion: AUDIO_PREFERENCES_SCHEMA_VERSION,
    preferences: normalizeAudioPreferences(preferences),
  }

  try {
    storage.setItem(AUDIO_PREFERENCES_KEY, JSON.stringify(snapshot))
    return true
  } catch {
    return false
  }
}
