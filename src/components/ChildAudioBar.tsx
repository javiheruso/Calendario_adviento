import type { AudioSnapshot } from '../audio/audioManager'
import {
  DEFAULT_AUDIO_PREFERENCES,
  type AudioPreferences,
} from '../domain/audioPreferences'

interface ChildAudioBarProps {
  preferences: AudioPreferences
  snapshot: AudioSnapshot
  onChange: (next: AudioPreferences) => void
  /** Runs inside the click handler so the audio context can start. */
  onInteract: () => void
}

function volumePercent(volume: number): number {
  return Math.round(volume * 100)
}

/**
 * Simple child-facing silence and volume controls.
 *
 * It exposes no hints, hiding places, album files or channel internals. Channel
 * toggles stay in the parental panel; a child only needs one mute button and one
 * volume slider.
 */
export function ChildAudioBar({
  preferences,
  snapshot,
  onChange,
  onInteract,
}: ChildAudioBarProps) {
  const percent = volumePercent(preferences.volume)
  const silent = preferences.muted || preferences.volume === 0

  function toggleMute() {
    onInteract()

    if (silent) {
      onChange({
        ...preferences,
        muted: false,
        volume:
          preferences.volume === 0
            ? DEFAULT_AUDIO_PREFERENCES.volume
            : preferences.volume,
      })
      return
    }

    onChange({ ...preferences, muted: true })
  }

  function changeVolume(value: number) {
    onInteract()
    const volume = Math.min(1, Math.max(0, value / 100))
    onChange({ ...preferences, volume, muted: volume === 0 })
  }

  return (
    <section className="child-audio" aria-label="Controles de sonido">
      <button
        type="button"
        className="button button--secondary child-audio__toggle"
        aria-pressed={!silent}
        onClick={toggleMute}
      >
        {silent ? 'Sonido silenciado' : 'Sonido activado'}
      </button>

      <label className="child-audio__volume">
        <span>Volumen</span>
        <input
          type="range"
          min="0"
          max="100"
          step="5"
          value={percent}
          aria-valuetext={`${percent}%`}
          onChange={(event) => changeVolume(Number(event.target.value))}
        />
        <output>{percent}%</output>
      </label>

      {snapshot.status === 'unsupported' ? (
        <p className="child-audio__note" role="status">
          Este navegador no puede reproducir sonido. Puedes seguir jugando igual.
        </p>
      ) : null}

      {snapshot.status === 'suspended' ? (
        <p className="child-audio__note" role="status">
          Pulsa el botón de sonido si quieres escucharlo.
        </p>
      ) : null}

      {snapshot.message &&
      snapshot.status !== 'unsupported' &&
      snapshot.status !== 'suspended' ? (
        <p className="child-audio__note" role="status">
          {snapshot.message}
        </p>
      ) : null}
    </section>
  )
}
