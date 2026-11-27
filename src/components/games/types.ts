import type {
  AlbumSaveOutcome,
  SaveRecordingToAlbumInput,
} from '../../domain/album'
import type { MissionDefinition } from '../../domain/types'

/**
 * Contract shared by every real mission game.
 *
 * A game owns its rules and calls `onComplete` only after its own success
 * condition is met. The mission panel then opens the existing hint and
 * gift/star flow; the game never writes progress directly.
 */
export interface MissionGameProps {
  readonly mission: MissionDefinition
  /**
   * Local parental switch for optional camera and recording. Games that use
   * media must not request permissions when this is false.
   */
  readonly cameraEnabled?: boolean
  readonly onComplete: () => void
  /** Optional album writer for games that can record media (currently day 7). */
  readonly onSaveRecording?: (
    input: SaveRecordingToAlbumInput,
  ) => Promise<AlbumSaveOutcome>
}
