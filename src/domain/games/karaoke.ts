/**
 * Day 7 silly carol rules.
 *
 * The approved mission is a 60–90 second karaoke: six vocal-style orders
 * (robot, mouse, giant, sleepy, laugh, pop star) and a synchronized provisional
 * lyric. Finishing the song completes the mission; there is no score, timer
 * penalty or failed attempt.
 *
 * This module is intentionally pure: it does not touch the camera, microphone,
 * `MediaRecorder` or any audio file. Recording is an optional UI concern built
 * on top of `karaokeRecording.ts`.
 */

export type KaraokeStyleId =
  | 'robot'
  | 'mouse'
  | 'giant'
  | 'sleepy'
  | 'laugh'
  | 'pop-star'

export interface KaraokeStyle {
  readonly id: KaraokeStyleId
  readonly label: string
  /** Short child-facing instruction shown while the style is active. */
  readonly instruction: string
}

export const KARAOKE_COUNTDOWN_SECONDS = 3
export const KARAOKE_SONG_SECONDS = 72
export const KARAOKE_LINE_SECONDS = 6
export const KARAOKE_STYLE_SECONDS = 12
export const KARAOKE_TOTAL_SECONDS =
  KARAOKE_COUNTDOWN_SECONDS + KARAOKE_SONG_SECONDS

/**
 * Authorized-content seam for day 7.
 *
 * No final lyric or music is shipped or invented here. When the family approves
 * a carol, only this configuration changes: an authorized lyric source, an
 * instrumental/vocal-guide path under `public/` and the approved timing. The
 * game UI, six styles and optional recording keep working unchanged.
 */
export interface KaraokeContentConfig {
  readonly authorized: boolean
  readonly lyricSource: 'provisional' | 'authorized'
  /** Public-relative path to the authorized instrumental track, if any. */
  readonly instrumentalPath: string | null
  /** Public-relative path to a guide vocal or reference recording, if any. */
  readonly guideVocalPath: string | null
  readonly countdownSeconds: number
  readonly songSeconds: number
  readonly styleSeconds: number
  readonly lineSeconds: number
}

export const KARAOKE_CONTENT_CONFIG: KaraokeContentConfig = {
  authorized: false,
  lyricSource: 'provisional',
  instrumentalPath: null,
  guideVocalPath: null,
  countdownSeconds: KARAOKE_COUNTDOWN_SECONDS,
  songSeconds: KARAOKE_SONG_SECONDS,
  styleSeconds: KARAOKE_STYLE_SECONDS,
  lineSeconds: KARAOKE_LINE_SECONDS,
}

/** Approved style order from the mission specification. */
export const KARAOKE_STYLES: readonly KaraokeStyle[] = [
  {
    id: 'robot',
    label: 'Robot',
    instruction: 'Voz metálica y movimientos de hojalata: ¡bip, bop, bip!',
  },
  {
    id: 'mouse',
    label: 'Ratón',
    instruction: 'Voz muy aguda y rapidita, con orejas de ratón.',
  },
  {
    id: 'giant',
    label: 'Gigante',
    instruction: 'Voz grave y lenta, como un gigante muy grandote.',
  },
  {
    id: 'sleepy',
    label: 'Dormilón',
    instruction: 'Canta con voz de dormilón y algún bostezo exagerado.',
  },
  {
    id: 'laugh',
    label: 'Risa',
    instruction: 'Canta entre carcajadas: ¡ja, ja, ja, lara lara!',
  },
  {
    id: 'pop-star',
    label: 'Estrella del pop',
    instruction: 'Mucho brillo, micrófono imaginario y pose de estrella.',
  },
]

export interface KaraokeLine {
  readonly id: string
  readonly startSeconds: number
  readonly endSeconds: number
  readonly text: string
  readonly style: KaraokeStyleId
}

/**
 * Provisional lyric. It is deliberately silly and short; the final authorized
 * carol and its instrumental base are pending assets.
 */
const PROVISIONAL_LYRICS: readonly {
  readonly text: string
  readonly style: KaraokeStyleId
}[] = [
  { text: 'En el Polo Norte hay un taller', style: 'robot' },
  { text: 'donde Trasto baila sin parar.', style: 'robot' },
  { text: 'Un reno muy chico come turrón', style: 'mouse' },
  { text: 'y un muñeco de nieve pide canción.', style: 'mouse' },
  { text: '¡Bip, bop! La campana dice ¡hola!', style: 'giant' },
  { text: 'Los calcetines cantan a la cola.', style: 'giant' },
  { text: 'Un regalo salta como un saltamontes', style: 'sleepy' },
  { text: 'y la estrella brilla en los rincones.', style: 'sleepy' },
  { text: '¡Ja, ja, ja! Se ríe el villancico', style: 'laugh' },
  { text: 'con un gigante un poco despistado.', style: 'laugh' },
  { text: 'Duerme la luna, bosteza el trineo,', style: 'pop-star' },
  { text: '¡Lara lara! ¡Qué disparate tan bonito!', style: 'pop-star' },
]

