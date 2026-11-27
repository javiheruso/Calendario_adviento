import type { AudioSnapshot, AudioStatus } from '../audio/audioManager'
import type { AudioPreferences } from '../domain/audioPreferences'

interface AudioSettingsSectionProps {
  preferences: AudioPreferences
  snapshot: AudioSnapshot
  persistenceError: boolean
  onChange: (next: AudioPreferences) => void
  onTest: () => void
  onStop: () => void
}

const STATUS_TEXT: Record<AudioStatus, string> = {
  idle: 'El audio está listo para activarse con el primer botón de sonido.',
  running: 'Audio activo en este navegador.',
  suspended:
    'El navegador ha bloqueado o suspendido el audio. Pulsa «Probar sonido» o cualquier control de sonido.',
  unsupported:
    'Este navegador no puede reproducir audio. Las 24 misiones siguen disponibles en silencio.',
  error: 'No se pudo iniciar el audio. Las misiones siguen disponibles en silencio.',
}

function volumePercent(volume: number): number {
  return Math.round(volume * 100)
}

/**
 * Parental audio controls: channel toggles, one master volume and a test tone.
 *
 * The section explains the fallback posture and never shows hints, hiding places
 * or album content. Preferences are saved locally by the app shell.
 */
export function AudioSettingsSection({
  preferences,
  snapshot,
  persistenceError,
  onChange,
  onTest,
  onStop,
}: AudioSettingsSectionProps) {
  const percent = volumePercent(preferences.volume)

  function update(patch: Partial<AudioPreferences>) {
    onChange({ ...preferences, ...patch })
  }

  return (
    <section className="adult-section" aria-labelledby="adult-audio-title">
      <h3 id="adult-audio-title">Sonido</h3>
      <p className="adult__footnote">
        Ajustes guardados solo en este dispositivo. La música baja automáticamente
        mientras suena una locución, los efectos nunca bloquean un juego y el audio
        solo se activa después de una interacción.
      </p>

      {persistenceError ? (
        <p className="notice notice--warning" role="alert">
          No se pudieron guardar los ajustes de sonido. Se aplican en esta sesión,
          pero pueden perderse al recargar.
        </p>
      ) : null}

      <fieldset className="audio-settings">
        <legend>Canales</legend>

        <div className="audio-settings__channels">
          <label className="check">
            <input
              type="checkbox"
              checked={preferences.music}
              onChange={(event) => update({ music: event.target.checked })}
            />
            <span>Música</span>
          </label>

          <label className="check">
            <input
              type="checkbox"
              checked={preferences.voice}
              onChange={(event) => update({ voice: event.target.checked })}
            />
            <span>Voz de Trasto</span>
          </label>

          <label className="check">
            <input
              type="checkbox"
              checked={preferences.effects}
              onChange={(event) => update({ effects: event.target.checked })}
            />
            <span>Efectos</span>
          </label>

          <label className="check">
            <input
              type="checkbox"
              checked={preferences.muted}
              onChange={(event) => update({ muted: event.target.checked })}
            />
            <span>Silenciar todo</span>
          </label>
        </div>

        <label className="field audio-settings__volume">
          <span>Volumen general</span>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={percent}
            aria-valuetext={`${percent}%`}
            onChange={(event) => update({ volume: Number(event.target.value) / 100 })}
          />
          <small>{percent}%</small>
        </label>
      </fieldset>

      <p className="adult__footnote" role="status">
        {STATUS_TEXT[snapshot.status]}
      </p>

      {snapshot.message ? (
        <p className="notice notice--warning" role="status">
          {snapshot.message}
        </p>
      ) : null}

      <div className="adult__actions">
        <button type="button" className="button button--secondary" onClick={onTest}>
          Probar sonido
        </button>
        <button type="button" className="button button--secondary" onClick={onStop}>
          Detener todo el audio
        </button>
      </div>

      <p className="adult__footnote">
        Los tonos actuales son sintetizados y provisionales: sirven para validar el
        sistema, no sustituyen la música ni las locuciones definitivas con licencia.
      </p>
    </section>
  )
}
