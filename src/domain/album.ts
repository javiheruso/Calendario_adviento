/**
 * Private album domain rules.
 *
 * The album is local-only: metadata lives in IndexedDB next to the blobs, and
 * nothing here performs network work. These helpers stay pure so the storage
 * adapter, the parental panel and the day 7 recording can share the same
 * validation, naming and sorting rules without a browser test runner.
 */
import type { MissionDay } from './types'

export type AlbumMediaKind = 'photo' | 'video'
export type AlbumMediaSource = 'recording' | 'import' | 'capture'

/** Metadata stored in IndexedDB. The blob itself lives in another store. */
export interface AlbumMediaMetadata {
  readonly id: string
  readonly day: MissionDay
  readonly kind: AlbumMediaKind
  readonly mimeType: string
  readonly fileName: string
  readonly byteSize: number
  readonly createdAt: string
  readonly source: AlbumMediaSource
}

export interface NewAlbumMetadataInput {
  readonly day: MissionDay
  readonly mimeType: string
  readonly fileName?: string | null
  readonly byteSize: number
  readonly source: AlbumMediaSource
}

export interface AlbumMetadataOptions {
  readonly id: string
  readonly now: Date
}

export type AlbumValidationCode =
  | 'invalid-day'
  | 'invalid-size'
  | 'invalid-date'
  | 'invalid-id'
  | 'unsupported-type'
  | 'empty-album'

export class AlbumValidationError extends Error {
  readonly code: AlbumValidationCode

  constructor(code: AlbumValidationCode, message: string) {
    super(message)
    this.name = 'AlbumValidationError'
    this.code = code
  }
}

export interface ResolvedAlbumMediaType {
  readonly kind: AlbumMediaKind
  readonly mimeType: string
  readonly extension: string
}

const MIME_BY_EXTENSION: Readonly<Record<string, string>> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  avif: 'image/avif',
  heic: 'image/heic',
  heif: 'image/heif',
  bmp: 'image/bmp',
  svg: 'image/svg+xml',
  mp4: 'video/mp4',
  m4v: 'video/mp4',
  webm: 'video/webm',
  mov: 'video/quicktime',
  ogv: 'video/ogg',
  ogg: 'video/ogg',
  '3gp': 'video/3gp',
}

const EXTENSION_BY_MIME: Readonly<Record<string, string>> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/avif': 'avif',
  'image/heic': 'heic',
  'image/heif': 'heif',
  'image/bmp': 'bmp',
  'image/svg+xml': 'svg',
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'video/quicktime': 'mov',
  'video/ogg': 'ogv',
  'video/3gp': '3gp',
}

function padTwo(value: number): string {
  return String(value).padStart(2, '0')
}

function normalizeMimeType(mimeType: string): string {
  return mimeType.toLowerCase().split(';')[0]?.trim() ?? ''
}

function fileNameExtension(fileName: string | null | undefined): string {
  if (!fileName) {
    return ''
  }

  const baseName = fileName.split(/[\\/]/).pop() ?? ''
  const dot = baseName.lastIndexOf('.')

  if (dot <= 0 || dot === baseName.length - 1) {
    return ''
  }

  const extension = baseName.slice(dot + 1).toLowerCase()
  return /^[a-z0-9]+$/.test(extension) ? extension : ''
}

function extensionForMimeType(mimeType: string, fallbackName?: string | null): string {
  const known = EXTENSION_BY_MIME[mimeType]

  if (known) {
    return known
  }

  const subtype = mimeType.includes('/') ? mimeType.slice(mimeType.indexOf('/') + 1) : ''
  const baseSubtype = subtype.split('+')[0] ?? ''

  if (/^[a-z0-9]+$/.test(baseSubtype)) {
    return baseSubtype
  }

  return fileNameExtension(fallbackName) || 'bin'
}

/**
 * Resolves a photo/video from its MIME type, falling back to the file
 * extension when the browser reports an empty or generic type.
 */
