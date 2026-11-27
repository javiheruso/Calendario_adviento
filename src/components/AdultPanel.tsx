import type { AudioSnapshot } from '../audio/audioManager'
import type { AudioPreferences } from '../domain/audioPreferences'
import type { DaySettingsPatch } from '../domain/config'
import { getMission } from '../domain/missions'
import {
  MISSION_DAYS,
  type AppConfig,
  type DaySettings,
  type MissionDay,
} from '../domain/types'
import { AudioSettingsSection } from './AudioSettingsSection'

interface AdultPanelProps {
  config: AppConfig
  demoMode: boolean
  persistenceError: boolean
  demoPersistenceError: boolean
  audioPreferences: AudioPreferences
  audioSnapshot: AudioSnapshot
  audioPersistenceError: boolean
  /** Adult-facing message that must stay visible, for example a PIN save failure. */
  notice: string | null
  onUpdateDay: (day: MissionDay, patch: DaySettingsPatch) => void
  onToggleManualUnlock: (day: MissionDay, value: boolean) => void
  onToggleCamera: (enabled: boolean) => void
  onPreviewDay: (day: MissionDay) => void
  onEnterDemo: () => void
  onExitDemo: () => void
  onResetDemo: () => void
  onLock: () => void
  onBackToChild: () => void
  onOpenAlbum: () => void
  onChangeAudio: (next: AudioPreferences) => void
  onTestAudio: () => void
  onStopAudio: () => void
}

/** Empty input means "not configured", never an invented value. */
function optionalText(value: string): string | null {
  return value.trim().length === 0 ? null : value
}

interface DayEditorProps {
  day: MissionDay
  title: string
  settings: DaySettings
  onUpdate: (day: MissionDay, patch: DaySettingsPatch) => void
  onToggleManualUnlock: (day: MissionDay, value: boolean) => void
  onPreview: (day: MissionDay) => void
}

function AdultDayEditor({
  day,
  title,
  settings,
  onUpdate,
  onToggleManualUnlock,
  onPreview,
}: DayEditorProps) {
  const hasMainHint = Boolean(settings.hints.main)

  return (
    <details className="adult-day">
      <summary className="adult-day__summary" data-day-summary={day}>
        <span className="adult-day__number">Día {day}</span>
        <span className="adult-day__title">{title}</span>
        <span className="adult-day__tags">
          {hasMainHint ? (
            <span className="tag tag--ok">Pista lista</span>
          ) : (
            <span className="tag tag--warn">Sin pista</span>
          )}
          {settings.manuallyUnlocked ? (
            <span className="tag tag--info">Desbloqueado</span>
          ) : null}
        </span>
      </summary>

      <div className="adult-day__body">
        <label className="field">
          <span>Pista principal</span>
          <textarea
            rows={2}
            value={settings.hints.main ?? ''}
            onChange={(event) =>
              onUpdate(day, { hints: { main: optionalText(event.target.value) } })
            }
          />
        </label>

        <label className="field">
          <span>Ayuda de ubicación</span>
          <textarea
            rows={2}
            value={settings.hints.location ?? ''}
            onChange={(event) =>
              onUpdate(day, { hints: { location: optionalText(event.target.value) } })
            }
          />
        </label>

        <label className="field">
          <span>Escondite (solo panel adulto)</span>
          <input
            type="text"
            value={settings.hidingSpot ?? ''}
            onChange={(event) =>
              onUpdate(day, { hidingSpot: optionalText(event.target.value) })
            }
          />
          <small>
            Nunca se muestra en el modo infantil ni en la vista de demostración.
          </small>
        </label>

        <label className="check">
          <input
            type="checkbox"
            checked={settings.manuallyUnlocked}
            onChange={(event) => onToggleManualUnlock(day, event.target.checked)}
          />
          <span>Desbloquear este día manualmente</span>
        </label>

        <button
          type="button"
          className="button button--secondary"
          onClick={() => onPreview(day)}
        >
          Previsualizar misión
        </button>
      </div>
    </details>
  )
}

