import { test } from 'node:test'
import { strict as assert } from 'node:assert'
import { setCameraEnabled, setParentalPin } from '../src/domain/config'
import {
  completeMission,
  confirmGiftFound,
  countStars,
  createEmptyProgress,
} from '../src/domain/progress'
import type { ProgressState } from '../src/domain/types'
import { createPinRecord, verifyPin } from '../src/security/pin'
import {
  DEMO_STORAGE_KEY,
  STORAGE_KEY,
  createInitialState,
  loadAppState,
  loadDemoProgress,
  resetAppState,
  resetDemoProgress,
  saveAppState,
  saveDemoProgress,
} from '../src/storage/localState'

class MemoryStorage implements Storage {
  private readonly data = new Map<string, string>()

  get length(): number {
    return this.data.size
  }

  clear(): void {
    this.data.clear()
  }

  getItem(key: string): string | null {
    return this.data.get(key) ?? null
  }

  key(index: number): string | null {
    return Array.from(this.data.keys())[index] ?? null
  }

  removeItem(key: string): void {
    this.data.delete(key)
  }

  setItem(key: string, value: string): void {
    this.data.set(key, value)
  }
}

function progressWithGift(day: 1 | 2 | 24): ProgressState {
  return confirmGiftFound(createEmptyProgress(), day, new Date('2026-12-01T10:00:00.000Z'))
}

test('child progress round-trips through local storage', () => {
  const storage = new MemoryStorage()
  const state = { ...createInitialState(), progress: progressWithGift(1) }

  assert.equal(saveAppState(state, storage), true)

  const loaded = loadAppState(storage)
  assert.equal(countStars(loaded.progress), 1)
  assert.equal(loaded.progress.days[1]?.giftFoundAt, state.progress.days[1]?.giftFoundAt)
})

test('configured hints round-trip without inventing or dropping data', () => {
  const storage = new MemoryStorage()
  const initial = createInitialState()
  const state = {
    ...initial,
    config: {
      ...initial.config,
      days: {
        ...initial.config.days,
        1: {
          ...initial.config.days[1],
          hints: { main: 'Pista de prueba', location: 'Ayuda de prueba' },
        },
      },
    },
  }

  assert.equal(saveAppState(state, storage), true)

  const loaded = loadAppState(storage)
  assert.equal(loaded.config.days[1].hints.main, 'Pista de prueba')
  assert.equal(loaded.config.days[1].hints.location, 'Ayuda de prueba')
  assert.equal(loaded.config.days[1].hidingSpot, null)
})

test('the parental camera switch round-trips and defaults to enabled on old snapshots', () => {
  const storage = new MemoryStorage()
  const initial = createInitialState()
  const disabled = {
    ...initial,
    config: setCameraEnabled(initial.config, false),
  }

  assert.equal(saveAppState(disabled, storage), true)
  assert.equal(loadAppState(storage).config.parental.cameraEnabled, false)

  storage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      schemaVersion: 1,
      config: { ...initial.config, parental: { pin: null } },
      progress: initial.progress,
    }),
  )
  assert.equal(loadAppState(storage).config.parental.cameraEnabled, true)
})

test('unknown schema and corrupt JSON fall back to defaults', () => {
  const storage = new MemoryStorage()

  storage.setItem(
    STORAGE_KEY,
    JSON.stringify({ schemaVersion: 999, progress: progressWithGift(1) }),
  )
  assert.equal(countStars(loadAppState(storage).progress), 0)

  storage.setItem(STORAGE_KEY, '{')
  assert.equal(countStars(loadAppState(storage).progress), 0)
})

test('a parental PIN survives a storage round-trip and still verifies', async () => {
  const storage = new MemoryStorage()
  const initial = createInitialState()
  const record = await createPinRecord('2468')
  const state = { ...initial, config: setParentalPin(initial.config, record) }

  assert.equal(saveAppState(state, storage), true)

  const loaded = loadAppState(storage)
  assert.ok(loaded.config.parental.pin)
  assert.equal(await verifyPin('2468', loaded.config.parental.pin), true)
  assert.equal(await verifyPin('1357', loaded.config.parental.pin), false)
})

test('a corrupt PIN record is discarded on load instead of crashing', () => {
  const storage = new MemoryStorage()
  const initial = createInitialState()

  storage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      schemaVersion: 1,
      config: {
        ...initial.config,
        parental: {
          pin: { algorithm: 'PBKDF2-SHA-256', iterations: 1, salt: 'x', hash: 'y' },
        },
      },
      progress: initial.progress,
    }),
  )

  assert.equal(loadAppState(storage).config.parental.pin, null)
})

test('save reports failure instead of pretending success', () => {
  const storage = new MemoryStorage()
  storage.setItem = () => {
    throw new Error('quota')
  }

  assert.equal(saveAppState(createInitialState(), storage), false)
  assert.equal(saveAppState(createInitialState(), null), false)
})

test('demo progress is isolated from child progress', () => {
  const storage = new MemoryStorage()
  const childState = { ...createInitialState(), progress: progressWithGift(1) }

  assert.equal(saveAppState(childState, storage), true)
  assert.equal(saveDemoProgress(progressWithGift(2), storage), true)

  const child = loadAppState(storage)
  const demo = loadDemoProgress(storage)

  assert.equal(countStars(child.progress), 1)
  assert.equal(countStars(demo), 1)
  assert.equal(child.progress.days[2], undefined)
  assert.equal(demo.days[1], undefined)
  assert.notEqual(storage.getItem(STORAGE_KEY), storage.getItem(DEMO_STORAGE_KEY))
})

test('resetting one store leaves the other untouched', () => {
  const storage = new MemoryStorage()
  saveAppState({ ...createInitialState(), progress: progressWithGift(1) }, storage)
  saveDemoProgress(progressWithGift(2), storage)

  resetDemoProgress(storage)
  assert.equal(countStars(loadDemoProgress(storage)), 0)
  assert.equal(countStars(loadAppState(storage).progress), 1)

  saveDemoProgress(progressWithGift(2), storage)
  resetAppState(storage)
  assert.equal(countStars(loadAppState(storage).progress), 0)
  assert.equal(countStars(loadDemoProgress(storage)), 1)
})

test('demo reset reports failure instead of pretending success', () => {
  const storage = new MemoryStorage()
  saveDemoProgress(progressWithGift(2), storage)
  storage.removeItem = () => {
    throw new Error('blocked')
  }

  assert.equal(resetDemoProgress(storage), false)
  assert.equal(resetDemoProgress(null), false)
})

test('a repeated gift confirmation still loads as one star', () => {
  const storage = new MemoryStorage()
  const first = new Date('2026-12-01T10:00:00.000Z')
  const later = new Date('2026-12-01T11:00:00.000Z')
  const completed = completeMission(createEmptyProgress(), 1, first)
  const progress = confirmGiftFound(completed, 1, later)

  saveAppState({ ...createInitialState(), progress }, storage)

  const loaded = loadAppState(storage)
  assert.equal(countStars(loaded.progress), 1)
  assert.equal(
    confirmGiftFound(loaded.progress, 1, new Date('2026-12-02T10:00:00.000Z')).days[1]
      ?.giftFoundAt,
    loaded.progress.days[1]?.giftFoundAt,
  )
})
