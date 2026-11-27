import { test } from 'node:test'
import { strict as assert } from 'node:assert'
import { AlbumValidationError, type AlbumMediaMetadata } from '../src/domain/album'
import {
  AlbumStorageError,
  createIndexedDbAlbumDatabase,
  mapAlbumStorageError,
  type AlbumDatabase,
  type AlbumMediaRecord,
} from '../src/storage/albumDb'
import { createAlbumStore, type SaveAlbumMediaInput } from '../src/storage/albumStore'
import { readZipEntries } from './zipReader'

class MemoryAlbumDatabase implements AlbumDatabase {
  readonly metadata = new Map<string, AlbumMediaMetadata>()
  readonly blobs = new Map<string, Blob>()
  putCalls = 0
  putError: unknown = null

  async listMetadata(): Promise<AlbumMediaMetadata[]> {
    return Array.from(this.metadata.values())
  }

  async getBlob(id: string): Promise<Blob | null> {
    return this.blobs.get(id) ?? null
  }

  async put(record: AlbumMediaRecord): Promise<void> {
    this.putCalls += 1

    if (this.putError) {
      throw this.putError
    }

    this.metadata.set(record.metadata.id, record.metadata)
    this.blobs.set(record.metadata.id, record.blob)
  }

  async delete(id: string): Promise<void> {
    this.metadata.delete(id)
    this.blobs.delete(id)
  }
}

const NOW = new Date('2026-12-07T10:30:00.000Z')

function createSequencedStore(database: AlbumDatabase) {
  let sequence = 0

  return createAlbumStore(database, {
    now: () => NOW,
    createId: () => `album-${(sequence += 1)}`,
  })
}

function photoInput(overrides: Partial<SaveAlbumMediaInput> = {}): SaveAlbumMediaInput {
  return {
    day: 7,
    blob: new Blob(['photo-bytes'], { type: 'image/jpeg' }),
    mimeType: 'image/jpeg',
    fileName: 'foto.jpg',
    source: 'import',
    ...overrides,
  }
}

test('album store saves metadata and blob only after the database resolves', async () => {
  const database = new MemoryAlbumDatabase()
  const store = createSequencedStore(database)

  const saved = await store.save(photoInput())

  assert.equal(saved.id, 'album-1')
  assert.equal(saved.day, 7)
  assert.equal(saved.kind, 'photo')
  assert.equal(saved.fileName, 'foto.jpg')
  assert.equal(saved.source, 'import')
  assert.equal(database.putCalls, 1)
  assert.equal(await (await store.getBlob(saved.id))?.text(), 'photo-bytes')

  const listed = await store.list()
  assert.deepEqual(
    listed.map((entry) => entry.id),
    ['album-1'],
  )
})

test('album store rejects unsupported files before touching the database', async () => {
  const database = new MemoryAlbumDatabase()
  const store = createSequencedStore(database)

  await assert.rejects(
    store.save(
      photoInput({
        blob: new Blob(['notes'], { type: 'text/plain' }),
        mimeType: 'text/plain',
        fileName: 'notas.txt',
      }),
    ),
    (error: unknown) =>
      error instanceof AlbumValidationError && error.code === 'unsupported-type',
  )

  assert.equal(database.putCalls, 0)
})

test('album store lists days ascending and newest first inside a day', async () => {
  const database = new MemoryAlbumDatabase()
  let tick = 0
  const store = createAlbumStore(database, {
    now: () => new Date(NOW.getTime() + tick++ * 1000),
    createId: (() => {
      let id = 0
      return () => `album-${(id += 1)}`
    })(),
  })

  await store.save(photoInput({ day: 8 }))
  await store.save(photoInput({ day: 2 }))
  await store.save(photoInput({ day: 2 }))

  const listed = await store.list()
  assert.deepEqual(
    listed.map((entry) => entry.day),
    [2, 2, 8],
  )
  assert.deepEqual(
    listed.map((entry) => entry.id),
    ['album-3', 'album-2', 'album-1'],
  )
})

