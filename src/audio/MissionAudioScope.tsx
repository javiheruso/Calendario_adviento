import { useEffect, type ReactNode } from 'react'
import type { MissionDay } from '../domain/types'
import { audioManager } from './audioManager'

interface MissionAudioScopeProps {
  day: MissionDay
  children: ReactNode
}

/**
 * Stops mission-scoped audio when the mission view unmounts or the day changes.
 *
 * Games never touch the manager themselves: any sound they start inherits this
 * scope, and leaving the mission releases it even if a game forgot to clean up.
 */
export function MissionAudioScope({ day, children }: MissionAudioScopeProps) {
  useEffect(() => {
    const scope = `mission:${day}`
    audioManager.enterScope(scope)

    return () => {
      audioManager.exitScope(scope)
    }
  }, [day])

  return <>{children}</>
}
