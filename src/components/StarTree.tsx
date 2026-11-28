import { getAsset } from '../domain/assets'
import { countStars, hasStar, isAlbumComplete } from '../domain/progress'
import { STAR_POSITIONS } from '../domain/starTreeLayout'
import type { MissionDay, ProgressState } from '../domain/types'
import { AssetGlyph } from './AssetGlyph'

interface StarTreeProps {
  progress: ProgressState
  /** Released days still without a star; empty while previewing a demo. */
  pendingReleasedDays: readonly MissionDay[]
  /** Day that just earned its star and should play the reward animation. */
  celebratedDay?: MissionDay | null
}

export function StarTree({
  progress,
  pendingReleasedDays,
  celebratedDay = null,
}: StarTreeProps) {
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
        <p
          className={`tree__count${celebratedDay ? ' tree__count--bump' : ''}`}
          aria-live="polite"
        >
          {starCount} / 24
        </p>
      </div>

      <div className="tree__scene">
        <AssetGlyph
          asset={getAsset('ui.tree')}
          label={false}
          className="tree__scene-image"
        />

        <ul className="tree__stars" aria-label={`${starCount} de 24 estrellas conseguidas`}>
          {STAR_POSITIONS.map(({ day, left, top, size }) => {
            const earned = hasStar(progress, day)
            const celebrating = celebratedDay === day

            return (
              <li
                key={day}
                className={`star${earned ? ' star--earned' : ''}${
                  celebrating ? ' star--celebrating' : ''
                }`}
                data-star-day={day}
                tabIndex={-1}
                aria-label={`Día ${day}: ${
                  earned ? 'estrella conseguida' : 'sin estrella'
                }`}
                style={{
                  left: `${left}%`,
                  top: `${top}%`,
                  width: `${size}%`,
                }}
              >
                <span className="star__art" aria-hidden="true">
                  <AssetGlyph
                    asset={getAsset('ui.star.off')}
                    label={false}
                    className="star__image star__image--off"
                  />
                  <AssetGlyph
                    asset={getAsset('ui.star')}
                    label={false}
                    className="star__image star__image--on"
                  />
                </span>
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
