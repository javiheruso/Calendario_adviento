import { test } from 'node:test'
import { strict as assert } from 'node:assert'
import {
  createPinRecord,
  isValidPinFormat,
  parsePinRecord,
  verifyPin,
} from '../src/security/pin'

test('a PIN accepts only 4 to 8 digits', () => {
  assert.equal(isValidPinFormat('1234'), true)
  assert.equal(isValidPinFormat('12345678'), true)
  assert.equal(isValidPinFormat('123'), false)
  assert.equal(isValidPinFormat('123456789'), false)
  assert.equal(isValidPinFormat('12a4'), false)
  assert.equal(isValidPinFormat(''), false)
})

test('a created PIN verifies only against the same digits', async () => {
  const record = await createPinRecord('2468')

  assert.equal(record.algorithm, 'PBKDF2-SHA-256')
  assert.equal(await verifyPin('2468', record), true)
  assert.equal(await verifyPin('1357', record), false)
  assert.equal(await verifyPin('24680', record), false)
  assert.equal(await verifyPin('246', record), false)
})

test('parsePinRecord round-trips a valid record and rejects tampering', async () => {
  const record = await createPinRecord('1357')

  assert.deepEqual(parsePinRecord(record), record)
  assert.equal(parsePinRecord({ ...record, iterations: 1 }), null)
  assert.equal(parsePinRecord({ ...record, iterations: 10_000_000 }), null)
  assert.equal(parsePinRecord({ ...record, salt: 'not-base64' }), null)
  assert.equal(parsePinRecord({ ...record, hash: record.salt }), null)
  assert.equal(parsePinRecord(null), null)
  assert.equal(parsePinRecord([]), null)
})

test('verifyPin returns false for a tampered record instead of throwing', async () => {
  const record = await createPinRecord('1357')
  const zeroHash = `${'A'.repeat(43)}=`

  assert.equal(await verifyPin('1357', { ...record, hash: record.salt }), false)
  assert.equal(await verifyPin('1357', { ...record, hash: zeroHash }), false)
})
