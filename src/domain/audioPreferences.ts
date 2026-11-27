/**
 * Audio preferences and pure mixing rules.
 *
 * Preferences are local to the device. Music, voice and effects can be toggled
 * independently, one master volume applies to all of them, and a single `muted`
 * flag backs the child-facing silence control.
 *
 * `resolveAudioMix` is the single source of truth for gain values. The manager
 * applies its result to three channel gain nodes, so muting, channel toggles,
 * volume changes and voice ducking cannot drift apart.
 */

export interface AudioPreferences {
  /** Master silence control. */
  readonly muted: boolean
  readonly music: boolean
  readonly voice: boolean
  readonly effects: boolean
  /** Master volume from 0 to 1. */
  readonly volume: number
}

/** Music drops to this fraction of its normal gain while a voice is audible. */
export const MUSIC_DUCKING_GAIN = 0.25

export const DEFAULT_AUDIO_PREFERENCES: AudioPreferences = {
  muted: false,
  music: true,
  voice: true,
  effects: true,
  volume: 0.7,
}

export interface AudioMix {
  readonly music: number
  readonly voice: number
  readonly effects: number
}

export interface AudioMixOptions {
  readonly voiceActive?: boolean
}

export type AudioCapability = 'ready' | 'needs-gesture' | 'unsupported'

export interface AudioCapabilityProbe {
  readonly hasAudioContext: boolean
  readonly hasUserActivation: boolean
  /** A context that is already running does not need a new gesture. */
  readonly contextRunning?: boolean
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function booleanOr(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback
}

/** Keeps a volume finite and inside 0–1, rounded to two decimals. */
export function clampAudioVolume(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return DEFAULT_AUDIO_PREFERENCES.volume
  }

  const clamped = Math.min(1, Math.max(0, value))
  return Math.round(clamped * 100) / 100
}

/**
 * Loads a value from storage defensively. Anything missing or malformed falls
 * back to the default, so a corrupt snapshot can never silence a channel by
 * accident or produce an out-of-range gain.
 */
export function normalizeAudioPreferences(value: unknown): AudioPreferences {
  if (!isRecord(value)) {
    return { ...DEFAULT_AUDIO_PREFERENCES }
  }

  return {
    muted: booleanOr(value.muted, DEFAULT_AUDIO_PREFERENCES.muted),
    music: booleanOr(value.music, DEFAULT_AUDIO_PREFERENCES.music),
    voice: booleanOr(value.voice, DEFAULT_AUDIO_PREFERENCES.voice),
    effects: booleanOr(value.effects, DEFAULT_AUDIO_PREFERENCES.effects),
    volume: clampAudioVolume(value.volume),
  }
}

/**
 * Resolves the gain for each channel. Music is ducked only when a voice is
 * actually audible: a disabled voice channel or a muted master volume must not
 * lower the music for a locution nobody can hear.
 */
export function resolveAudioMix(
  preferences: AudioPreferences,
  options: AudioMixOptions = {},
): AudioMix {
  const volume = preferences.muted ? 0 : clampAudioVolume(preferences.volume)
  const voiceAudible = preferences.voice && !preferences.muted && options.voiceActive === true
  const musicGain = preferences.music
    ? volume * (voiceAudible ? MUSIC_DUCKING_GAIN : 1)
    : 0

  return {
    music: musicGain,
    voice: preferences.voice ? volume : 0,
    effects: preferences.effects ? volume : 0,
  }
}

/**
 * Decides whether audio can start. Without an `AudioContext` nothing can play;
 * without a prior user activation the browser may keep the context suspended.
 * A context that is already running is ready regardless of activation.
 */
export function resolveAudioCapability(probe: AudioCapabilityProbe): AudioCapability {
  if (!probe.hasAudioContext) {
    return 'unsupported'
  }

  if (probe.contextRunning === true || probe.hasUserActivation) {
    return 'ready'
  }

  return 'needs-gesture'
}
