import { getAsset } from '../domain/assets'
import { countStars, hasStar, isAlbumComplete } from '../domain/progress'
import { STAR_POSITIONS, STAR_SIZE_PERCENT } from '../domain/starTreeLayout'
import type { MissionDay, ProgressState } from '../domain/types'
import { AssetGlyph } from './AssetGlyph'

interface StarTreeProps {
  progress: ProgressState
  /** Released days still without a star; empty while previewing a demo. */
  pendingReleasedDays: readonly MissionDay[]
}

export function StarTree({ progress, pendingReleasedDays }: StarTreeProps) {
  const starCount = countStars(progress)
  const complete = isAlbumComplete(progress)

  return (
    <section className="tree" aria-labelledby="tree-title">
      <div className="tree__header">
        <h2 id="tree-title">
          <span className="tree__icon" aria-hidden="true">
            <AssetGlyph asset={getAsset('ui.tree')} label={false} />
          </span>
          Tu árbol de estrellas
        </h2>
        <p className="tree__count">{starCount} / 24</p>
      </div>

      <div className="tree__scene">
        <AssetGlyph
          asset={getAsset('ui.tree')}
          label={false}
          className="tree__scene-image"
        />

        <ul className="tree__stars" aria-label={`${starCount} de 24 estrellas conseguidas`}>
          {STAR_POSITIONS.map(({ day, left, top }) => {
            const earned = hasStar(progress, day)

            return (
              <li
                key={day}
                className={earned ? 'star star--earned' : 'star'}
                style={{
                  left: `${left}%`,
                  top: `${top}%`,
                  width: `${STAR_SIZE_PERCENT}%`,
                }}
              >
                <span className="visually-hidden">
                  Día {day}: {earned ? 'estrella conseguida' : 'sin estrella'}
                </span>
                <AssetGlyph
                  asset={getAsset(earned ? 'ui.star' : 'ui.star.off')}
                  label={false}
                  className="star__image"
                />
              </li>
            )
          })}
        </ul>
      </div>

      {complete ? (
        <p className="tree__celebration" role="status">
          ¡Las 24 estrellas! Has completado el calendario. Trasto está orgulloso de ti.
        </p>
      ) : pendingReleasedDays.length > 0 ? (
        <p className="tree__pending">
          {pendingReleasedDays.length === 1
            ? 'Queda 1 día ya disponible sin estrella: '
            : `Quedan ${pendingReleasedDays.length} días ya disponibles sin estrella: `}
          {pendingReleasedDays.join(', ')}.
        </p>
      ) : null}
    </section>
  )
}
