import { test } from 'node:test'
import { strict as assert } from 'node:assert'
import {
  createDefaultConfig,
  setCameraEnabled,
  setParentalPin,
  updateDaySettings,
} from '../src/domain/config'
import type { PinRecord } from '../src/domain/types'

const PIN_RECORD: PinRecord = {
  algorithm: 'PBKDF2-SHA-256',
  iterations: 120_000,
  salt: 'AAAAAAAAAAAAAAAAAAAAAA==',
  hash: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
}

test('day settings start unconfigured and locked', () => {
  const config = createDefaultConfig()

  assert.equal(config.days[1].hidingSpot, null)
  assert.equal(config.days[1].hints.main, null)
  assert.equal(config.days[1].hints.location, null)
  assert.equal(config.days[1].manuallyUnlocked, false)
  assert.equal(config.parental.pin, null)
  assert.equal(config.parental.cameraEnabled, true)
})

test('updateDaySettings patches one field without dropping the others', () => {
  const initial = createDefaultConfig()
  const withHints = updateDaySettings(initial, 5, {
    hints: { main: 'Mira cerca del árbol', location: 'En el salón' },
    hidingSpot: 'Detrás del sofá',
  })
  const withUnlock = updateDaySettings(withHints, 5, { manuallyUnlocked: true })

  assert.equal(initial.days[5].hints.main, null, 'the input config is not mutated')
  assert.equal(withUnlock.days[5].hints.main, 'Mira cerca del árbol')
  assert.equal(withUnlock.days[5].hints.location, 'En el salón')
  assert.equal(withUnlock.days[5].hidingSpot, 'Detrás del sofá')
  assert.equal(withUnlock.days[5].manuallyUnlocked, true)
  assert.equal(withUnlock.days[6].hints.main, null)
})

test('updateDaySettings can clear a configured value explicitly', () => {
  const configured = updateDaySettings(createDefaultConfig(), 2, {
    hints: { main: 'Pista' },
    hidingSpot: 'Cajón',
  })
  const cleared = updateDaySettings(configured, 2, {
    hints: { main: null },
    hidingSpot: null,
  })

  assert.equal(cleared.days[2].hints.main, null)
  assert.equal(cleared.days[2].hidingSpot, null)
})

test('setParentalPin stores a record and can clear it', () => {
  const withPin = setParentalPin(createDefaultConfig(), PIN_RECORD)
  assert.deepEqual(withPin.parental.pin, PIN_RECORD)

  const cleared = setParentalPin(withPin, null)
  assert.equal(cleared.parental.pin, null)
})

test('the camera switch is local, reversible and keeps other settings', () => {
  const initial = createDefaultConfig()
  const configured = updateDaySettings(initial, 7, {
    hints: { main: 'Pista del karaoke' },
  })

  const disabled = setCameraEnabled(configured, false)
  assert.equal(initial.parental.cameraEnabled, true, 'the input config is not mutated')
  assert.equal(disabled.parental.cameraEnabled, false)
  assert.equal(disabled.days[7].hints.main, 'Pista del karaoke')

  const enabledAgain = setCameraEnabled(disabled, true)
  assert.equal(enabledAgain.parental.cameraEnabled, true)
})
