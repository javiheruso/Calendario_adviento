import { getAsset } from '../domain/assets'
import { countStars, hasStar, isAlbumComplete } from '../domain/progress'
import { MISSION_DAYS, type MissionDay, type ProgressState } from '../domain/types'
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

      <ul className="tree__stars" aria-label={`${starCount} de 24 estrellas conseguidas`}>
        {MISSION_DAYS.map((day) => {
          const earned = hasStar(progress, day)

          return (
            <li
              key={day}
              className={earned ? 'star star--earned' : 'star'}
              aria-label={`Día ${day}: ${earned ? 'estrella conseguida' : 'sin estrella'}`}
            >
              <span aria-hidden="true">
                <AssetGlyph
                  asset={getAsset(earned ? 'ui.star' : 'ui.star.off')}
                  label={false}
                  className="star__image"
                />
              </span>
            </li>
          )
        })}
      </ul>

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
