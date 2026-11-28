import { useEffect, useRef, useState } from 'react'
import type { AlbumSaveOutcome, SaveRecordingToAlbumInput } from '../domain/album'
import { getAsset } from '../domain/assets'
import { resolveMissionAvailability } from '../domain/missions'
import {
  REWARD_RETURN_DELAY_MS,
  shouldReturnToCalendar,
} from '../domain/reward'
import type { HintKind } from '../domain/progress'
import type {
  AppConfig,
  MissionDay,
  MissionDefinition,
  ProgressState,
} from '../domain/types'
import { AssetGlyph } from './AssetGlyph'
import { MissionGameSlot } from './MissionGameSlot'

type MissionViewState = 'available' | 'mission-complete' | 'gift-found'

const STATE_LABELS: Record<MissionViewState, string> = {
  available: 'Misión pendiente',
  'mission-complete': 'Misión superada',
  'gift-found': 'Regalo encontrado',
}

interface MissionPanelProps {
  day: MissionDay
  mission: MissionDefinition
  progress: ProgressState
  config: AppConfig
  /** Authenticated adult demo or preview surface. */
  demoMode: boolean
  /**
   * Local parental switch. When false, games must not request camera or
   * microphone access.
   */
  cameraEnabled: boolean
  /**
   * Development-only flag. It is `false` in a production child bundle, so a
   * `planned` mission never simulates completion for the child.
   */
  developmentBuild: boolean
  /** Destination-aware label; preview returns to the adult panel. */
  backLabel?: string
  onBack: () => void
  onCompleteMission: () => void
  onRevealHint: (kind: HintKind) => void
  /** Returns whether the star was persisted before the celebration starts. */
  onConfirmGift: () => boolean
  /** Child-only automatic return to the calendar after a saved star. */
  onRewardReturn?: () => void
  onSaveRecording?: (
    input: SaveRecordingToAlbumInput,
  ) => Promise<AlbumSaveOutcome>
}

function MissingHintNotice({ day }: { day: MissionDay }) {
  return (
    <div className="notice notice--warning" role="status">
      <p>
        <strong>Falta configurar la pista del día {day}.</strong>
      </p>
      <p>
        Un adulto debe añadirla en el panel familiar. No se muestra ninguna ubicación
        inventada.
      </p>
    </div>
  )
}

