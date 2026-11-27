/**
 * Dependency-free ZIP writer (STORE method, no compression).
 *
 * Photos and videos are already compressed, so storing them verbatim avoids a
 * dependency and keeps the archive streamable by every standard unzip tool.
 * The writer follows the classic ZIP32 layout and reports explicit limits
 * instead of silently producing a broken archive:
 *
 * - at most 65,535 entries;
 * - at most 4,294,967,295 bytes per offset or file (no ZIP64).
 *
 * A caller that hits a limit must fall back to individual downloads.
 */

export interface ZipEntry {
  readonly name: string
  readonly data: Blob
  readonly lastModified: Date
}

export type ZipLimitCode = 'too-many-files' | 'too-large'

export class ZipLimitError extends Error {
  readonly code: ZipLimitCode

  constructor(code: ZipLimitCode, message: string) {
    super(message)
    this.name = 'ZipLimitError'
    this.code = code
  }
}

export const ZIP_MAX_ENTRIES = 0xffff
export const ZIP_MAX_BYTES = 0xffffffff

export interface ZipLimits {
  readonly maxEntries?: number
  readonly maxBytes?: number
}

const UTF8_FLAG = 0x0800
const STORE_METHOD = 0
const VERSION = 20

let crcTable: Uint32Array | null = null

function getCrcTable(): Uint32Array {
  if (crcTable) {
    return crcTable
  }

  const table = new Uint32Array(256)

  for (let index = 0; index < 256; index += 1) {
    let value = index

    for (let bit = 0; bit < 8; bit += 1) {
      value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1
    }

    table[index] = value >>> 0
  }

  crcTable = table
  return table
}

/** CRC-32 as required by the ZIP local and central headers. */
export function crc32(bytes: Uint8Array): number {
  const table = getCrcTable()
  let crc = 0xffffffff

  for (const byte of bytes) {
    crc = table[(crc ^ byte) & 0xff]! ^ (crc >>> 8)
  }

  return (crc ^ 0xffffffff) >>> 0
}

function dosDateTime(date: Date): { time: number; date: number } {
  const valid = Number.isNaN(date.getTime()) ? new Date() : date
  const year = Math.min(2107, Math.max(1980, valid.getFullYear()))
  const month = valid.getMonth() + 1
  const day = valid.getDate()
  const hours = valid.getHours()
  const minutes = valid.getMinutes()
  const seconds = Math.floor(valid.getSeconds() / 2)

  return {
    time: (hours << 11) | (minutes << 5) | seconds,
    date: ((year - 1980) << 9) | (month << 5) | day,
  }
}

function writeUint16(view: DataView, offset: number, value: number): void {
  view.setUint16(offset, value, true)
}

function writeUint32(view: DataView, offset: number, value: number): void {
  view.setUint32(offset, value, true)
}

function createLocalHeader(
  name: Uint8Array,
  crc: number,
  size: number,
  lastModified: Date,
): Uint8Array<ArrayBuffer> {
  const header = new Uint8Array(30 + name.length)
  const view = new DataView(header.buffer)
  const timestamp = dosDateTime(lastModified)

  writeUint32(view, 0, 0x04034b50)
  writeUint16(view, 4, VERSION)
  writeUint16(view, 6, UTF8_FLAG)
  writeUint16(view, 8, STORE_METHOD)
  writeUint16(view, 10, timestamp.time)
  writeUint16(view, 12, timestamp.date)
  writeUint32(view, 14, crc)
  writeUint32(view, 18, size)
  writeUint32(view, 22, size)
  writeUint16(view, 26, name.length)
  writeUint16(view, 28, 0)
  header.set(name, 30)

  return header
}

function createCentralHeader(
  name: Uint8Array,
  crc: number,
  size: number,
  lastModified: Date,
  localOffset: number,
): Uint8Array<ArrayBuffer> {
  const header = new Uint8Array(46 + name.length)
  const view = new DataView(header.buffer)
  const timestamp = dosDateTime(lastModified)

  writeUint32(view, 0, 0x02014b50)
  writeUint16(view, 4, VERSION)
  writeUint16(view, 6, VERSION)
  writeUint16(view, 8, UTF8_FLAG)
  writeUint16(view, 10, STORE_METHOD)
  writeUint16(view, 12, timestamp.time)
  writeUint16(view, 14, timestamp.date)
  writeUint32(view, 16, crc)
  writeUint32(view, 20, size)
  writeUint32(view, 24, size)
  writeUint16(view, 28, name.length)
  writeUint16(view, 30, 0)
  writeUint16(view, 32, 0)
  writeUint16(view, 34, 0)
  writeUint16(view, 36, 0)
  writeUint32(view, 38, 0)
  writeUint32(view, 42, localOffset)
  header.set(name, 46)

  return header
}

function createEndOfCentralDirectory(
  entryCount: number,
  centralSize: number,
  centralOffset: number,
): Uint8Array<ArrayBuffer> {
  const header = new Uint8Array(22)
  const view = new DataView(header.buffer)

  writeUint32(view, 0, 0x06054b50)
  writeUint16(view, 4, 0)
  writeUint16(view, 6, 0)
  writeUint16(view, 8, entryCount)
  writeUint16(view, 10, entryCount)
  writeUint32(view, 12, centralSize)
  writeUint32(view, 16, centralOffset)
  writeUint16(view, 20, 0)

  return header
}

/**
 * Builds a ZIP32 archive with the STORE method. Entries keep the order given
 * by the caller, and names are encoded as UTF-8. Throws `ZipLimitError` when
 * the archive cannot be represented without ZIP64.
 */
export async function buildZip(
  entries: readonly ZipEntry[],
  limits: ZipLimits = {},
): Promise<Blob> {
  const maxEntries = limits.maxEntries ?? ZIP_MAX_ENTRIES
  const maxBytes = limits.maxBytes ?? ZIP_MAX_BYTES

  if (entries.length > maxEntries) {
    throw new ZipLimitError(
      'too-many-files',
      `The ZIP archive exceeds the ${maxEntries} entry limit.`,
    )
  }

  const encoder = new TextEncoder()
  const parts: BlobPart[] = []
  const centralHeaders: Uint8Array<ArrayBuffer>[] = []
  let offset = 0

  for (const entry of entries) {
    if (entry.data.size > maxBytes) {
      throw new ZipLimitError('too-large', 'A file is too large for a ZIP32 archive.')
    }

    const name = encoder.encode(entry.name)
    const bytes = new Uint8Array(await entry.data.arrayBuffer())

    if (bytes.byteLength > maxBytes) {
      throw new ZipLimitError('too-large', 'A file is too large for a ZIP32 archive.')
    }

    const crc = crc32(bytes)
    const localHeader = createLocalHeader(name, crc, bytes.byteLength, entry.lastModified)

    if (offset + localHeader.length + bytes.byteLength > maxBytes) {
      throw new ZipLimitError('too-large', 'The ZIP archive exceeds the ZIP32 size limit.')
    }

    centralHeaders.push(
      createCentralHeader(name, crc, bytes.byteLength, entry.lastModified, offset),
    )
    parts.push(localHeader, bytes)
    offset += localHeader.length + bytes.byteLength
  }

  const centralOffset = offset
  let centralSize = 0

  for (const header of centralHeaders) {
    parts.push(header)
    centralSize += header.length
  }

  if (centralOffset + centralSize > maxBytes) {
    throw new ZipLimitError('too-large', 'The ZIP archive exceeds the ZIP32 size limit.')
  }

  parts.push(createEndOfCentralDirectory(entries.length, centralSize, centralOffset))

  return new Blob(parts, { type: 'application/zip' })
}
