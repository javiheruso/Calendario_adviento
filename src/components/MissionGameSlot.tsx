import type { AlbumSaveOutcome, SaveRecordingToAlbumInput } from '../domain/album'
import type { MissionDefinition } from '../domain/types'
import { MISSION_GAMES } from './missionGames'

interface MissionGameSlotProps {
  mission: MissionDefinition
  /** Local parental switch; games must not request media when false. */
  cameraEnabled: boolean
  /** Opens the existing hint and gift/star flow once the game succeeds. */
  onComplete: () => void
  onSaveRecording?: (
    input: SaveRecordingToAlbumInput,
  ) => Promise<AlbumSaveOutcome>
}

export function MissionGameSlot({
  mission,
  cameraEnabled,
  onComplete,
  onSaveRecording,
}: MissionGameSlotProps) {
  const Game = MISSION_GAMES[mission.kind]

  if (Game) {
    return (
      <Game
        mission={mission}
        cameraEnabled={cameraEnabled}
        onComplete={onComplete}
        onSaveRecording={onSaveRecording}
      />
    )
  }

  return (
    <div className="notice notice--warning" role="alert">
      <p>
        <strong>Esta misión figura como disponible, pero su juego no está registrado.</strong>
      </p>
      <p>
        Es un error de configuración interna. No se simula ningún progreso para no
        inventar un resultado.
      </p>
    </div>
  )
}
