/**
 * Minimal ZIP32 reader for tests only. It understands the STORE method that
 * `src/storage/zip.ts` writes and is intentionally strict about signatures.
 */

export interface ParsedZipEntry {
  readonly name: string
  readonly data: Uint8Array
  readonly crc: number
  readonly size: number
}

export async function readZipEntries(blob: Blob): Promise<ParsedZipEntry[]> {
  const bytes = new Uint8Array(await blob.arrayBuffer())
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  const decoder = new TextDecoder()
  const entries: ParsedZipEntry[] = []
  let offset = 0

  while (offset + 4 <= bytes.byteLength && view.getUint32(offset, true) === 0x04034b50) {
    const method = view.getUint16(offset + 8, true)
    const crc = view.getUint32(offset + 14, true)
    const compressedSize = view.getUint32(offset + 18, true)
    const size = view.getUint32(offset + 22, true)
    const nameLength = view.getUint16(offset + 26, true)
    const extraLength = view.getUint16(offset + 28, true)

    if (method !== 0) {
      throw new Error(`Unsupported ZIP method ${method}`)
    }

    const nameStart = offset + 30
    const name = decoder.decode(bytes.slice(nameStart, nameStart + nameLength))
    const dataStart = nameStart + nameLength + extraLength
    const data = bytes.slice(dataStart, dataStart + compressedSize)

    entries.push({ name, data, crc, size })
    offset = dataStart + compressedSize
  }

  return entries
}
