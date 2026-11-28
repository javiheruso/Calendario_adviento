import { getAsset, type AssetId } from '../../domain/assets'
import { SIMON_BELL_POSITIONS } from '../../domain/games/bellSimon'
import { AssetGlyph } from '../AssetGlyph'

export interface BellDefinition {
  readonly note: number
  readonly label: string
  readonly tone: string
  readonly asset: AssetId
}

export interface BellFeedback {
  readonly note: number
  readonly kind: 'correct' | 'wrong'
}

interface BellStandProps {
  readonly bells: readonly BellDefinition[]
  readonly activeBell: number | null
  readonly feedback: BellFeedback | null
  readonly disabled: boolean
  readonly label: string
  readonly onPress: (note: number) => void
}

function positionFor(note: number): { left: number; top: number } {
  return (
    SIMON_BELL_POSITIONS.find((position) => position.note === note) ?? {
      left: 50,
      top: 50,
    }
  )
}

/**
 * Shared bell composition for day 18 and the day 24 memory crystal.
 *
 * The four final bell images are real buttons hung on the stand's rings. There
 * is no checkbox control: playback, a correct press and a wrong press only add
 * visual state (illumination and a short sway) to the same button.
 */
export function BellStand({
  bells,
  activeBell,
  feedback,
  disabled,
  label,
  onPress,
}: BellStandProps) {
  return (
    <div className="simon-stage">
      <AssetGlyph
        asset={getAsset('game.simon.stand')}
        label={false}
        className="simon-stage__stand"
        priority
      />
      <div className="simon-bells" role="group" aria-label={label}>
        {bells.map((bell) => {
          const position = positionFor(bell.note)
          const isActive = activeBell === bell.note
          const pressFeedback =
            feedback?.note === bell.note ? ` simon-bell--${feedback.kind}` : ''

          return (
            <button
              key={bell.note}
              type="button"
              className={`simon-bell simon-bell--${bell.tone}${
                isActive ? ' simon-bell--active' : ''
              }${pressFeedback}`}
              style={{ left: `${position.left}%`, top: `${position.top}%` }}
              onClick={() => onPress(bell.note)}
              disabled={disabled}
              aria-label={`Campana ${bell.label}`}
            >
              <span className="simon-bell__glyph" aria-hidden="true">
                <AssetGlyph asset={getAsset(bell.asset)} label={false} />
              </span>
              <span className="simon-bell__label">{bell.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
