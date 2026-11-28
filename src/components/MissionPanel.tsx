import { useState } from 'react'
import type { AlbumSaveOutcome, SaveRecordingToAlbumInput } from '../domain/album'
import { getAsset } from '../domain/assets'
import { resolveMissionAvailability } from '../domain/missions'
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
  onConfirmGift: () => void
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
  onSaveRecording,
}: MissionPanelProps) {
  const [repeatingDay, setRepeatingDay] = useState<MissionDay | null>(null)
  const [repeatFeedback, setRepeatFeedback] = useState<{
    day: MissionDay
    text: string
  } | null>(null)
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
      <AssetGlyph
        asset={getAsset('ui.frame.general')}
        label={false}
        className="mission__frame"
      />
      <button type="button" className="link-button" onClick={onBack}>
        <span aria-hidden="true">←</span> {backLabel}
      </button>

      <header className="mission__header">
        <p className="mission__eyebrow">Día {day} de 24</p>
        <div className="mission__title-row">
          <span className="mission__icon" aria-hidden="true">
            <AssetGlyph asset={getAsset(mission.illustration)} label={false} />
          </span>
          <div>
            <h2 id="mission-title" tabIndex={-1}>
              {mission.title}
            </h2>
            <p className={`badge badge--${viewState}`}>{STATE_LABELS[viewState]}</p>
            {repeating ? (
              <p className="badge badge--repeat">Repetición · no cambia tu estrella</p>
            ) : null}
          </div>
        </div>
      </header>

      <div className="mission__narrative-row">
        <AssetGlyph
          asset={getAsset('brand.trasto.explains')}
          label={false}
          className="mission__narrative-art"
          priority
        />
        <p className="mission__narrative">
          Trasto te ha preparado esta misión. Cuando la superes, te dará la pista para
          encontrar el regalo escondido. Sin prisa y sin penalizaciones: puedes intentarlo
          las veces que quieras.
        </p>
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
              <p className="celebration" role="status">
                <span className="celebration__icon" aria-hidden="true">
                  <AssetGlyph asset={getAsset('ui.star')} label={false} />
                </span>
                ¡Regalo encontrado! La estrella del día {day} ya es tuya.
              </p>
            ) : (
              <>
                <p className="gift-block__note">
                  La estrella se guarda una sola vez por día.
                </p>
                <button
                  type="button"
                  className="button button--primary"
                  onClick={onConfirmGift}
                >
                  Ya he encontrado el regalo
                </button>
              </>
            )}
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
