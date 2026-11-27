/**
 * Album store use cases on top of an `AlbumDatabase`.
 *
 * The split keeps IndexedDB details in `albumDb.ts` and lets tests exercise
 * save/list/delete/export with an in-memory mock. Every success value is
 * produced only after the underlying transaction resolves.
 */
import {
  AlbumValidationError,
  albumExportArchiveName,
  albumExportReadme,
  albumTotalBytes,
  buildAlbumMediaMetadata,
  buildAlbumZipManifest,
  createAlbumMediaId,
  sortAlbumMedia,
  type AlbumMediaMetadata,
  type AlbumMediaSource,
  type NewAlbumMetadataInput,
} from '../domain/album'
import type { MissionDay } from '../domain/types'
import { AlbumStorageError, mapAlbumStorageError, type AlbumDatabase } from './albumDb'
import { buildZip } from './zip'

export interface SaveAlbumMediaInput {
  readonly day: MissionDay
  readonly blob: Blob
  readonly mimeType: string
  readonly fileName?: string | null
  readonly source: AlbumMediaSource
}

export interface AlbumExportResult {
  readonly blob: Blob
  readonly fileName: string
  readonly entryCount: number
  readonly totalBytes: number
}

export interface AlbumStore {
  list(): Promise<AlbumMediaMetadata[]>
  getBlob(id: string): Promise<Blob | null>
  save(input: SaveAlbumMediaInput): Promise<AlbumMediaMetadata>
  remove(id: string): Promise<void>
  exportAll(): Promise<AlbumExportResult>
}

export interface AlbumStoreOptions {
  readonly now?: () => Date
  readonly createId?: (now: Date) => string
}

function asStorageError(error: unknown): AlbumStorageError {
  if (error instanceof AlbumValidationError) {
    throw error
  }

  return mapAlbumStorageError(error)
}

export function createAlbumStore(
  database: AlbumDatabase,
  options: AlbumStoreOptions = {},
): AlbumStore {
  const now = options.now ?? (() => new Date())
  const createId = options.createId ?? createAlbumMediaId

  async function list(): Promise<AlbumMediaMetadata[]> {
    try {
      return sortAlbumMedia(await database.listMetadata())
    } catch (error) {
      throw asStorageError(error)
    }
  }

  async function getBlob(id: string): Promise<Blob | null> {
    try {
      return await database.getBlob(id)
    } catch (error) {
      throw asStorageError(error)
    }
  }

  return {
    list,
    getBlob,

    async save(input) {
      const timestamp = now()
      const metadataInput: NewAlbumMetadataInput = {
        day: input.day,
        mimeType: input.mimeType,
        fileName: input.fileName,
        byteSize: input.blob.size,
        source: input.source,
      }
      const metadata = buildAlbumMediaMetadata(metadataInput, {
        id: createId(timestamp),
        now: timestamp,
      })

      try {
        await database.put({ metadata, blob: input.blob })
      } catch (error) {
        throw asStorageError(error)
      }

      return metadata
    },

    async remove(id) {
      try {
        await database.delete(id)
      } catch (error) {
        throw asStorageError(error)
      }
    },

    async exportAll() {
      const timestamp = now()
      const listed = await list()

      if (listed.length === 0) {
        throw new AlbumValidationError('empty-album', 'There are no memories to export.')
      }

      const manifest = buildAlbumZipManifest(listed)
      const entries = [
        {
          name: 'LEEME.txt',
          data: new Blob([albumExportReadme(timestamp, manifest.length)], {
            type: 'text/plain;charset=utf-8',
          }),
          lastModified: timestamp,
        },
      ]

      for (const item of manifest) {
        const blob = await getBlob(item.media.id)

        if (!blob) {
          throw new AlbumStorageError(
            'not-found',
            `The album blob for ${item.media.id} is missing.`,
          )
        }

        entries.push({
          name: item.name,
          data: blob,
          lastModified: new Date(item.media.createdAt),
        })
      }

      const blob = await buildZip(entries)

      return {
        blob,
        fileName: albumExportArchiveName(timestamp),
        entryCount: manifest.length,
        totalBytes: albumTotalBytes(listed),
      }
    },
  }
}
