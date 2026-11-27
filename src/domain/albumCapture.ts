/**
 * Direct camera-photo capture rules for the private album.
 *
 * The browser owns the camera; this module owns the deterministic parts we can
 * test without a DOM: capability decisions, size clamping, the canvas/blob
 * pipeline orchestration and human-friendly file names. A capture never
 * touches storage by itself. The caller freezes the shot, asks for explicit
 * confirmation, and only then writes the blob through the album store.
 */
import { resolveAlbumMediaType } from './album'
import type { MissionDay } from './types'

/** JPEG is widely supported by `canvas.toBlob` and keeps captures small. */
export const PHOTO_CAPTURE_MIME = 'image/jpeg'
export const PHOTO_CAPTURE_QUALITY = 0.9
/** Photos stay readable in the album without creating huge IndexedDB blobs. */
export const PHOTO_CAPTURE_MAX_SIDE = 1600

export interface CaptureFrame {
  /** The live `<video>` element; typed as unknown so tests can pass a mock. */
  readonly source: unknown
  readonly videoWidth: number
  readonly videoHeight: number
}

export interface CaptureCanvasLike {
  width: number
  height: number
}

export interface PhotoCaptureDeps<CanvasType extends CaptureCanvasLike> {
  readonly createCanvas: () => CanvasType | null
  readonly drawFrame: (canvas: CanvasType, frame: CaptureFrame) => boolean
  readonly toBlob: (canvas: CanvasType, mimeType: string) => Promise<Blob | null>
}

export type PhotoCaptureErrorCode =
  | 'not-ready'
  | 'no-canvas'
  | 'draw-failed'
  | 'blob-failed'
  | 'empty-blob'

export type PhotoCaptureOutcome =
  | { readonly ok: true; readonly blob: Blob }
  | { readonly ok: false; readonly code: PhotoCaptureErrorCode }

export type PhotoCaptureCapability = 'ready' | 'no-user-media' | 'no-canvas'

export interface CaptureSize {
  readonly width: number
  readonly height: number
}

function padTwo(value: number): string {
  return String(value).padStart(2, '0')
}

function localStamp(now: Date): string {
  return [
    now.getFullYear(),
    padTwo(now.getMonth() + 1),
    padTwo(now.getDate()),
    '-',
    padTwo(now.getHours()),
    padTwo(now.getMinutes()),
    padTwo(now.getSeconds()),
  ].join('')
}

/** Keeps the aspect ratio and never upscales a small camera frame. */
export function fitCaptureSize(
  videoWidth: number,
  videoHeight: number,
  maxSide: number = PHOTO_CAPTURE_MAX_SIDE,
): CaptureSize | null {
  if (
    !Number.isFinite(videoWidth) ||
    !Number.isFinite(videoHeight) ||
    videoWidth <= 0 ||
    videoHeight <= 0 ||
    !Number.isFinite(maxSide) ||
    maxSide <= 0
  ) {
    return null
  }

  const scale = Math.min(1, maxSide / Math.max(videoWidth, videoHeight))

  return {
    width: Math.max(1, Math.round(videoWidth * scale)),
    height: Math.max(1, Math.round(videoHeight * scale)),
  }
}

/**
 * Capability check used before asking for a camera. A missing canvas writer is
 * as blocking as a missing `getUserMedia`, but both leave gallery import intact.
 */
export function resolvePhotoCaptureCapability(
  hasUserMedia: boolean,
  hasCanvasToBlob: boolean,
): PhotoCaptureCapability {
  if (!hasUserMedia) {
    return 'no-user-media'
  }

  if (!hasCanvasToBlob) {
    return 'no-canvas'
  }

  return 'ready'
}

/**
 * Runs the video-to-canvas-to-blob pipeline with injected primitives. Every
 * failure is reported as a code, so the UI can keep the camera open and offer a
 * retry instead of crashing or claiming a false success.
 */
export async function capturePhotoBlob<CanvasType extends CaptureCanvasLike>(
  frame: CaptureFrame,
  deps: PhotoCaptureDeps<CanvasType>,
  mimeType: string = PHOTO_CAPTURE_MIME,
): Promise<PhotoCaptureOutcome> {
  const size = fitCaptureSize(frame.videoWidth, frame.videoHeight)

  if (!size) {
    return { ok: false, code: 'not-ready' }
  }

  let canvas: CanvasType | null

  try {
    canvas = deps.createCanvas()
  } catch {
    return { ok: false, code: 'no-canvas' }
  }

  if (!canvas) {
    return { ok: false, code: 'no-canvas' }
  }

  canvas.width = size.width
  canvas.height = size.height

  let drawn = false

  try {
    drawn = deps.drawFrame(canvas, frame)
  } catch {
    drawn = false
  }

  if (!drawn) {
    return { ok: false, code: 'draw-failed' }
  }

  let blob: Blob | null

  try {
    blob = await deps.toBlob(canvas, mimeType)
  } catch {
    return { ok: false, code: 'blob-failed' }
  }

  if (!blob) {
    return { ok: false, code: 'blob-failed' }
  }

  if (blob.size <= 0) {
    return { ok: false, code: 'empty-blob' }
  }

  return { ok: true, blob }
}

function extensionForMimeType(mimeType: string): string {
  const resolved = resolveAlbumMediaType(mimeType)
  return resolved?.kind === 'photo' ? resolved.extension : 'jpg'
}

/** Day-first, timestamped name used for downloads and the album card. */
export function photoCaptureFileName(
  day: MissionDay,
  mimeType: string,
  now: Date = new Date(),
): string {
  const stamp = Number.isNaN(now.getTime()) ? 'sin-fecha' : localStamp(now)
  return `foto-dia-${padTwo(day)}-${stamp}.${extensionForMimeType(mimeType)}`
}
