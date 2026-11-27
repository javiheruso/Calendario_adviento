/**
 * Persistent-storage and quota reporting for the private album.
 *
 * `navigator.storage.persist()` is best effort: a browser may grant it, deny
 * it or not expose it at all. The album UI shows the real result and always
 * warns that clearing browser data can erase the memories, so the family can
 * export instead of trusting an unlimited-storage promise.
 */

export type PersistenceState = 'granted' | 'denied' | 'unsupported'

export interface StorageManagerLike {
  readonly persist?: () => Promise<boolean>
  readonly persisted?: () => Promise<boolean>
  readonly estimate?: () => Promise<{ readonly usage?: number; readonly quota?: number }>
}

export interface AlbumStorageStatus {
  readonly persistence: PersistenceState
  readonly usageBytes: number | null
  readonly quotaBytes: number | null
  readonly estimateFailed: boolean
}

function numberOrNull(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : null
}

async function readEstimate(manager: StorageManagerLike | null): Promise<{
  usageBytes: number | null
  quotaBytes: number | null
  estimateFailed: boolean
}> {
  if (!manager?.estimate) {
    return { usageBytes: null, quotaBytes: null, estimateFailed: false }
  }

  try {
    const estimate = await manager.estimate()

    return {
      usageBytes: numberOrNull(estimate.usage),
      quotaBytes: numberOrNull(estimate.quota),
      estimateFailed: false,
    }
  } catch {
    return { usageBytes: null, quotaBytes: null, estimateFailed: true }
  }
}

export function getStorageManager(): StorageManagerLike | null {
  if (typeof navigator === 'undefined') {
    return null
  }

  try {
    const storage = navigator.storage as StorageManagerLike | undefined
    return storage ?? null
  } catch {
    return null
  }
}

/** Reads the current persistence state without asking for a new grant. */
export async function readStorageStatus(
  manager: StorageManagerLike | null = getStorageManager(),
): Promise<AlbumStorageStatus> {
  const estimate = await readEstimate(manager)

  if (!manager || (!manager.persist && !manager.persisted)) {
    return { persistence: 'unsupported', ...estimate }
  }

  let persisted = false

  if (manager.persisted) {
    try {
      persisted = await manager.persisted()
    } catch {
      persisted = false
    }
  }

  return {
    persistence: persisted ? 'granted' : 'denied',
    ...estimate,
  }
}

/**
 * Asks for persistent storage when the API exists. A denial is reported as
 * `denied`, not as an error: the album still works, but the browser may evict
 * it under storage pressure.
 */
export async function requestPersistentStorage(
  manager: StorageManagerLike | null = getStorageManager(),
): Promise<AlbumStorageStatus> {
  const estimate = await readEstimate(manager)

  if (!manager || (!manager.persist && !manager.persisted)) {
    return { persistence: 'unsupported', ...estimate }
  }

  let granted = false

  try {
    if (manager.persisted) {
      granted = await manager.persisted()
    }

    if (!granted && manager.persist) {
      granted = await manager.persist()
    }
  } catch {
    granted = false
  }

  return {
    persistence: granted ? 'granted' : 'denied',
    ...estimate,
  }
}
