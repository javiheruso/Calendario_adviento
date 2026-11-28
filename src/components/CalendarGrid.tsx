import { getAsset, type AssetId } from '../domain/assets'
import { getDayStatus, getTodayMissionDay, isDayReleased } from '../domain/calendar'
import { getMission } from '../domain/missions'
import type {
  AppConfig,
  CalendarAccess,
  DayStatus,
  MissionDay,
  ProgressState,
} from '../domain/types'
import { MISSION_DAYS } from '../domain/types'
import { AssetGlyph } from './AssetGlyph'

const STATUS_LABELS: Record<DayStatus, string> = {
  locked: 'Bloqueada',
  available: 'Disponible',
  'mission-complete': 'Misión superada',
  'gift-found': 'Regalo encontrado',
}

function DoorIcon({ status, illustration }: { status: DayStatus; illustration: AssetId }) {
  if (status === 'gift-found') {
    return <AssetGlyph asset={getAsset('ui.star')} label={false} />
  }

  if (status === 'locked') {
    return <AssetGlyph asset={getAsset('ui.lock')} label={false} />
  }

  if (status === 'mission-complete') {
    return <AssetGlyph asset={getAsset('ui.gift')} label={false} />
  }

  return <AssetGlyph asset={getAsset(illustration)} label={false} />
}

interface CalendarGridProps {
  progress: ProgressState
  config: AppConfig
  access: CalendarAccess
  now: Date
  onOpenDay: (day: MissionDay) => void
}

export function CalendarGrid({
  progress,
  config,
  access,
  now,
  onOpenDay,
}: CalendarGridProps) {
  const today = getTodayMissionDay(now)
  const seasonNotStarted = !access.adultPreview && !isDayReleased(1, now)

  return (
    <section className="calendar" aria-labelledby="calendar-title">
      <AssetGlyph
        asset={getAsset('ui.frame.calendar')}
        label={false}
        className="calendar__frame"
      />
      <h2 id="calendar-title" tabIndex={-1}>
        Las 24 puertas
      </h2>

      {seasonNotStarted ? (
        <p className="calendar__note">Las puertas se abrirán el 1 de diciembre de 2026.</p>
      ) : null}

      <ul className="calendar__grid">
        {MISSION_DAYS.map((day) => {
          const mission = getMission(day)

          if (!mission) {
            return null
          }

          const status = getDayStatus(day, progress, config, access, now)
          const locked = status === 'locked'
          const isToday = today === day
          const label = `Día ${day}${isToday ? ' (hoy)' : ''}: ${mission.title}. ${STATUS_LABELS[status]}.`

          return (
            <li key={day}>
              <button
                type="button"
                className={`door door--${status}${isToday ? ' door--today' : ''}`}
                data-day={day}
                disabled={locked}
                aria-label={label}
                onClick={() => onOpenDay(day)}
              >
                <span className="door__art" aria-hidden="true">
                  <AssetGlyph
                    asset={getAsset(locked ? 'ui.door.closed' : 'ui.door.open')}
                    label={false}
                  />
                </span>
                {isToday ? (
                  <span className="door__today" aria-hidden="true">
                    Hoy
                  </span>
                ) : null}
                <span className="door__number" aria-hidden="true">
                  {day}
                </span>
                <span className="door__icon" aria-hidden="true">
                  <DoorIcon status={status} illustration={mission.illustration} />
                </span>
                <span className="door__state" aria-hidden="true">
                  {STATUS_LABELS[status]}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
