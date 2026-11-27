/**
 * Shared pure countdown rules for playful timers.
 *
 * A countdown only reports time: it never blocks a mission, never fails a
 * child and never imposes a penalty. UI components own the interval and must
 * clear it when the timer pauses, the mission completes or the component
 * unmounts.
 */

export interface Countdown {
  readonly remainingSeconds: number
  readonly running: boolean
}

function safeSeconds(seconds: number): number {
  return Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0
}

export function createCountdown(durationSeconds: number): Countdown {
  return { remainingSeconds: safeSeconds(durationSeconds), running: false }
}

export function startCountdown(countdown: Countdown): Countdown {
  if (countdown.remainingSeconds <= 0) {
    return countdown
  }

  return { ...countdown, running: true }
}

export function pauseCountdown(countdown: Countdown): Countdown {
  return countdown.running ? { ...countdown, running: false } : countdown
}

/** Advances one second. Stops exactly at zero and never goes negative. */
export function tickCountdown(countdown: Countdown): Countdown {
  if (!countdown.running || countdown.remainingSeconds <= 0) {
    return countdown
  }

  const remainingSeconds = countdown.remainingSeconds - 1

  return { remainingSeconds, running: remainingSeconds > 0 }
}

/** Adds playful time. The caller decides whether to resume afterwards. */
export function extendCountdown(
  countdown: Countdown,
  extraSeconds: number,
): Countdown {
  const extra = safeSeconds(extraSeconds)

  if (extra === 0) {
    return countdown
  }

  return { ...countdown, remainingSeconds: countdown.remainingSeconds + extra }
}

export function formatCountdown(seconds: number): string {
  const safe = safeSeconds(seconds)
  const minutes = Math.floor(safe / 60)
  const rest = safe % 60

  return `${minutes}:${String(rest).padStart(2, '0')}`
}
