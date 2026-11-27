import { test } from 'node:test'
import { strict as assert } from 'node:assert'
import {
  readStorageStatus,
  requestPersistentStorage,
  type StorageManagerLike,
} from '../src/storage/storageStatus'

test('persistent storage is requested when it is not granted yet', async () => {
  let persistCalls = 0
  let persisted = false
  const manager: StorageManagerLike = {
    persisted: async () => persisted,
    persist: async () => {
      persistCalls += 1
      persisted = true
      return true
    },
    estimate: async () => ({ usage: 2048, quota: 1024 * 1024 }),
  }

  const status = await requestPersistentStorage(manager)

  assert.equal(persistCalls, 1)
  assert.equal(status.persistence, 'granted')
  assert.equal(status.usageBytes, 2048)
  assert.equal(status.quotaBytes, 1024 * 1024)
  assert.equal(status.estimateFailed, false)
})

test('an existing grant is not requested again', async () => {
  let persistCalls = 0
  const manager: StorageManagerLike = {
    persisted: async () => true,
    persist: async () => {
      persistCalls += 1
      return true
    },
  }

  const status = await requestPersistentStorage(manager)

  assert.equal(persistCalls, 0)
  assert.equal(status.persistence, 'granted')
})

test('a denied request is reported, not treated as an error', async () => {
  const manager: StorageManagerLike = {
    persisted: async () => false,
    persist: async () => false,
  }

  const status = await requestPersistentStorage(manager)

  assert.equal(status.persistence, 'denied')
  assert.equal(status.usageBytes, null)
  assert.equal(status.estimateFailed, false)
})

test('unsupported browsers and failing estimates are reported honestly', async () => {
  assert.equal((await requestPersistentStorage(null)).persistence, 'unsupported')

  const manager: StorageManagerLike = {
    estimate: async () => {
      throw new Error('estimate failed')
    },
  }

  const status = await readStorageStatus(manager)

  assert.equal(status.persistence, 'unsupported')
  assert.equal(status.estimateFailed, true)
  assert.equal(status.usageBytes, null)
})

test('readStorageStatus reflects an existing denial without requesting a grant', async () => {
  let persistCalls = 0
  const manager: StorageManagerLike = {
    persisted: async () => false,
    persist: async () => {
      persistCalls += 1
      return true
    },
    estimate: async () => ({ usage: -1, quota: Number.NaN }),
  }

  const status = await readStorageStatus(manager)

  assert.equal(persistCalls, 0)
  assert.equal(status.persistence, 'denied')
  assert.equal(status.usageBytes, null)
  assert.equal(status.quotaBytes, null)
  assert.equal(status.estimateFailed, false)
})