export function resolveAlbumMediaType(
  mimeType: string,
  fileName?: string | null,
): ResolvedAlbumMediaType | null {
  const normalized = normalizeMimeType(mimeType)

  if (normalized.startsWith('image/') || normalized.startsWith('video/')) {
    return {
      kind: normalized.startsWith('image/') ? 'photo' : 'video',
      mimeType: normalized,
      extension: extensionForMimeType(normalized, fileName),
    }
  }

  if (
    normalized.length > 0 &&
    normalized !== 'application/octet-stream' &&
    normalized !== 'binary/octet-stream'
  ) {
    return null
  }

  const inferred = MIME_BY_EXTENSION[fileNameExtension(fileName)]

  if (!inferred) {
    return null
  }

  return {
    kind: inferred.startsWith('image/') ? 'photo' : 'video',
    mimeType: inferred,
    extension: EXTENSION_BY_MIME[inferred] ?? fileNameExtension(fileName),
  }
}

/** Strips path separators and characters that are invalid in downloads. */
export function sanitizeAlbumFileName(
  fileName: string | null | undefined,
  fallbackBase: string,
  extension: string,
): string {
  const raw = (fileName ?? '').split(/[\\/]/).pop() ?? ''
  const withoutControls = Array.from(raw, (character) =>
    character.charCodeAt(0) < 32 ? '-' : character,
  ).join('')
  const cleaned = withoutControls
    .replace(/[<>:"/\\|?*]+/g, '-')
    .replace(/\s+/g, ' ')
    .replace(/^[.\s]+|[.\s]+$/g, '')
    .trim()
  const base = cleaned.length > 0 ? cleaned : fallbackBase
  const truncated = base.length > 120 ? base.slice(0, 120) : base

  if (/\.[a-z0-9]{1,10}$/i.test(truncated)) {
    return truncated
  }

  return `${truncated}.${extension}`
}

/**
 * Validates a new media file and returns the exact metadata to store. The
 * caller must save it before showing a success message.
 */
export function buildAlbumMediaMetadata(
  input: NewAlbumMetadataInput,
  options: AlbumMetadataOptions,
): AlbumMediaMetadata {
  if (!Number.isInteger(input.day) || input.day < 1 || input.day > 24) {
    throw new AlbumValidationError('invalid-day', 'The mission day must be between 1 and 24.')
  }

  if (!Number.isInteger(input.byteSize) || input.byteSize <= 0) {
    throw new AlbumValidationError('invalid-size', 'The media file must not be empty.')
  }

  if (!options.id.trim()) {
    throw new AlbumValidationError('invalid-id', 'The media id must not be empty.')
  }

  if (Number.isNaN(options.now.getTime())) {
    throw new AlbumValidationError('invalid-date', 'The creation date is not valid.')
  }

  const resolved = resolveAlbumMediaType(input.mimeType, input.fileName)

  if (!resolved) {
    throw new AlbumValidationError(
      'unsupported-type',
      'Only photo and video files can be stored in the album.',
    )
  }

  const fallbackBase =
    input.source === 'recording'
      ? `grabacion-dia-${padTwo(input.day)}`
      : input.source === 'capture'
        ? `foto-dia-${padTwo(input.day)}`
        : `recuerdo-dia-${padTwo(input.day)}`

  return {
    id: options.id,
    day: input.day,
    kind: resolved.kind,
    mimeType: resolved.mimeType,
    fileName: sanitizeAlbumFileName(input.fileName, fallbackBase, resolved.extension),
    byteSize: input.byteSize,
    createdAt: options.now.toISOString(),
    source: input.source,
  }
}

/** Stable id for a new album record. */
export function createAlbumMediaId(now: Date = new Date()): string {
  const uuid =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${now.getTime().toString(36)}-${Math.random().toString(36).slice(2, 10)}`

  return `album-${uuid}`
}

/** Groups run by day ascending; within a day the newest memory comes first. */
export function sortAlbumMedia(
  entries: readonly AlbumMediaMetadata[],
): AlbumMediaMetadata[] {
  return [...entries].sort(
    (left, right) =>
      left.day - right.day ||
      Date.parse(right.createdAt) - Date.parse(left.createdAt) ||
      left.id.localeCompare(right.id),
  )
}

export interface AlbumDayGroup {
  readonly day: MissionDay
  readonly entries: readonly AlbumMediaMetadata[]
  readonly byteSize: number
}

export function groupAlbumMediaByDay(
  entries: readonly AlbumMediaMetadata[],
): AlbumDayGroup[] {
  const groups = new Map<MissionDay, AlbumMediaMetadata[]>()

  for (const entry of sortAlbumMedia(entries)) {
    const current = groups.get(entry.day) ?? []
    current.push(entry)
    groups.set(entry.day, current)
  }

  return Array.from(groups.entries()).map(([day, groupEntries]) => ({
    day,
    entries: groupEntries,
    byteSize: groupEntries.reduce((total, entry) => total + entry.byteSize, 0),
  }))
}

export function albumTotalBytes(entries: readonly AlbumMediaMetadata[]): number {
  return entries.reduce((total, entry) => total + entry.byteSize, 0)
}

export interface AlbumZipManifestEntry {
  readonly media: AlbumMediaMetadata
  readonly name: string
}

/**
 * Assigns unique, day-first names for the ZIP archive. The rendered order
 * matches the album list; the counters are per day and media kind.
 */
export function buildAlbumZipManifest(
  entries: readonly AlbumMediaMetadata[],
): AlbumZipManifestEntry[] {
  const counters = new Map<string, number>()

  return sortAlbumMedia(entries).map((media) => {
    const key = `${media.day}:${media.kind}`
    const index = (counters.get(key) ?? 0) + 1
    counters.set(key, index)
    const resolved = resolveAlbumMediaType(media.mimeType, media.fileName)
    const extension = resolved?.extension ?? 'bin'
    const kindFolder = media.kind === 'photo' ? 'foto' : 'video'

    return {
      media,
      name: `dia-${padTwo(media.day)}/${kindFolder}-${padTwo(index)}.${extension}`,
    }
  })
}

function localDateStamp(date: Date): string {
  return `${date.getFullYear()}-${padTwo(date.getMonth() + 1)}-${padTwo(date.getDate())}`
}

export function albumExportArchiveName(now: Date = new Date()): string {
  return `recuerdos-calendario-${localDateStamp(now)}.zip`
}

export function albumExportReadme(now: Date, mediaCount: number): string {
  return [
    'Los 24 regalos desaparecidos — Álbum privado',
    '',
    `Exportado: ${now.toISOString()}`,
    `Recuerdos incluidos: ${mediaCount}`,
    '',
    'Este ZIP se ha generado en el dispositivo. No se ha subido a ningún servidor.',
    'Guarda una copia fuera del navegador: borrar los datos del navegador o',
    'desinstalar la aplicación puede eliminar el álbum original.',
    '',
  ].join('\n')
}

/** Input passed from day 7 to the app-owned album writer. */
export interface SaveRecordingToAlbumInput {
  readonly day: MissionDay
  readonly blob: Blob
  readonly mimeType: string
  readonly fileName: string
}

/** Explicit result: the UI may only claim success when `ok` is true. */
export type AlbumSaveOutcome =
  | { readonly ok: true; readonly media: AlbumMediaMetadata }
  | { readonly ok: false; readonly error: unknown }

/** Human-readable size for the parental album and storage notices. */
export function formatByteSize(bytes: number | null | undefined): string {
  if (bytes === null || bytes === undefined || !Number.isFinite(bytes) || bytes < 0) {
    return '—'
  }

  if (bytes < 1024) {
    return `${Math.round(bytes)} B`
  }

  const units = ['KB', 'MB', 'GB', 'TB']
  let value = bytes / 1024
  let unit = 0

  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024
    unit += 1
  }

  const rounded = value >= 10 ? value.toFixed(0) : value.toFixed(1)
  return `${rounded.replace('.', ',')} ${units[unit]}`
}
