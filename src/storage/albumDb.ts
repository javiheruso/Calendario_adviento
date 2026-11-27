/**
 * IndexedDB adapter for the private album.
 *
 * Two object stores keep the list cheap and the blobs isolated:
 *
 * - `metadata` stores small, sortable records;
 * - `media` stores `{ id, blob }` records.
 *
 * A save or delete touches both stores in one transaction, so the list can
 * never advertise a file whose blob is missing. The adapter never uploads
 * anything and never touches `localStorage`.
 */
import {
  sortAlbumMedia,
  type AlbumMediaMetadata,
  type AlbumMediaSource,
} from '../domain/album'
import { MISSION_DAYS } from '../domain/types'

export const ALBUM_DB_NAME = 'los24regalos-album'
export const ALBUM_DB_VERSION = 1
export const ALBUM_MEDIA_STORE = 'media'
export const ALBUM_METADATA_STORE = 'metadata'

export type AlbumStorageErrorCode =
  | 'quota'
  | 'unavailable'
  | 'blocked'
  | 'transaction'
  | 'not-found'

export class AlbumStorageError extends Error {
  readonly code: AlbumStorageErrorCode

  constructor(code: AlbumStorageErrorCode, message: string) {
    super(message)
    this.name = 'AlbumStorageError'
    this.code = code
  }
}

export interface AlbumMediaRecord {
  readonly metadata: AlbumMediaMetadata
  readonly blob: Blob
}

export interface AlbumDatabase {
  listMetadata(): Promise<AlbumMediaMetadata[]>
  getBlob(id: string): Promise<Blob | null>
  put(record: AlbumMediaRecord): Promise<void>
  delete(id: string): Promise<void>
}

function errorName(error: unknown): string {
  return typeof error === 'object' && error !== null && 'name' in error
    ? String((error as { name: unknown }).name)
    : ''
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : ''
}

/**
 * Converts browser storage failures into codes the UI can explain. Quota is
 * the important one: a parent must never see a false "saved" message.
 */
export function mapAlbumStorageError(error: unknown): AlbumStorageError {
  if (error instanceof AlbumStorageError) {
    return error
  }

  const name = errorName(error)
  const message = errorMessage(error)

  if (
    name === 'QuotaExceededError' ||
    name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
    /quota|storage is full|disk is full/i.test(message)
  ) {
    return new AlbumStorageError('quota', 'The device has no space left for the album.')
  }

  if (name === 'SecurityError' || name === 'InvalidAccessError') {
    return new AlbumStorageError('blocked', 'The browser blocked local album storage.')
  }

  if (name === 'NotFoundError') {
    return new AlbumStorageError('not-found', 'The requested album blob was not found.')
  }

  return new AlbumStorageError('transaction', 'The album storage transaction failed.')
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function normalizeMetadata(value: unknown): AlbumMediaMetadata | null {
  if (!isObject(value)) {
    return null
  }

  const day = value.day
  const kind = value.kind
  const source = value.source

  if (
    typeof value.id !== 'string' ||
    value.id.trim().length === 0 ||
    typeof day !== 'number' ||
    !Number.isInteger(day) ||
    !MISSION_DAYS.includes(day as (typeof MISSION_DAYS)[number]) ||
    (kind !== 'photo' && kind !== 'video') ||
    (source !== 'recording' && source !== 'import' && source !== 'capture') ||
    typeof value.mimeType !== 'string' ||
    typeof value.fileName !== 'string' ||
    typeof value.byteSize !== 'number' ||
    !Number.isFinite(value.byteSize) ||
    value.byteSize <= 0 ||
    typeof value.createdAt !== 'string' ||
    Number.isNaN(Date.parse(value.createdAt))
  ) {
    return null
  }

  return {
    id: value.id,
    day: day as AlbumMediaMetadata['day'],
    kind,
    mimeType: value.mimeType,
    fileName: value.fileName,
    byteSize: value.byteSize,
    createdAt: value.createdAt,
    source: source as AlbumMediaSource,
  }
}

function getGlobalIndexedDb(): IDBFactory | null {
  return typeof indexedDB === 'undefined' ? null : indexedDB
}

export function isIndexedDbAvailable(): boolean {
  return getGlobalIndexedDb() !== null
}

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(mapAlbumStorageError(request.error))
  })
}

