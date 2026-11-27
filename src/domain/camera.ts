/**
 * Shared camera constraints.
 *
 * Photo capture and the day 7 recording both ask for the same facing mode, so
 * the constraint shape lives here instead of being duplicated per feature.
 */

export type CameraFacing = 'user' | 'environment'

/**
 * `ideal` asks for the chosen side without failing on devices that only
 * expose one camera. The front camera is still the intended default.
 */
export function cameraConstraints(
  facing: CameraFacing,
  withAudio: boolean,
): MediaStreamConstraints {
  return {
    audio: withAudio,
    video: { facingMode: { ideal: facing } },
  }
}
