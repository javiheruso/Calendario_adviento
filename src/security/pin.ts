/**
 * Local parental PIN.
 *
 * The PIN never leaves the device. It is stored as a salted PBKDF2 hash to
 * avoid keeping the digits in clear text, which raises the cost of offline
 * guessing. This is a deterrent for a family device, NOT cryptographic
 * security: anyone with access to the browser storage can replace or remove
 * the record. The spec already states that a local-only configuration cannot
 * protect secrets from a determined adult.
 *
 * Web Crypto requires a secure context (HTTPS or localhost).
 */
import type { PinRecord } from '../domain/types'

export const PIN_MIN_LENGTH = 4
export const PIN_MAX_LENGTH = 8

const ITERATIONS = 120_000
/**
 * Bounds for iteration counts read back from storage. The upper bound keeps a
 * tampered record from turning a verification into a CPU denial of service;
 * the lower bound rejects records too weak to be meaningful.
 */
const MIN_ITERATIONS = 10_000
const MAX_ITERATIONS = 1_000_000
const SALT_BYTES = 16
const KEY_BITS = 256
const HASH_BYTES = KEY_BITS / 8
const PIN_PATTERN = new RegExp(`^\\d{${PIN_MIN_LENGTH},${PIN_MAX_LENGTH}}$`)

export function isValidPinFormat(pin: string): boolean {
  return PIN_PATTERN.test(pin)
}

function toBase64(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }
  return btoa(binary)
}

/**
 * Decodes a canonical Base64 string with an exact byte length.
 * Returns `null` for malformed, non-canonical or wrong-sized input instead of
 * letting `atob` throw. Records are written with `toBase64`, so re-encoding is
 * a safe canonicality check (it also rejects whitespace that `atob` ignores).
 */
function decodeBase64(value: string, expectedBytes: number): Uint8Array<ArrayBuffer> | null {
  let binary: string
  try {
    binary = atob(value)
  } catch {
    return null
  }

  if (binary.length !== expectedBytes) {
    return null
  }

  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }

  return toBase64(bytes) === value ? bytes : null
}

/**
 * Validates an untrusted `PinRecord` shape and its encoded payload.
 * Shared by storage normalization and verification so manipulated records are
 * discarded on load and rejected during verification.
 */
export function parsePinRecord(value: unknown): PinRecord | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return null
  }

  const { algorithm, iterations, salt, hash } = value as Record<string, unknown>
  if (
    algorithm !== 'PBKDF2-SHA-256' ||
    typeof iterations !== 'number' ||
    !Number.isInteger(iterations) ||
    iterations < MIN_ITERATIONS ||
    iterations > MAX_ITERATIONS ||
    typeof salt !== 'string' ||
    typeof hash !== 'string' ||
    decodeBase64(salt, SALT_BYTES) === null ||
    decodeBase64(hash, HASH_BYTES) === null
  ) {
    return null
  }

  return { algorithm, iterations, salt, hash }
}

async function derive(pin: string, salt: BufferSource, iterations: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(pin),
    'PBKDF2',
    false,
    ['deriveBits'],
  )
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations },
    key,
    KEY_BITS,
  )
  return new Uint8Array(bits)
}

function requireWebCrypto(): void {
  if (!globalThis.crypto?.subtle) {
    throw new Error('Web Crypto is unavailable. The parental PIN needs HTTPS or localhost.')
  }
}

export async function createPinRecord(pin: string): Promise<PinRecord> {
  requireWebCrypto()

  if (!isValidPinFormat(pin)) {
    throw new Error(`PIN must be ${PIN_MIN_LENGTH} to ${PIN_MAX_LENGTH} digits.`)
  }

  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES))
  const hash = await derive(pin, salt, ITERATIONS)

  return {
    algorithm: 'PBKDF2-SHA-256',
    iterations: ITERATIONS,
    salt: toBase64(salt),
    hash: toBase64(hash),
  }
}

/**
 * Returns `false` for any invalid input or storage-corrupted record instead of
 * throwing, so a tampered PIN can only deny access, never crash the UI.
 */
export async function verifyPin(pin: string, record: PinRecord): Promise<boolean> {
  if (!isValidPinFormat(pin) || !globalThis.crypto?.subtle) {
    return false
  }

  const parsed = parsePinRecord(record)
  if (!parsed) {
    return false
  }

  const expected = decodeBase64(parsed.hash, HASH_BYTES)
  const salt = decodeBase64(parsed.salt, SALT_BYTES)
  if (!expected || !salt) {
    return false
  }

  try {
    const actual = await derive(pin, salt, parsed.iterations)

    if (expected.length !== actual.length) {
      return false
    }

    let difference = 0
    for (let index = 0; index < expected.length; index += 1) {
      difference |= expected[index] ^ actual[index]
    }

    return difference === 0
  } catch {
    return false
  }
}
