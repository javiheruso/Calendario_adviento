import { test } from 'node:test'
import { strict as assert } from 'node:assert'
import {
  AlbumValidationError,
  albumExportArchiveName,
  albumExportReadme,
  albumTotalBytes,
  buildAlbumMediaMetadata,
  buildAlbumZipManifest,
  formatByteSize,
  groupAlbumMediaByDay,
  resolveAlbumMediaType,
  sanitizeAlbumFileName,
  sortAlbumMedia,
  type AlbumMediaMetadata,
} from '../src/domain/album'

const NOW = new Date('2026-12-07T10:30:00.000Z')

function metadata(
  overrides: Partial<AlbumMediaMetadata> & Pick<AlbumMediaMetadata, 'id' | 'day'>,
): AlbumMediaMetadata {
  return {
    kind: 'photo',
    mimeType: 'image/jpeg',
    fileName: 'recuerdo.jpg',
    byteSize: 100,
    createdAt: '2026-12-07T10:00:00.000Z',
    source: 'import',
    ...overrides,
  }
}

test('album media types resolve from MIME types and file extensions', () => {
  assert.deepEqual(resolveAlbumMediaType('image/jpeg', 'photo.jpg'), {
    kind: 'photo',
    mimeType: 'image/jpeg',
    extension: 'jpg',
  })
  assert.deepEqual(resolveAlbumMediaType('', 'VIDEO.MOV'), {
    kind: 'video',
    mimeType: 'video/quicktime',
    extension: 'mov',
  })
  assert.deepEqual(resolveAlbumMediaType('application/octet-stream', 'clip.mp4'), {
    kind: 'video',
    mimeType: 'video/mp4',
    extension: 'mp4',
  })
  assert.equal(resolveAlbumMediaType('text/plain', 'notes.txt'), null)
  assert.equal(resolveAlbumMediaType('text/plain', 'fake.jpg'), null)
  assert.equal(resolveAlbumMediaType('', 'README'), null)
})

test('file names are sanitized and receive an extension when missing', () => {
  assert.equal(sanitizeAlbumFileName('../../foto: playa', 'recuerdo', 'jpg'), 'foto- playa.jpg')
  assert.equal(sanitizeAlbumFileName('   ', 'recuerdo-dia-07', 'webm'), 'recuerdo-dia-07.webm')
  assert.equal(sanitizeAlbumFileName('clip.webm', 'grabacion', 'webm'), 'clip.webm')
})

test('metadata is built only after validating day, size, date, id and type', () => {
  const built = buildAlbumMediaMetadata(
    {
      day: 7,
      mimeType: 'video/webm',
      fileName: 'villancico.webm',
      byteSize: 2048,
      source: 'recording',
    },
    { id: 'album-1', now: NOW },
  )

  assert.deepEqual(built, {
    id: 'album-1',
    day: 7,
    kind: 'video',
    mimeType: 'video/webm',
    fileName: 'villancico.webm',
    byteSize: 2048,
    createdAt: NOW.toISOString(),
    source: 'recording',
  })

  const cases: Array<{
    input: Parameters<typeof buildAlbumMediaMetadata>[0]
    code: string
  }> = [
    {
      input: { day: 0 as never, mimeType: 'image/jpeg', byteSize: 1, source: 'import' },
      code: 'invalid-day',
    },
    {
      input: { day: 7, mimeType: 'image/jpeg', byteSize: 0, source: 'import' },
      code: 'invalid-size',
    },
    {
      input: { day: 7, mimeType: 'text/plain', byteSize: 1, source: 'import' },
      code: 'unsupported-type',
    },
  ]

  for (const item of cases) {
    assert.throws(
      () => buildAlbumMediaMetadata(item.input, { id: 'album-1', now: NOW }),
      (error: unknown) =>
        error instanceof AlbumValidationError && error.code === item.code,
    )
  }

  assert.throws(
    () =>
      buildAlbumMediaMetadata(
        { day: 7, mimeType: 'image/jpeg', byteSize: 1, source: 'import' },
        { id: '', now: NOW },
      ),
    (error: unknown) =>
      error instanceof AlbumValidationError && error.code === 'invalid-id',
  )

  assert.throws(
    () =>
      buildAlbumMediaMetadata(
        { day: 7, mimeType: 'image/jpeg', byteSize: 1, source: 'import' },
        { id: 'album-1', now: new Date('not-a-date') },
      ),
    (error: unknown) =>
      error instanceof AlbumValidationError && error.code === 'invalid-date',
  )
})

test('camera captures keep their source and day-first fallback name', () => {
  const built = buildAlbumMediaMetadata(
    {
      day: 7,
      mimeType: 'image/jpeg',
      fileName: null,
      byteSize: 1024,
      source: 'capture',
    },
    { id: 'album-capture', now: NOW },
  )

  assert.equal(built.source, 'capture')
  assert.equal(built.kind, 'photo')
  assert.equal(built.fileName, 'foto-dia-07.jpg')
})

test('album listing groups by day and sorts newest first inside each day', () => {
  const entries = [
    metadata({ id: 'b', day: 7, createdAt: '2026-12-07T10:00:00.000Z' }),
    metadata({ id: 'a', day: 7, createdAt: '2026-12-07T12:00:00.000Z', byteSize: 50 }),
    metadata({ id: 'c', day: 1, createdAt: '2026-12-01T09:00:00.000Z', byteSize: 25 }),
  ]

  assert.deepEqual(
    sortAlbumMedia(entries).map((entry) => entry.id),
    ['c', 'a', 'b'],
  )

  const groups = groupAlbumMediaByDay(entries)
  assert.deepEqual(
    groups.map((group) => group.day),
    [1, 7],
  )
  assert.deepEqual(
    groups[1]?.entries.map((entry) => entry.id),
    ['a', 'b'],
  )
  assert.equal(groups[1]?.byteSize, 150)
  assert.equal(albumTotalBytes(entries), 175)
})

test('ZIP manifest uses unique day and kind names with zero padding', () => {
  const entries = [
    metadata({ id: 'p1', day: 1, kind: 'photo', mimeType: 'image/jpeg' }),
    metadata({ id: 'p2', day: 7, kind: 'photo', mimeType: 'image/png', fileName: 'a.png' }),
    metadata({
      id: 'v1',
      day: 7,
      kind: 'video',
      mimeType: 'video/webm',
      fileName: 'b.webm',
    }),
    metadata({ id: 'v2', day: 7, kind: 'video', mimeType: 'video/quicktime' }),
  ]

  const manifest = buildAlbumZipManifest(entries)
  const byId = new Map(manifest.map((item) => [item.media.id, item.name]))

  assert.equal(byId.get('p1'), 'dia-01/foto-01.jpg')
  assert.equal(byId.get('p2'), 'dia-07/foto-01.png')
  assert.equal(byId.get('v1'), 'dia-07/video-01.webm')
  assert.equal(byId.get('v2'), 'dia-07/video-02.mov')
})

test('archive name, README and byte formatting are stable for the UI', () => {
  assert.equal(albumExportArchiveName(new Date(2026, 11, 7, 10, 0)), 'recuerdos-calendario-2026-12-07.zip')

  const readme = albumExportReadme(NOW, 3)
  assert.match(readme, /Recuerdos incluidos: 3/)
  assert.match(readme, /no se ha subido a ningún servidor/i)

  assert.equal(formatByteSize(512), '512 B')
  assert.equal(formatByteSize(1536), '1,5 KB')
  assert.equal(formatByteSize(5 * 1024 * 1024), '5,0 MB')
  assert.equal(formatByteSize(null), '—')
})