export function MissionPanel({
  day,
  mission,
  progress,
  config,
  demoMode,
  cameraEnabled,
  developmentBuild,
  backLabel = 'Volver al calendario',
  onBack,
  onCompleteMission,
  onRevealHint,
  onConfirmGift,
  onRewardReturn,
  onSaveRecording,
}: MissionPanelProps) {
  const [repeatingDay, setRepeatingDay] = useState<MissionDay | null>(null)
  const [repeatFeedback, setRepeatFeedback] = useState<{
    day: MissionDay
    text: string
  } | null>(null)
  const [confirmingGift, setConfirmingGift] = useState(false)
  const [rewardPending, setRewardPending] = useState(false)
  const [rewardError, setRewardError] = useState<string | null>(null)
  const rewardReturnRef = useRef(onRewardReturn)

  useEffect(() => {
    rewardReturnRef.current = onRewardReturn
  }, [onRewardReturn])
  const dayProgress = progress.days[day]
  const missionCompleted = Boolean(dayProgress?.missionCompletedAt)
  const giftFound = Boolean(dayProgress?.giftFoundAt)
  const viewState: MissionViewState = giftFound
    ? 'gift-found'
    : missionCompleted
      ? 'mission-complete'
      : 'available'

  const hints = config.days[day].hints
  const mainHint = hints.main
  const locationHint = hints.location
  const mainHintRevealed = Boolean(dayProgress?.hintRevealedAt)
  const locationHintRevealed = Boolean(dayProgress?.locationHintRevealedAt)
  const availability = resolveMissionAvailability(mission, {
    demoMode,
    development: developmentBuild,
  })
  // Keyed by local day state, so a day change cannot keep a stale repeat mode.
  const repeating = repeatingDay === day
  const repeatNotice = repeatFeedback?.day === day ? repeatFeedback.text : null

  useEffect(() => {
    // `rewardPending` is only set after a successful save, so the saved flag
    // passed here is always true; the helper still keeps demo/preview isolated.
    if (!rewardPending || !shouldReturnToCalendar(true, demoMode)) {
      return
    }

    const timer = window.setTimeout(() => {
      rewardReturnRef.current?.()
    }, REWARD_RETURN_DELAY_MS)

    return () => window.clearTimeout(timer)
  }, [rewardPending, demoMode])

  function handleConfirmGift() {
    if (confirmingGift || rewardPending || giftFound) {
      return
    }

    setConfirmingGift(true)
    setRewardError(null)
    const saved = onConfirmGift()

    if (!saved) {
      setConfirmingGift(false)
      setRewardError(
        'No se pudo guardar la estrella en este dispositivo. Revisa el almacenamiento y vuelve a intentarlo.',
      )
      return
    }

    setRewardPending(true)
    setConfirmingGift(false)
  }

  function renderMissionContent(onGameComplete: () => void) {
    if (availability === 'game') {
      return (
        <MissionGameSlot
          mission={mission}
          cameraEnabled={cameraEnabled}
          onComplete={onGameComplete}
          onSaveRecording={onSaveRecording}
        />
      )
    }

    if (availability === 'demo-completion') {
      return (
        <div className="demo-panel">
          <p className="demo-panel__tag">{demoMode ? 'Vista adulta' : 'Desarrollo'}</p>
          <p>
            <strong>Finalización simulada del flujo.</strong>{' '}
            {demoMode
              ? 'Este progreso es una demostración adulta y no afecta al calendario infantil.'
              : 'Este control solo está disponible en desarrollo y no aparece en la compilación de producción.'}
          </p>
          <button type="button" className="button button--demo" onClick={onGameComplete}>
            Simular finalización de misión
          </button>
        </div>
      )
    }

    return (
      <div className="notice">
        <p>
          <strong>Esta misión todavía no está disponible en esta versión.</strong>
        </p>
        <p>
          Trasto está terminando el juego. La puerta quedará abierta cuando la misión
          esté lista.
        </p>
      </div>
    )
  }

  function handleRepeatComplete() {
    setRepeatingDay(null)
    setRepeatFeedback({
      day,
      text: 'Repetición completada. Tu estrella y tu progreso no han cambiado.',
    })
  }

  function handleStartRepeat() {
    setRepeatFeedback(null)
    setRepeatingDay(day)
  }

  function handleStopRepeat() {
    setRepeatingDay(null)
    setRepeatFeedback(null)
  }

  return (
    <section className="mission" aria-labelledby="mission-title">
      <button type="button" className="link-button" onClick={onBack}>
        <span aria-hidden="true">←</span> {backLabel}
      </button>

      <figure className="mission__banner">
        <AssetGlyph
          asset={getAsset('ui.frame.general')}
          label={false}
          className="mission__banner-image"
          priority
        />

        <div className="mission__banner-content">
          <span className="mission__icon" aria-hidden="true">
            <AssetGlyph asset={getAsset(mission.illustration)} label={false} />
          </span>
          <div className="mission__intro">
            <p className="mission__eyebrow">Día {day} de 24</p>
            <h2 id="mission-title" tabIndex={-1}>
              {mission.title}
            </h2>
            <p className="mission__narrative">
              Supera la misión y Trasto te dará la pista del regalo. Sin prisa.
            </p>
          </div>
        </div>

        <AssetGlyph
          asset={getAsset('brand.trasto.explains')}
          label={false}
          className="mission__narrative-art"
          priority
        />
      </figure>

      <div className="mission__meta">
        <p className={`badge badge--${viewState}`}>{STATE_LABELS[viewState]}</p>
        {repeating ? (
          <p className="badge badge--repeat">Repetición · no cambia tu estrella</p>
        ) : null}
      </div>

      {repeating ? (
        <section className="mission__stage" aria-labelledby="mission-stage-title">
          <h3 id="mission-stage-title">Repitiendo la misión</h3>

          <div className="notice notice--info" role="status">
            <p>
              <strong>Estás repitiendo una misión ya completada.</strong> No se añaden
              estrellas ni se modifica tu progreso.
            </p>
          </div>

          {renderMissionContent(handleRepeatComplete)}

          <button type="button" className="link-button" onClick={handleStopRepeat}>
            Volver a tu recompensa sin terminar la repetición
          </button>
        </section>
      ) : !missionCompleted ? (
        <section className="mission__stage" aria-labelledby="mission-stage-title">
          <h3 id="mission-stage-title">La misión</h3>

          {!mainHint ? <MissingHintNotice day={day} /> : null}

          {renderMissionContent(onCompleteMission)}
        </section>
      ) : (
        <section className="mission__stage" aria-labelledby="mission-stage-title">
          <h3 id="mission-stage-title">Tu recompensa</h3>

          {repeatNotice ? (
            <p className="notice notice--info" role="status">
              {repeatNotice}
            </p>
          ) : null}

          <div className="hint-block">
            <h4>Pista principal</h4>
            {mainHint ? (
              mainHintRevealed ? (
                <p className="hint-card">{mainHint}</p>
              ) : (
                <button
                  type="button"
                  className="button button--primary"
                  onClick={() => onRevealHint('main')}
                >
                  Ver la pista
                </button>
              )
            ) : (
              <MissingHintNotice day={day} />
            )}
          </div>

          {locationHint ? (
            <div className="hint-block">
              <h4>Ayuda de ubicación</h4>
              {locationHintRevealed ? (
                <p className="hint-card hint-card--secondary">{locationHint}</p>
              ) : (
                <button
                  type="button"
                  className="button button--secondary"
                  onClick={() => onRevealHint('location')}
                >
                  Necesito más ayuda
                </button>
              )}
            </div>
          ) : null}

          <div className="gift-block">
            {giftFound ? (
              <div
                className={`celebration${rewardPending ? ' celebration--pending' : ''}`}
                role="status"
              >
                <span className="celebration__icon" aria-hidden="true">
                  <AssetGlyph asset={getAsset('ui.star')} label={false} />
                </span>
                <span>
                  ¡Regalo encontrado! La estrella del día {day} ya es tuya.
                  {rewardPending
                    ? demoMode
                      ? ' Guardada solo en la vista de prueba: el progreso infantil no cambia.'
                      : ' Estrella guardada. Volviendo al árbol…'
                    : null}
                </span>
              </div>
            ) : (
              <>
                <p className="gift-block__note">
                  La estrella se guarda una sola vez por día.
                </p>
                <button
                  type="button"
                  className="button button--primary"
                  onClick={handleConfirmGift}
                  disabled={confirmingGift}
                  aria-busy={confirmingGift}
                >
                  Ya he encontrado el regalo
                </button>
              </>
            )}

            {rewardError ? (
              <p className="notice notice--warning" role="alert">
                {rewardError}
              </p>
            ) : null}
          </div>

          <div className="repeat-block">
            <p className="gift-block__note">
              Puedes repetir la misión por diversión. No cambia la estrella ni el progreso
              de este día.
            </p>
            <button type="button" className="button button--secondary" onClick={handleStartRepeat}>
              Repetir misión
            </button>
          </div>
        </section>
      )}
    </section>
  )
}