export function AdultPanel({
  config,
  demoMode,
  persistenceError,
  demoPersistenceError,
  audioPreferences,
  audioSnapshot,
  audioPersistenceError,
  notice,
  onUpdateDay,
  onToggleManualUnlock,
  onToggleCamera,
  onPreviewDay,
  onEnterDemo,
  onExitDemo,
  onResetDemo,
  onLock,
  onBackToChild,
  onOpenAlbum,
  onChangeAudio,
  onTestAudio,
  onStopAudio,
}: AdultPanelProps) {
  return (
    <section className="adult" aria-labelledby="adult-title">
      <div className="adult__topbar">
        <button type="button" className="link-button" onClick={onBackToChild}>
          <span aria-hidden="true">←</span> Volver al calendario infantil
        </button>
        <button type="button" className="button button--secondary" onClick={onLock}>
          Bloquear panel
        </button>
      </div>

      <header>
        <p className="adult__eyebrow">Zona de adultos</p>
        <h2 id="adult-title" tabIndex={-1}>
          Panel familiar
        </h2>
        <p className="adult__lead">
          Configura las pistas y los escondites, desbloquea días difíciles y revisa
          misiones sin tocar el progreso infantil. La sesión permanece abierta hasta
          que pulses «Bloquear panel» o recargues la página.
        </p>
      </header>

      {notice ? (
        <p className="notice notice--warning" role="alert">
          {notice}
        </p>
      ) : null}

      {persistenceError ? (
        <p className="notice notice--warning" role="alert">
          No se pudieron guardar los cambios en este dispositivo. Revisa el
          almacenamiento del navegador; lo que ves en pantalla puede perderse al
          recargar.
        </p>
      ) : null}

      <section className="adult-section" aria-labelledby="adult-demo-title">
        <h3 id="adult-demo-title">Modo demostración</h3>
        <p className="adult__footnote">
          Abre todas las puertas y usa un almacén de progreso separado. Nunca otorga ni
          retira estrellas infantiles.
        </p>

        {demoPersistenceError ? (
          <p className="notice notice--warning" role="alert">
            No se pudo guardar el progreso de la demostración en este dispositivo.
          </p>
        ) : null}

        <div className="adult__actions">
          {demoMode ? (
            <>
              <button type="button" className="button button--secondary" onClick={onExitDemo}>
                Salir del modo demo
              </button>
              <button type="button" className="button button--secondary" onClick={onResetDemo}>
                Reiniciar demo
              </button>
            </>
          ) : (
            <button type="button" className="button button--primary" onClick={onEnterDemo}>
              Activar modo demostración
            </button>
          )}
        </div>
      </section>

      <section className="adult-section" aria-labelledby="adult-camera-title">
        <h3 id="adult-camera-title">Cámara y grabación opcional</h3>
        <p className="adult__footnote">
          Control local para este dispositivo. Si lo desactivas, la app no pedirá
          permiso de cámara ni micrófono en el día 7 ni en la captura del álbum. Las
          misiones siguen siendo jugables y la importación desde la galería continúa
          disponible.
        </p>

        <label className="check">
          <input
            type="checkbox"
            checked={config.parental.cameraEnabled}
            onChange={(event) => onToggleCamera(event.target.checked)}
          />
          <span>Permitir cámara y grabación opcional</span>
        </label>
      </section>

      <section className="adult-section" aria-labelledby="adult-album-title">
        <h3 id="adult-album-title">Álbum privado</h3>
        <p className="adult__footnote">
          Fotos y vídeos guardados solo en este dispositivo. Se ven y se gestionan
          únicamente desde esta zona de adultos; nunca aparecen en el calendario
          infantil.
        </p>
        <div className="adult__actions">
          <button
            type="button"
            className="button button--primary"
            data-open-album
            onClick={onOpenAlbum}
          >
            Abrir álbum privado
          </button>
        </div>
      </section>

      <AudioSettingsSection
        preferences={audioPreferences}
        snapshot={audioSnapshot}
        persistenceError={audioPersistenceError}
        onChange={onChangeAudio}
        onTest={onTestAudio}
        onStop={onStopAudio}
      />

      <section className="adult-section" aria-labelledby="adult-days-title">
        <h3 id="adult-days-title">Pistas, escondites y desbloqueos</h3>
        <p className="adult__footnote">
          Los cambios se guardan en este dispositivo al editarlos. Si el navegador
          rechaza el guardado, verás un aviso en lugar de un falso éxito.
        </p>

        <div className="adult-days">
          {MISSION_DAYS.map((day) => {
            const mission = getMission(day)

            if (!mission) {
              return null
            }

            return (
              <AdultDayEditor
                key={day}
                day={day}
                title={mission.title}
                settings={config.days[day]}
                onUpdate={onUpdateDay}
                onToggleManualUnlock={onToggleManualUnlock}
                onPreview={onPreviewDay}
              />
            )
          })}
        </div>
      </section>
    </section>
  )
}