test('album store deletes the metadata and the blob together', async () => {
  const database = new MemoryAlbumDatabase()
  const store = createSequencedStore(database)
  const saved = await store.save(photoInput())

  await store.remove(saved.id)

  assert.equal((await store.list()).length, 0)
  assert.equal(await store.getBlob(saved.id), null)
})

test('album export includes a README and one unique folder entry per memory', async () => {
  const database = new MemoryAlbumDatabase()
  const store = createSequencedStore(database)

  await store.save(photoInput({ day: 1, fileName: 'uno.jpg' }))
  await store.save(
    photoInput({
      day: 7,
      blob: new Blob(['png-bytes'], { type: 'image/png' }),
      mimeType: 'image/png',
      fileName: 'dos.png',
    }),
  )
  await store.save(
    photoInput({
      day: 7,
      blob: new Blob(['video-bytes'], { type: 'video/webm' }),
      mimeType: 'video/webm',
      fileName: 'tres.webm',
    }),
  )

  const result = await store.exportAll()
  const entries = await readZipEntries(result.blob)

  assert.equal(result.entryCount, 3)
  assert.equal(result.fileName, 'recuerdos-calendario-2026-12-07.zip')
  assert.deepEqual(
    entries.map((entry) => entry.name),
    [
      'LEEME.txt',
      'dia-01/foto-01.jpg',
      'dia-07/foto-01.png',
      'dia-07/video-01.webm',
    ],
  )
  assert.equal(new TextDecoder().decode(entries[1]?.data), 'photo-bytes')
  assert.equal(new TextDecoder().decode(entries[2]?.data), 'png-bytes')
  assert.equal(new TextDecoder().decode(entries[3]?.data), 'video-bytes')
  assert.match(new TextDecoder().decode(entries[0]?.data), /Recuerdos incluidos: 3/)
})

test('album export refuses an empty album and missing blobs', async () => {
  const database = new MemoryAlbumDatabase()
  const store = createSequencedStore(database)

  await assert.rejects(
    store.exportAll(),
    (error: unknown) =>
      error instanceof AlbumValidationError && error.code === 'empty-album',
  )

  const saved = await store.save(photoInput())
  database.blobs.delete(saved.id)

  await assert.rejects(
    store.exportAll(),
    (error: unknown) =>
      error instanceof AlbumStorageError && error.code === 'not-found',
  )
})

test('storage failures are mapped and never reported as a save', async () => {
  const database = new MemoryAlbumDatabase()
  database.putError = Object.assign(new Error('quota exceeded'), {
    name: 'QuotaExceededError',
  })
  const store = createSequencedStore(database)

  await assert.rejects(
    store.save(photoInput()),
    (error: unknown) => error instanceof AlbumStorageError && error.code === 'quota',
  )
  assert.equal((await store.list()).length, 0)
})

test('storage error classification covers quota, blocked and generic failures', () => {
  assert.equal(
    mapAlbumStorageError(Object.assign(new Error('full'), { name: 'QuotaExceededError' })).code,
    'quota',
  )
  assert.equal(mapAlbumStorageError(new Error('quota exceeded')).code, 'quota')
  assert.equal(
    mapAlbumStorageError(Object.assign(new Error('denied'), { name: 'SecurityError' })).code,
    'blocked',
  )
  assert.equal(mapAlbumStorageError(new Error('boom')).code, 'transaction')
  assert.equal(new AlbumStorageError('not-found', 'x').code, 'not-found')
})

test('the IndexedDB adapter reports unavailable when the browser has no IndexedDB', async () => {
  const database = createIndexedDbAlbumDatabase(null)

  await assert.rejects(
    database.listMetadata(),
    (error: unknown) =>
      error instanceof AlbumStorageError && error.code === 'unavailable',
  )
})
