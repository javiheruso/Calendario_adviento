import { useEffect, useState } from 'react'
import {
  DEFAULT_COUNTDOWN_MILESTONES,
  countdownAnnouncement,
} from '../domain/a11y'

interface CountdownAnnouncerProps {
  seconds: number
  label: string
  milestones?: readonly number[]
}

/**
 * Visually hidden polite live region for a countdown. The visible timer may
 * update every second, but this region only changes on meaningful milestones.
 */
export function CountdownAnnouncer({
  seconds,
  label,
  milestones = DEFAULT_COUNTDOWN_MILESTONES,
}: CountdownAnnouncerProps) {
  const [message, setMessage] = useState('')

  useEffect(() => {
    const next = countdownAnnouncement(seconds, label, milestones)

    if (next) {
      // The live region is an external announcement channel: it must change only
      // at milestones, not on every visible timer tick.
      // oxlint-disable-next-line react/set-state-in-effect
      setMessage(next)
    }
  }, [seconds, label, milestones])

  return (
    <p className="visually-hidden" aria-live="polite" aria-atomic="true">
      {message}
    </p>
  )
}
