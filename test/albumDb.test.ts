import { test } from 'node:test'
import { strict as assert } from 'node:assert'
import type { AlbumMediaMetadata } from '../src/domain/album'
import {
  ALBUM_MEDIA_STORE,
  ALBUM_METADATA_STORE,
  AlbumStorageError,
  createIndexedDbAlbumDatabase,
} from '../src/storage/albumDb'

/**
 * Tiny IndexedDB mock: enough of the API for the adapter to open its schema,
 * run read/write transactions and report a quota failure. It is not a general
 * IndexedDB implementation.
 */

interface FakeRequest<T> {
  result: T
  error: unknown
  onsuccess: (() => void) | null
  onerror: (() => void) | null
  onupgradeneeded: (() => void) | null
  onblocked: (() => void) | null
}

class FakeObjectStore {
  private readonly transaction: FakeTransaction
  readonly records: Map<string, unknown>

  constructor(transaction: FakeTransaction, records: Map<string, unknown>) {
    this.transaction = transaction
    this.records = records
  }

  getAll(): FakeRequest<unknown[]> {
    const fakeRequest = request<unknown[]>([])

    setTimeout(() => {
      fakeRequest.result = Array.from(this.records.values())
      fakeRequest.onsuccess?.()
    }, 0)

    return fakeRequest
  }

  get(key: string): FakeRequest<unknown> {
    const fakeRequest = request<unknown>(undefined)
    setTimeout(() => {
      fakeRequest.result = this.records.get(key)
      fakeRequest.onsuccess?.()
    }, 0)
    return fakeRequest
  }

  put(value: unknown): FakeRequest<string> {
    const fakeRequest = request<string>('')
    const key = (value as { id?: string }).id ?? ''

    setTimeout(() => {
      if (this.transaction.failWith) {
        fakeRequest.error = this.transaction.failWith
        fakeRequest.onerror?.()
        this.transaction.fail(this.transaction.failWith)
        return
      }

      this.records.set(key, value)
      fakeRequest.result = key
      fakeRequest.onsuccess?.()
    }, 0)

    return fakeRequest
  }

  delete(key: string): FakeRequest<undefined> {
    const fakeRequest = request<undefined>(undefined)
    setTimeout(() => {
      if (this.transaction.failWith) {
        fakeRequest.error = this.transaction.failWith
        fakeRequest.onerror?.()
        this.transaction.fail(this.transaction.failWith)
        return
      }

      this.records.delete(key)
      fakeRequest.onsuccess?.()
    }, 0)
    return fakeRequest
  }
}

class FakeTransaction {
  oncomplete: (() => void) | null = null
  onerror: (() => void) | null = null
  onabort: (() => void) | null = null
  error: unknown = null
  readonly failWith: unknown
  private readonly database: FakeDatabase
  readonly storeNames: string[]

  constructor(database: FakeDatabase, storeNames: string[]) {
    this.database = database
    this.storeNames = storeNames
    this.failWith = database.factory.failWith
    setTimeout(() => {
      if (this.failWith) {
        this.fail(this.failWith)
        return
      }

      this.oncomplete?.()
    }, 0)
  }

  objectStore(name: string): FakeObjectStore {
    const records = this.database.stores.get(name)

    if (!records) {
      throw new Error(`Unknown store ${name}`)
    }

    return new FakeObjectStore(this, records)
  }

  fail(error: unknown): void {
    this.error = error
    this.onerror?.()
    this.onabort?.()
  }
}

class FakeDatabase {
  readonly stores = new Map<string, Map<string, unknown>>()
  readonly objectStoreNames = {
    contains: (name: string) => this.stores.has(name),
  }
  onversionchange: (() => void) | null = null
  readonly factory: FakeIndexedDb

  constructor(factory: FakeIndexedDb) {
    this.factory = factory
  }

  createObjectStore(name: string): void {
    this.stores.set(name, new Map())
  }

  transaction(name: string | string[]): FakeTransaction {
    return new FakeTransaction(this, Array.isArray(name) ? name : [name])
  }

  close(): void {}
}

class FakeIndexedDb {
  readonly databases: FakeDatabase[] = []
  failWith: unknown = null

  open(): FakeRequest<FakeDatabase> {
    const fakeRequest = request<FakeDatabase>(undefined as unknown as FakeDatabase)
    const database = new FakeDatabase(this)
    this.databases.push(database)
    fakeRequest.result = database

    setTimeout(() => {
      fakeRequest.onupgradeneeded?.()
      fakeRequest.onsuccess?.()
    }, 0)

    return fakeRequest
  }
}

function request<T>(result: T): FakeRequest<T> {
  return {
    result,
    error: null,
    onsuccess: null,
    onerror: null,
    onupgradeneeded: null,
    onblocked: null,
  }
}

function metadata(
  id: string,
  source: AlbumMediaMetadata['source'] = 'recording',
): AlbumMediaMetadata {
  return {
    id,
    day: 7,
    kind: source === 'capture' ? 'photo' : 'video',
    mimeType: source === 'capture' ? 'image/jpeg' : 'video/webm',
    fileName: source === 'capture' ? 'foto-dia-07.jpg' : 'grabacion.webm',
    byteSize: 5,
    createdAt: '2026-12-07T10:30:00.000Z',
    source,
  }
}

test('IndexedDB adapter creates its schema and round-trips metadata and blob', async () => {
  const factory = new FakeIndexedDb()
  const database = createIndexedDbAlbumDatabase(factory as unknown as IDBFactory)

  await database.put({
    metadata: metadata('album-1'),
    blob: new Blob(['video']),
  })

  const listed = await database.listMetadata()
  assert.deepEqual(
    listed.map((entry) => entry.id),
    ['album-1'],
  )
  assert.equal(await (await database.getBlob('album-1'))?.text(), 'video')

  await database.delete('album-1')
  assert.deepEqual(await database.listMetadata(), [])
  assert.equal(await database.getBlob('album-1'), null)

  const schema = factory.databases[0]
  assert.equal(schema?.stores.has(ALBUM_METADATA_STORE), true)
  assert.equal(schema?.stores.has(ALBUM_MEDIA_STORE), true)
})

test('IndexedDB adapter accepts camera-capture metadata', async () => {
  const factory = new FakeIndexedDb()
  const database = createIndexedDbAlbumDatabase(factory as unknown as IDBFactory)

  await database.put({
    metadata: metadata('album-capture', 'capture'),
    blob: new Blob(['photo'], { type: 'image/jpeg' }),
  })

  const listed = await database.listMetadata()
  assert.equal(listed.length, 1)
  assert.equal(listed[0]?.source, 'capture')
  assert.equal(listed[0]?.kind, 'photo')
})

test('IndexedDB adapter reports quota failures with a usable code', async () => {
  const factory = new FakeIndexedDb()
  factory.failWith = Object.assign(new Error('full'), { name: 'QuotaExceededError' })
  const database = createIndexedDbAlbumDatabase(factory as unknown as IDBFactory)

  await assert.rejects(
    database.put({
      metadata: metadata('album-1'),
      blob: new Blob(['video']),
    }),
    (error: unknown) =>
      error instanceof AlbumStorageError && error.code === 'quota',
  )
})
