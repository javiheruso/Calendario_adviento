/**
 * Day 1 elf dance rules.
 *
 * The approved choreography runs after a short countdown and issues a cue at
 * 04/08/12/16/20/24/28/32/36/40/44/48 seconds. The approved 32→36 gap is the
 * musical pause: the statue cue stays active for four seconds and no new cue is
 * issued until 36. A short celebration follows the final 48-second pose, then
 * the sequence can complete.
 *
 * The timeline is pure and deterministic. It never requests camera, microphone
 * or audio files, so the mission is playable with provisional artwork only.
 */

export type DanceMove =
  | 'jump'
  | 'turn'
  | 'crouch'
  | 'clap'
  | 'wiggle'
  | 'statue'
  | 'pose'

export type DanceCueKind = 'move' | 'statue' | 'pose'

export interface DanceCue {
  readonly id: string
  readonly atSeconds: number
  readonly label: string
  readonly move: DanceMove
  readonly kind: DanceCueKind
}

export const DANCE_COUNTDOWN_SECONDS = 3
export const DANCE_MUSIC_END_SECONDS = 48
export const DANCE_CELEBRATION_SECONDS = 4
export const DANCE_STATUE_HOLD_SECONDS = 4
export const DANCE_TOTAL_SECONDS =
  DANCE_COUNTDOWN_SECONDS + DANCE_MUSIC_END_SECONDS + DANCE_CELEBRATION_SECONDS

/** The approved choreography, exactly in specification order. */
export const DANCE_CUES: readonly DanceCue[] = [
  { id: 'jump', atSeconds: 4, label: '¡Salta!', move: 'jump', kind: 'move' },
  { id: 'turn', atSeconds: 8, label: '¡Vuelta!', move: 'turn', kind: 'move' },
  { id: 'crouch', atSeconds: 12, label: '¡Agáchate!', move: 'crouch', kind: 'move' },
  { id: 'turn-again', atSeconds: 16, label: '¡Vuelta!', move: 'turn', kind: 'move' },
  { id: 'clap', atSeconds: 20, label: '¡Palmas!', move: 'clap', kind: 'move' },
  { id: 'jump-twice', atSeconds: 24, label: '¡Salta, salta!', move: 'jump', kind: 'move' },
  { id: 'wiggle', atSeconds: 28, label: '¡Mueve el culete!', move: 'wiggle', kind: 'move' },
  { id: 'statue', atSeconds: 32, label: '¡Estatua!', move: 'statue', kind: 'statue' },
  { id: 'dance-again', atSeconds: 36, label: '¡Sigue bailando!', move: 'wiggle', kind: 'move' },
  { id: 'turn-last', atSeconds: 40, label: '¡Vuelta!', move: 'turn', kind: 'move' },
  { id: 'clap-last', atSeconds: 44, label: '¡Palmas!', move: 'clap', kind: 'move' },
  { id: 'pose', atSeconds: 48, label: '¡Pose de duende!', move: 'pose', kind: 'pose' },
]

export interface DanceState {
  readonly started: boolean
  /** Seconds since the start button, including the countdown. */
  readonly elapsedSeconds: number
}

export type DancePhase =
  | 'ready'
  | 'countdown'
  | 'dancing'
  | 'celebrating'
  | 'complete'

export interface DanceSnapshot {
  readonly phase: DancePhase
  /** 3, 2 or 1 during the countdown; null outside it. */
  readonly countdown: number | null
  /** Seconds since the music started, clamped to the approved cue window. */
  readonly musicSeconds: number
  readonly activeCue: DanceCue | null
  readonly statue: boolean
  readonly complete: boolean
  readonly progress: number
}

export function createDanceState(): DanceState {
  return { started: false, elapsedSeconds: 0 }
}

/** Starts the countdown once; repeated starts never reset the timeline. */
export function startDance(state: DanceState): DanceState {
  if (state.started) {
    return state
  }

  return { started: true, elapsedSeconds: 0 }
}

export function restartDance(): DanceState {
  return { started: true, elapsedSeconds: 0 }
}

/**
 * Advances the timeline. Before the start button, invalid deltas or reaching
 * the end are no-ops. The total duration includes countdown, music and the
 * final celebration.
 */
export function advanceDance(state: DanceState, deltaSeconds: number): DanceState {
  if (!state.started || !Number.isFinite(deltaSeconds) || deltaSeconds <= 0) {
    return state
  }

  const next = Math.min(DANCE_TOTAL_SECONDS, state.elapsedSeconds + deltaSeconds)

  if (next === state.elapsedSeconds) {
    return state
  }

  return { ...state, elapsedSeconds: next }
}

export function danceMusicSeconds(state: DanceState): number {
  if (!state.started) {
    return 0
  }

  return Math.max(
    0,
    Math.min(DANCE_MUSIC_END_SECONDS, state.elapsedSeconds - DANCE_COUNTDOWN_SECONDS),
  )
}

export function danceCountdownValue(state: DanceState): number | null {
  if (!state.started) {
    return null
  }

  const remaining = DANCE_COUNTDOWN_SECONDS - state.elapsedSeconds

  if (remaining <= 0) {
    return null
  }

  return Math.min(DANCE_COUNTDOWN_SECONDS, Math.max(1, Math.ceil(remaining)))
}

export function dancePhase(state: DanceState): DancePhase {
  if (!state.started) {
    return 'ready'
  }

  if (state.elapsedSeconds < DANCE_COUNTDOWN_SECONDS) {
    return 'countdown'
  }

  // Use the unclamped elapsed time here: the cue window stops at 48 s, but the
  // celebration and completion windows continue past it.
  const musicElapsed = state.elapsedSeconds - DANCE_COUNTDOWN_SECONDS

  if (musicElapsed < DANCE_MUSIC_END_SECONDS) {
    return 'dancing'
  }

  if (musicElapsed < DANCE_MUSIC_END_SECONDS + DANCE_CELEBRATION_SECONDS) {
    return 'celebrating'
  }

  return 'complete'
}

/** Latest cue whose approved time has been reached. */
export function activeDanceCue(state: DanceState): DanceCue | null {
  if (!state.started) {
    return null
  }

  const music = danceMusicSeconds(state)
  let active: DanceCue | null = null

  for (const cue of DANCE_CUES) {
    if (cue.atSeconds > music) {
      break
    }

    active = cue
  }

  return active
}

/** The statue cue owns the approved 32→36 musical pause. */
export function isStatuePause(state: DanceState): boolean {
  return activeDanceCue(state)?.kind === 'statue'
}

export function isDanceComplete(state: DanceState): boolean {
  return dancePhase(state) === 'complete'
}

/** Fraction of the whole countdown + choreography + celebration timeline. */
export function danceProgress(state: DanceState): number {
  return Math.min(1, Math.max(0, state.elapsedSeconds / DANCE_TOTAL_SECONDS))
}

export function danceSnapshot(state: DanceState): DanceSnapshot {
  return {
    phase: dancePhase(state),
    countdown: danceCountdownValue(state),
    musicSeconds: danceMusicSeconds(state),
    activeCue: activeDanceCue(state),
    statue: isStatuePause(state),
    complete: isDanceComplete(state),
    progress: danceProgress(state),
  }
}