export const KARAOKE_LINES: readonly KaraokeLine[] = PROVISIONAL_LYRICS.map(
  (line, index) => ({
    id: `karaoke-line-${index + 1}`,
    startSeconds: index * KARAOKE_LINE_SECONDS,
    endSeconds: (index + 1) * KARAOKE_LINE_SECONDS,
    text: line.text,
    style: line.style,
  }),
)

export interface KaraokeState {
  readonly started: boolean
  /** Seconds since the start button, including the short countdown. */
  readonly elapsedSeconds: number
}

export type KaraokePhase = 'ready' | 'countdown' | 'singing' | 'complete'

export interface KaraokeSnapshot {
  readonly phase: KaraokePhase
  /** 3, 2 or 1 during the countdown; null outside it. */
  readonly countdown: number | null
  /** Seconds since the song began, clamped to 0…72. */
  readonly songSeconds: number
  readonly activeLine: KaraokeLine | null
  readonly nextLine: KaraokeLine | null
  readonly style: KaraokeStyle | null
  readonly complete: boolean
  readonly progress: number
}

export function createKaraokeState(): KaraokeState {
  return { started: false, elapsedSeconds: 0 }
}

/** Starts the countdown once; starting twice never rewinds the song. */
export function startKaraoke(state: KaraokeState): KaraokeState {
  if (state.started) {
    return state
  }

  return { started: true, elapsedSeconds: 0 }
}

/** Returns to the ready screen for another performance. */
export function resetKaraoke(): KaraokeState {
  return createKaraokeState()
}

/**
 * Advances the timeline. Before the start button, invalid deltas or reaching
 * the end are no-ops, so completion can never be skipped or duplicated.
 */
export function advanceKaraoke(state: KaraokeState, deltaSeconds: number): KaraokeState {
  if (!state.started || !Number.isFinite(deltaSeconds) || deltaSeconds <= 0) {
    return state
  }

  const next = Math.min(KARAOKE_TOTAL_SECONDS, state.elapsedSeconds + deltaSeconds)

  if (next === state.elapsedSeconds) {
    return state
  }

  return { ...state, elapsedSeconds: next }
}

export function karaokeSongSeconds(state: KaraokeState): number {
  if (!state.started) {
    return 0
  }

  return Math.max(
    0,
    Math.min(KARAOKE_SONG_SECONDS, state.elapsedSeconds - KARAOKE_COUNTDOWN_SECONDS),
  )
}

export function karaokeCountdownValue(state: KaraokeState): number | null {
  if (!state.started) {
    return null
  }

  const remaining = KARAOKE_COUNTDOWN_SECONDS - state.elapsedSeconds

  if (remaining <= 0) {
    return null
  }

  return Math.min(KARAOKE_COUNTDOWN_SECONDS, Math.max(1, Math.ceil(remaining)))
}

export function karaokePhase(state: KaraokeState): KaraokePhase {
  if (!state.started) {
    return 'ready'
  }

  if (state.elapsedSeconds < KARAOKE_COUNTDOWN_SECONDS) {
    return 'countdown'
  }

  if (state.elapsedSeconds < KARAOKE_TOTAL_SECONDS) {
    return 'singing'
  }

  return 'complete'
}

function lineAtSongSeconds(songSeconds: number): KaraokeLine | null {
  return (
    KARAOKE_LINES.find(
      (line) => songSeconds >= line.startSeconds && songSeconds < line.endSeconds,
    ) ?? null
  )
}

/** Current lyric only while the song is actually playing. */
export function activeKaraokeLine(state: KaraokeState): KaraokeLine | null {
  if (karaokePhase(state) !== 'singing') {
    return null
  }

  return lineAtSongSeconds(karaokeSongSeconds(state))
}

export function nextKaraokeLine(state: KaraokeState): KaraokeLine | null {
  const active = activeKaraokeLine(state)

  if (!active) {
    return null
  }

  const index = KARAOKE_LINES.findIndex((line) => line.id === active.id)

  return KARAOKE_LINES[index + 1] ?? null
}

/** Style shown only while the song is playing; null on ready/countdown/complete. */
export function activeKaraokeStyle(state: KaraokeState): KaraokeStyle | null {
  if (karaokePhase(state) !== 'singing') {
    return null
  }

  const songSeconds = karaokeSongSeconds(state)
  const index = Math.min(
    KARAOKE_STYLES.length - 1,
    Math.floor(songSeconds / KARAOKE_STYLE_SECONDS),
  )

  return KARAOKE_STYLES[index] ?? null
}

export function isKaraokeComplete(state: KaraokeState): boolean {
  return karaokePhase(state) === 'complete'
}

/** Fraction of the countdown + song timeline. */
export function karaokeProgress(state: KaraokeState): number {
  return Math.min(1, Math.max(0, state.elapsedSeconds / KARAOKE_TOTAL_SECONDS))
}

export function karaokeSnapshot(state: KaraokeState): KaraokeSnapshot {
  return {
    phase: karaokePhase(state),
    countdown: karaokeCountdownValue(state),
    songSeconds: karaokeSongSeconds(state),
    activeLine: activeKaraokeLine(state),
    nextLine: nextKaraokeLine(state),
    style: activeKaraokeStyle(state),
    complete: isKaraokeComplete(state),
    progress: karaokeProgress(state),
  }
}
