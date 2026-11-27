import { useSyncExternalStore } from 'react'
import { audioManager, type AudioSnapshot } from './audioManager'

/** Subscribes React components to the manager status and fallback message. */
export function useAudioSnapshot(): AudioSnapshot {
  return useSyncExternalStore(
    audioManager.subscribe,
    audioManager.getSnapshot,
    audioManager.getSnapshot,
  )
}
