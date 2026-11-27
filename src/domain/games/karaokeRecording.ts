/**
 * Day 7 optional-recording helpers.
 *
 * The album does not exist yet. This module only negotiates a MediaRecorder
 * MIME type and builds camera constraints; the UI owns permissions, preview,
 * the temporary blob URL and track release. Nothing here assumes MP4 support:
 * the candidate list prefers WebM and returns `null` when the browser exposes
 * no explicit preference, so the caller can let MediaRecorder choose.
 */

export { cameraConstraints } from '../camera'
export type { CameraFacing } from '../camera'

/** WebM first, then other containers only when the browser reports support. */
export const KARAOKE_MIME_CANDIDATES = [
  'video/webm;codecs=vp9,opus',
  'video/webm;codecs=vp8,opus',
  'video/webm;codecs=vp8',
  'video/webm',
  'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
  'video/mp4',
  'video/quicktime',
] as const

/**
 * Returns the first supported candidate, or `null` when the browser exposes no
 * explicit support. A `null` result is not a failure: MediaRecorder is then
 * constructed without a `mimeType` option and uses its own default.
 */
export function selectRecorderMimeType(
  isSupported: (mimeType: string) => boolean,
): string | null {
  for (const candidate of KARAOKE_MIME_CANDIDATES) {
    if (isSupported(candidate)) {
      return candidate
    }
  }

  return null
}

/** File extension for a negotiated (or browser-default) recording type. */
export function recorderExtension(
  mimeType: string | null | undefined,
): 'webm' | 'mp4' | 'mov' | 'ogv' {
  const normalized = (mimeType ?? '').toLowerCase()

  if (normalized.includes('quicktime')) {
    return 'mov'
  }

  if (normalized.includes('mp4')) {
    return 'mp4'
  }

  if (normalized.includes('ogg')) {
    return 'ogv'
  }

  return 'webm'
}

export type RecordingCapability =
  | 'ready'
  | 'no-user-media'
  | 'no-media-recorder'

/** Pure browser-capability check used to keep the mission playable. */
export function resolveRecordingCapability(
  hasUserMedia: boolean,
  hasMediaRecorder: boolean,
): RecordingCapability {
  if (!hasUserMedia) {
    return 'no-user-media'
  }

  if (!hasMediaRecorder) {
    return 'no-media-recorder'
  }

  return 'ready'
}
