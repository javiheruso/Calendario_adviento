/**
 * Single source of truth for music, voice and sound effects.
 *
 * Every entry ships as provisional on purpose. Music and effects use short
 * synthesized tones so the wiring can be validated without third-party audio;
 * voice entries stay silent placeholders until a recorded, licensed narration
 * exists. When final assets arrive, replace an entry with `kind: 'file'` and a
 * `public/`-relative `src`; components never build audio paths themselves.
 *
 * The catalog is pure data. It has no Web Audio, DOM or Vite dependency, so the
 * Node test suite can validate it directly.
 */

export type AudioChannel = 'music' | 'voice' | 'effects'

export interface AudioTone {
  /** Frequency in hertz. */
  readonly frequency: number
  /** Duration in seconds. */
  readonly duration: number
  readonly wave?: 'sine' | 'square' | 'triangle' | 'sawtooth'
  /** Peak gain relative to the channel, from 0 to 1. */
  readonly gain?: number
  /** Delay from the clip start in seconds. */
  readonly start?: number
}

export interface ToneAudioEntry {
  readonly kind: 'tones'
  readonly channel: AudioChannel
  readonly provisional: true
  readonly label: string
  readonly tones: readonly AudioTone[]
  /** Music only: replay the whole pattern every N seconds until stopped. */
  readonly loopSeconds?: number
}

export interface FileAudioEntry {
  readonly kind: 'file'
  readonly channel: AudioChannel
  readonly provisional: boolean
  readonly label: string
  /** Path relative to `public/`, for example `assets/audio/final/ambient.mp3`. */
  readonly src: string
}

export interface SilentAudioEntry {
  readonly kind: 'silent'
  readonly channel: AudioChannel
  readonly provisional: true
  readonly label: string
  /** Why this entry is silent and what the UI keeps instead. */
  readonly note: string
}

export type AudioEntry = ToneAudioEntry | FileAudioEntry | SilentAudioEntry

const C4 = 261.63
const D4 = 293.66
const E4 = 329.63
const F4 = 349.23
const G4 = 392.0
const C5 = 523.25
const E5 = 659.25
const G5 = 783.99
const C6 = 1046.5

export const AUDIO_CATALOG = {
  'music.ambient': {
    kind: 'tones',
    channel: 'music',
    provisional: true,
    label: 'Workshop ambience loop (provisional synth)',
    loopSeconds: 8,
    tones: [
      { frequency: C4, duration: 1.1, wave: 'sine', gain: 0.14, start: 0 },
      { frequency: E4, duration: 1.1, wave: 'sine', gain: 0.1, start: 1.2 },
      { frequency: G4, duration: 1.4, wave: 'sine', gain: 0.1, start: 2.4 },
      { frequency: E4, duration: 1.1, wave: 'sine', gain: 0.08, start: 4.1 },
      { frequency: G4, duration: 0.9, wave: 'sine', gain: 0.08, start: 5.4 },
      { frequency: C5, duration: 1.6, wave: 'sine', gain: 0.06, start: 6.4 },
    ],
  },
  'music.celebration': {
    kind: 'tones',
    channel: 'music',
    provisional: true,
    label: 'Celebration arpeggio (provisional synth)',
    tones: [
      { frequency: C5, duration: 0.28, wave: 'triangle', gain: 0.24, start: 0 },
      { frequency: E5, duration: 0.28, wave: 'triangle', gain: 0.24, start: 0.18 },
      { frequency: G5, duration: 0.32, wave: 'triangle', gain: 0.24, start: 0.36 },
      { frequency: C6, duration: 0.6, wave: 'triangle', gain: 0.2, start: 0.58 },
    ],
  },

  'voice.trasto.welcome': {
    kind: 'silent',
    channel: 'voice',
    provisional: true,
    label: 'Trasto welcome narration placeholder',
    note: 'Recorded narration is pending. The equivalent text stays visible on screen.',
  },
  'voice.trasto.celebrate': {
    kind: 'silent',
    channel: 'voice',
    provisional: true,
    label: 'Trasto celebration narration placeholder',
    note: 'Recorded narration is pending. The equivalent text stays visible on screen.',
  },

  'effect.bell.do': {
    kind: 'tones',
    channel: 'effects',
    provisional: true,
    label: 'Bell Do (provisional synth)',
    tones: [{ frequency: C4, duration: 0.34, wave: 'sine', gain: 0.5 }],
  },
  'effect.bell.re': {
    kind: 'tones',
    channel: 'effects',
    provisional: true,
    label: 'Bell Re (provisional synth)',
    tones: [{ frequency: D4, duration: 0.34, wave: 'sine', gain: 0.5 }],
  },
  'effect.bell.mi': {
    kind: 'tones',
    channel: 'effects',
    provisional: true,
    label: 'Bell Mi (provisional synth)',
    tones: [{ frequency: E4, duration: 0.34, wave: 'sine', gain: 0.5 }],
  },
  'effect.bell.fa': {
    kind: 'tones',
    channel: 'effects',
    provisional: true,
    label: 'Bell Fa (provisional synth)',
    tones: [{ frequency: F4, duration: 0.34, wave: 'sine', gain: 0.5 }],
  },
  'effect.ui.tap': {
    kind: 'tones',
    channel: 'effects',
    provisional: true,
    label: 'Soft interface tap (provisional synth)',
    tones: [{ frequency: G5, duration: 0.07, wave: 'triangle', gain: 0.16 }],
  },
  'effect.success': {
    kind: 'tones',
    channel: 'effects',
    provisional: true,
    label: 'Success chime (provisional synth)',
    tones: [
      { frequency: C5, duration: 0.2, wave: 'triangle', gain: 0.26, start: 0 },
      { frequency: E5, duration: 0.2, wave: 'triangle', gain: 0.26, start: 0.14 },
      { frequency: G5, duration: 0.4, wave: 'triangle', gain: 0.22, start: 0.28 },
    ],
  },
  'effect.celebration': {
    kind: 'tones',
    channel: 'effects',
    provisional: true,
    label: 'Star celebration fanfare (provisional synth)',
    tones: [
      { frequency: G4, duration: 0.18, wave: 'triangle', gain: 0.24, start: 0 },
      { frequency: C5, duration: 0.18, wave: 'triangle', gain: 0.24, start: 0.12 },
      { frequency: E5, duration: 0.18, wave: 'triangle', gain: 0.24, start: 0.24 },
      { frequency: G5, duration: 0.18, wave: 'triangle', gain: 0.24, start: 0.36 },
      { frequency: C6, duration: 0.55, wave: 'triangle', gain: 0.2, start: 0.5 },
    ],
  },
} as const satisfies Record<string, AudioEntry>

export type AudioId = keyof typeof AUDIO_CATALOG

export function getAudio<K extends AudioId>(id: K): (typeof AUDIO_CATALOG)[K] {
  return AUDIO_CATALOG[id]
}

export function isAudioId(value: string): value is AudioId {
  return value in AUDIO_CATALOG
}
