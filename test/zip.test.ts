import { test } from 'node:test'
import { strict as assert } from 'node:assert'
import {
  ZIP_MAX_ENTRIES,
  ZipLimitError,
  buildZip,
  crc32,
  type ZipEntry,
} from '../src/storage/zip'
import { readZipEntries } from './zipReader'

const DATE = new Date('2026-12-07T10:30:00.000Z')

function entry(name: string, text: string): ZipEntry {
  return {
    name,
    data: new Blob([text], { type: 'text/plain' }),
    lastModified: DATE,
  }
}

test('CRC-32 matches the standard reference value', () => {
  assert.equal(crc32(new TextEncoder().encode('hello')), 0x3610a686)
  assert.equal(crc32(new Uint8Array()), 0)
})

test('ZIP stores entries verbatim with names, sizes and CRCs', async () => {
  const blob = await buildZip([entry('a.txt', 'hello'), entry('folder/b.txt', 'world')])
  const entries = await readZipEntries(blob)

  assert.equal(blob.type, 'application/zip')
  assert.deepEqual(
    entries.map((item) => item.name),
    ['a.txt', 'folder/b.txt'],
  )
  assert.equal(new TextDecoder().decode(entries[0]?.data), 'hello')
  assert.equal(new TextDecoder().decode(entries[1]?.data), 'world')
  assert.equal(entries[0]?.crc, crc32(new TextEncoder().encode('hello')))
  assert.equal(entries[1]?.size, 5)
})

test('ZIP names are UTF-8 encoded and an empty archive is still valid', async () => {
  const utf8 = await readZipEntries(await buildZip([entry('día-7/recuerdo.txt', 'nieve')]))
  assert.equal(utf8[0]?.name, 'día-7/recuerdo.txt')
  assert.equal(new TextDecoder().decode(utf8[0]?.data), 'nieve')

  const empty = await buildZip([])
  const bytes = new Uint8Array(await empty.arrayBuffer())
  assert.equal(new DataView(bytes.buffer).getUint32(0, true), 0x06054b50)
  assert.deepEqual(await readZipEntries(empty), [])
})

test('ZIP refuses more entries than the ZIP32 limit without reading blobs', async () => {
  const tooMany = Array.from({ length: ZIP_MAX_ENTRIES + 1 }, (_, index) =>
    entry(`f-${index}.txt`, ''),
  )

  await assert.rejects(
    buildZip(tooMany),
    (error: unknown) => error instanceof ZipLimitError && error.code === 'too-many-files',
  )
})

test('ZIP refuses archives that exceed the configured byte limit', async () => {
  await assert.rejects(
    buildZip([entry('a.txt', 'hello')], { maxBytes: 10 }),
    (error: unknown) => error instanceof ZipLimitError && error.code === 'too-large',
  )
})
