import { useEffect, useRef } from 'react'

/**
 * Runs a success continuation once after a short feedback pause.
 *
 * The timer is created only while `active` is true and is always cleared when
 * the flag drops, the component unmounts or a restart happens. Because the
 * callback is read through a ref, a re-render with a new closure does not arm a
 * second timer, and `active` turning false after the advance prevents a double
 * trigger.
 */
export function useAutoAdvance(
  active: boolean,
  delayMs: number,
  action: () => void,
): void {
  const actionRef = useRef(action)

  useEffect(() => {
    actionRef.current = action
  }, [action])

  useEffect(() => {
    if (!active || delayMs < 0) {
      return
    }

    const timer = window.setTimeout(() => {
      actionRef.current()
    }, delayMs)

    return () => window.clearTimeout(timer)
  }, [active, delayMs])
}
