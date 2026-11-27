/**
 * Default configuration and pure config transitions.
 *
 * Hints and hiding places start empty on purpose: the spec forbids inventing a
 * location. The child flow warns the adult when a day has no hint configured
 * instead of showing placeholder text to the child.
 *
 * Every update returns a new `AppConfig`; the UI persists the whole state, so a
 * failed save is reported instead of being silently swallowed.
 */
import {
  MISSION_DAYS,
  type AppConfig,
  type DaySettings,
  type MissionDay,
  type MissionHints,
  type PinRecord,
} from './types'

export interface DaySettingsPatch {
  readonly hidingSpot?: string | null
  readonly hints?: Partial<MissionHints>
  readonly manuallyUnlocked?: boolean
}

export function createDefaultDaySettings(): DaySettings {
  return {
    hidingSpot: null,
    hints: { main: null, location: null },
    manuallyUnlocked: false,
  }
}

export function createDefaultConfig(): AppConfig {
  const days = {} as Record<MissionDay, DaySettings>

  for (const day of MISSION_DAYS) {
    days[day] = createDefaultDaySettings()
  }

  return {
    parental: { pin: null, cameraEnabled: true },
    days,
  }
}

/** Applies a partial patch to one day and keeps the untouched fields intact. */
export function updateDaySettings(
  config: AppConfig,
  day: MissionDay,
  patch: DaySettingsPatch,
): AppConfig {
  const current = config.days[day]

  return {
    ...config,
    days: {
      ...config.days,
      [day]: {
        hidingSpot: patch.hidingSpot !== undefined ? patch.hidingSpot : current.hidingSpot,
        hints: {
          main: patch.hints?.main !== undefined ? patch.hints.main : current.hints.main,
          location:
            patch.hints?.location !== undefined
              ? patch.hints.location
              : current.hints.location,
        },
        manuallyUnlocked:
          patch.manuallyUnlocked !== undefined
            ? patch.manuallyUnlocked
            : current.manuallyUnlocked,
      },
    },
  }
}

export function setParentalPin(config: AppConfig, pin: PinRecord | null): AppConfig {
  return { ...config, parental: { ...config.parental, pin } }
}

/**
 * Enables or disables the optional camera and recording surfaces. The switch is
 * local and does not grant any permission by itself; it only prevents the app
 * from asking for one when turned off.
 */
export function setCameraEnabled(config: AppConfig, enabled: boolean): AppConfig {
  return { ...config, parental: { ...config.parental, cameraEnabled: enabled } }
}