function transactionDone(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(mapAlbumStorageError(transaction.error))
    transaction.onabort = () => reject(mapAlbumStorageError(transaction.error))
  })
}

function openDatabaseRequest(factory: IDBFactory): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    let request: IDBOpenDBRequest

    try {
      request = factory.open(ALBUM_DB_NAME, ALBUM_DB_VERSION)
    } catch (error) {
      reject(mapAlbumStorageError(error))
      return
    }

    request.onupgradeneeded = () => {
      const database = request.result

      if (!database.objectStoreNames.contains(ALBUM_METADATA_STORE)) {
        database.createObjectStore(ALBUM_METADATA_STORE, { keyPath: 'id' })
      }

      if (!database.objectStoreNames.contains(ALBUM_MEDIA_STORE)) {
        database.createObjectStore(ALBUM_MEDIA_STORE, { keyPath: 'id' })
      }
    }

    request.onblocked = () => {
      reject(new AlbumStorageError('blocked', 'The album database upgrade is blocked.'))
    }

    request.onerror = () => {
      reject(mapAlbumStorageError(request.error))
    }

    request.onsuccess = () => {
      const database = request.result
      database.onversionchange = () => database.close()
      resolve(database)
    }
  })
}

/**
 * Creates the production adapter. Passing `null` is useful for tests and for
 * browsers without IndexedDB: every operation rejects with `unavailable`
 * instead of silently falling back to a weaker store.
 */
export function createIndexedDbAlbumDatabase(
  factory: IDBFactory | null = getGlobalIndexedDb(),
): AlbumDatabase {
  let databasePromise: Promise<IDBDatabase> | null = null

  function openDatabase(): Promise<IDBDatabase> {
    if (!factory) {
      return Promise.reject(
        new AlbumStorageError('unavailable', 'IndexedDB is not available in this browser.'),
      )
    }

    if (!databasePromise) {
      databasePromise = openDatabaseRequest(factory).catch((error: unknown) => {
        databasePromise = null
        throw error
      })
    }

    return databasePromise
  }

  return {
    async listMetadata() {
      const database = await openDatabase()
      const transaction = database.transaction(ALBUM_METADATA_STORE, 'readonly')
      const result = await requestResult(
        transaction.objectStore(ALBUM_METADATA_STORE).getAll(),
      )
      const metadata = Array.isArray(result)
        ? result.map(normalizeMetadata).filter((entry): entry is AlbumMediaMetadata => entry !== null)
        : []

      return sortAlbumMedia(metadata)
    },

    async getBlob(id) {
      const database = await openDatabase()
      const transaction = database.transaction(ALBUM_MEDIA_STORE, 'readonly')
      const result = await requestResult(transaction.objectStore(ALBUM_MEDIA_STORE).get(id))

      if (!isObject(result) || !(result.blob instanceof Blob)) {
        return null
      }

      return result.blob
    },

    async put(record) {
      const database = await openDatabase()
      const transaction = database.transaction(
        [ALBUM_METADATA_STORE, ALBUM_MEDIA_STORE],
        'readwrite',
      )
      const done = transactionDone(transaction)

      await Promise.all([
        requestResult(
          transaction.objectStore(ALBUM_METADATA_STORE).put(record.metadata),
        ),
        requestResult(
          transaction.objectStore(ALBUM_MEDIA_STORE).put({
            id: record.metadata.id,
            blob: record.blob,
          }),
        ),
        done,
      ])
    },

    async delete(id) {
      const database = await openDatabase()
      const transaction = database.transaction(
        [ALBUM_METADATA_STORE, ALBUM_MEDIA_STORE],
        'readwrite',
      )
      const done = transactionDone(transaction)

      await Promise.all([
        requestResult(transaction.objectStore(ALBUM_METADATA_STORE).delete(id)),
        requestResult(transaction.objectStore(ALBUM_MEDIA_STORE).delete(id)),
        done,
      ])
    },
  }
}
