import { useEffect, useState } from 'react'
import { getAsset, type AssetId } from '../../domain/assets'
import {
  DANCE_CUES,
  DANCE_MUSIC_END_SECONDS,
  DANCE_TOTAL_SECONDS,
  advanceDance,
  createDanceState,
  danceSnapshot,
  isDanceComplete,
  restartDance,
  startDance,
  type DanceMove,
} from '../../domain/games/dance'
import { AssetGlyph } from '../AssetGlyph'
import { CountdownAnnouncer } from '../CountdownAnnouncer'
import type { MissionGameProps } from './types'

const MOVE_ASSETS: Readonly<Record<DanceMove, AssetId>> = {
  jump: 'game.dance.jump',
  turn: 'game.dance.turn',
  crouch: 'game.dance.crouch',
  clap: 'game.dance.clap',
  wiggle: 'game.dance.wiggle',
  statue: 'game.dance.statue',
  pose: 'game.dance.pose',
}

const TICK_SECONDS = 0.2
const TICK_MS = TICK_SECONDS * 1000
const DANCE_ANNOUNCEMENT_MILESTONES = [30, 10] as const

function nextCueAfter(musicSeconds: number) {
  return DANCE_CUES.find((cue) => cue.atSeconds > musicSeconds) ?? null
}

/**
 * Day 1: follow the approved one-minute choreography with a countdown, the
 * statue pause and a celebratory ending. Cues are visual and silent, so no
 * camera, microphone or final audio is needed. The child may restart or repeat
 * the dance at any time.
 */
export function DanceGame({ onComplete }: MissionGameProps) {
  const [state, setState] = useState(createDanceState)
  const snapshot = danceSnapshot(state)
  const complete = isDanceComplete(state)
  const activeCue = snapshot.activeCue
  const nextCue = nextCueAfter(snapshot.musicSeconds)

  useEffect(() => {
    if (!state.started || complete) {
      return
    }

    const timer = window.setInterval(() => {
      setState((current) => advanceDance(current, TICK_SECONDS))
    }, TICK_MS)

    return () => window.clearInterval(timer)
  }, [state.started, complete])

  return (
    <div className="game game--dance">
      <p className="game__lead">
        Trasto ha preparado un baile de un minuto. Primero hay una cuenta atrás y
        después cada paso aparece en pantalla. En ¡Estatua! hay una pausa musical
        para quedarse quieta. No hace falta cámara ni micrófono: solo bailar y
        divertirse.
      </p>

      <progress
        className="dance-progress"
        max={1}
        value={snapshot.progress}
        aria-label="Progreso del baile"
      />

      <CountdownAnnouncer
        seconds={Math.max(0, DANCE_MUSIC_END_SECONDS - snapshot.musicSeconds)}
        label="Baile"
        milestones={DANCE_ANNOUNCEMENT_MILESTONES}
      />

      <p className="game__status">
        {snapshot.phase === 'ready'
          ? 'Todo listo para bailar'
          : snapshot.phase === 'countdown'
            ? 'Cuenta atrás'
            : snapshot.phase === 'complete'
              ? '¡Baile terminado!'
              : `Música: ${Math.floor(snapshot.musicSeconds)} s de ${DANCE_MUSIC_END_SECONDS} s`}
      </p>

      {snapshot.phase === 'ready' ? (
        <section className="dance-stage" aria-label="Baile del duende">
          <p className="dance-stage__glyph" aria-hidden="true">
            <AssetGlyph asset={getAsset('game.dance.celebrate')} label={false} />
          </p>
          <p className="dance-stage__note">
            Cuando pulses empezar, cuenta 3, 2, 1 y sigue los pasos. Puedes repetir
            el baile las veces que quieras.
          </p>
        </section>
      ) : null}

      {snapshot.phase === 'countdown' ? (
        <section className="dance-stage" aria-label="Cuenta atrás del baile">
          <p className="dance-countdown" role="status">
            {snapshot.countdown}
          </p>
          <p className="dance-stage__note">Prepárate para mover el esqueleto…</p>
        </section>
      ) : null}

      {snapshot.phase !== 'ready' && snapshot.phase !== 'countdown' ? (
        <section
          className={`dance-cue${snapshot.statue ? ' dance-cue--statue' : ''}${
            activeCue?.kind === 'pose' ? ' dance-cue--pose' : ''
          }`}
          aria-live="polite"
          aria-label="Paso actual"
        >
          <p className="dance-cue__glyph" aria-hidden="true">
            <AssetGlyph
              asset={getAsset(
                activeCue ? MOVE_ASSETS[activeCue.move] : 'game.dance.celebrate',
              )}
              label={false}
            />
          </p>
          <p className="dance-cue__label">
            {activeCue?.label ?? '¡A bailar!'}
          </p>
          {snapshot.statue ? (
            <p className="dance-cue__hint">
              Pausa musical: quieta como una estatua hasta que Trasto diga «¡Sigue
              bailando!».
            </p>
          ) : null}
          {activeCue?.kind === 'pose' ? (
            <p className="dance-cue__hint">
              ¡Fanfarria final! Mantén la pose de duende para terminar el baile.
            </p>
          ) : null}
        </section>
      ) : null}

      {snapshot.phase === 'dancing' && nextCue ? (
        <p className="dance-next">
          Siguiente paso: <strong>{nextCue.label}</strong> en{' '}
          {Math.max(0, nextCue.atSeconds - snapshot.musicSeconds).toFixed(0)} s
        </p>
      ) : null}

      {snapshot.phase === 'celebrating' ? (
        <p className="dance-celebration" role="status">
          <span aria-hidden="true">
            <AssetGlyph asset={getAsset('game.dance.celebrate')} label={false} />
          </span>{' '}
          ¡Bravo! El baile ha terminado; ahora la celebración final.
        </p>
      ) : null}

      <div className="game__actions">
        {snapshot.phase === 'ready' ? (
          <button
            type="button"
            className="button button--primary"
            onClick={() => setState((current) => startDance(current))}
          >
            Empezar el baile
          </button>
        ) : null}

        {state.started && !complete ? (
          <button
            type="button"
            className="button button--secondary"
            onClick={() => setState(restartDance())}
          >
            Reiniciar baile
          </button>
        ) : null}

        {complete ? (
          <button
            type="button"
            className="button button--secondary"
            onClick={() => setState(restartDance())}
          >
            Repetir baile
          </button>
        ) : null}
      </div>

      {complete ? (
        <div className="game__complete" role="status">
          <p>
            <strong>¡Coreografía completada!</strong> Has seguido los doce pasos,
            aguantado la estatua y terminado con la pose de duende.
          </p>
          <p className="dance-stage__note">
            Duración total: {DANCE_TOTAL_SECONDS} s, incluida la cuenta atrás y la
            celebración. No se ha grabado nada: la cámara y el micrófono no se usan
            en esta versión.
          </p>
          <button type="button" className="button button--primary" onClick={onComplete}>
            Continuar
          </button>
        </div>
      ) : null}
    </div>
  )
}
