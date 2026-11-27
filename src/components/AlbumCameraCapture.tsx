import { useCallback, useEffect, useRef, useState } from 'react'
import type { AlbumMediaMetadata } from '../domain/album'
import {
  PHOTO_CAPTURE_MIME,
  PHOTO_CAPTURE_QUALITY,
  capturePhotoBlob,
  photoCaptureFileName,
  resolvePhotoCaptureCapability,
  type PhotoCaptureDeps,
} from '../domain/albumCapture'
import { getAsset } from '../domain/assets'
import { cameraConstraints, type CameraFacing } from '../domain/camera'
import type { MissionDay } from '../domain/types'
import type { AlbumStore } from '../storage/albumStore'
import { albumErrorMessage, captureErrorMessage } from './albumMessages'
import { AssetGlyph } from './AssetGlyph'

type CameraState = 'idle' | 'requesting' | 'ready' | 'error'
type SaveState = 'idle' | 'saving' | 'saved' | 'error'

interface CapturedShot {
  readonly blob: Blob
  readonly url: string
}

interface AlbumCameraCaptureProps {
  store: AlbumStore
  day: MissionDay
  /** Local parental switch; when false the component never calls getUserMedia. */
  cameraEnabled: boolean
  onSaved: (media: AlbumMediaMetadata) => void
  onClose: () => void
}

function stopStream(stream: MediaStream | null): void {
  if (!stream) {
    return
  }

  for (const track of stream.getTracks()) {
    track.stop()
  }
}

function hasUserMediaSupport(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    typeof navigator.mediaDevices?.getUserMedia === 'function'
  )
}

function hasCanvasPhotoSupport(): boolean {
  if (typeof document === 'undefined') {
    return false
  }

  try {
    return typeof document.createElement('canvas').toBlob === 'function'
  } catch {
    return false
  }
}

function errorName(error: unknown): string {
  return typeof error === 'object' && error !== null && 'name' in error
    ? String((error as { name: unknown }).name)
    : ''
}

function cameraErrorMessage(
  error: unknown,
  facing: CameraFacing,
  switched: boolean,
): string {
  const name = errorName(error)
  const side = facing === 'user' ? 'frontal' : 'trasera'

  if (name === 'NotAllowedError' || name === 'SecurityError') {
    return 'No hay permiso para usar la cámara. Puedes seguir usando la importación desde la galería. Revisa el permiso del sitio si quieres intentarlo otra vez.'
  }

  if (name === 'NotFoundError' || name === 'OverconstrainedError') {
    return `Este dispositivo no tiene una cámara ${side} disponible. Prueba la otra cámara o usa la importación desde la galería.`
  }

  if (name === 'NotReadableError' || name === 'AbortError') {
    return 'La cámara está ocupada o no se puede leer ahora mismo. Cierra otras apps que la usen y reintenta, o importa una foto desde la galería.'
  }

  return switched
    ? `No se pudo cambiar a la cámara ${side}. Prueba la otra cámara o usa la importación desde la galería.`
    : 'No se pudo abrir la cámara. Reintenta o usa la importación desde la galería.'
}

/**
 * Adult-only direct photo capture for the private album.
 *
 * The component only mounts inside the unlocked album panel, so the child
 * calendar never requests a camera. It asks for the front camera by default,
 * allows switching to the rear camera before capture, freezes the shot for
 * review, and saves only after the explicit button press. Leaving, cancelling,
 * discarding or capturing always stops every camera track.
 */
export function AlbumCameraCapture({
  store,
  day,
  cameraEnabled,
  onSaved,
  onClose,
}: AlbumCameraCaptureProps) {
  const [facing, setFacing] = useState<CameraFacing>('user')
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [cameraState, setCameraState] = useState<CameraState>('idle')
  const [notice, setNotice] = useState<string | null>(null)
  const [shot, setShot] = useState<CapturedShot | null>(null)
  const [capturing, setCapturing] = useState(false)
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [saveError, setSaveError] = useState<string | null>(null)

  const mountedRef = useRef(true)
  const requestRef = useRef(0)
  const streamRef = useRef<MediaStream | null>(null)
  const shotUrlRef = useRef<string | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)

  const [capability] = useState(() =>
    resolvePhotoCaptureCapability(hasUserMediaSupport(), hasCanvasPhotoSupport()),
  )
  const cameraAvailable = cameraEnabled && capability === 'ready'

  const releaseCamera = useCallback(() => {
    requestRef.current += 1
    stopStream(streamRef.current)
    streamRef.current = null
    setStream(null)
  }, [])

  const clearShot = useCallback(() => {
    if (shotUrlRef.current) {
      URL.revokeObjectURL(shotUrlRef.current)
      shotUrlRef.current = null
    }

    setShot(null)
  }, [])

  const requestCamera = useCallback(
    async (nextFacing: CameraFacing, switched: boolean) => {
      if (!cameraEnabled) {
        return
      }

      if (!hasUserMediaSupport()) {
        setCameraState('error')
        setNotice(
          'Este navegador no ofrece cámara. Puedes seguir usando la importación desde la galería.',
        )
        return
      }

      releaseCamera()
      const requestId = requestRef.current

      setNotice(null)
      setCameraState('requesting')

      try {
        const nextStream = await navigator.mediaDevices.getUserMedia(
          cameraConstraints(nextFacing, false),
        )

        if (!mountedRef.current || requestId !== requestRef.current) {
          stopStream(nextStream)
          return
        }

        streamRef.current = nextStream
        setStream(nextStream)
        setCameraState('ready')
      } catch (error) {
        if (!mountedRef.current || requestId !== requestRef.current) {
          return
        }

        streamRef.current = null
        setStream(null)
        setCameraState('error')
        setNotice(cameraErrorMessage(error, nextFacing, switched))
      }
    },
    [cameraEnabled, releaseCamera],
  )

  useEffect(() => {
    mountedRef.current = true

    return () => {
      mountedRef.current = false
      requestRef.current += 1
      stopStream(streamRef.current)
      streamRef.current = null

      if (shotUrlRef.current) {
        URL.revokeObjectURL(shotUrlRef.current)
        shotUrlRef.current = null
      }
    }
  }, [])

  // The front camera is requested only when the adult opens the capture panel
  // and the parental switch allows it. A late request is stopped by the cleanup
  // above; disabling the switch also invalidates an in-flight request.
  useEffect(() => {
    if (!cameraAvailable) {
      return
    }

    // The camera is an external system; this effect starts the permission
    // request and the state updates describe the browser response.
    // oxlint-disable-next-line react/set-state-in-effect
    void requestCamera('user', false)

    return () => {
      requestRef.current += 1
      stopStream(streamRef.current)
      streamRef.current = null
    }
  }, [cameraAvailable, requestCamera])

  useEffect(() => {
    const video = videoRef.current

    if (!video) {
      return
    }

    video.srcObject = stream

    return () => {
      video.srcObject = null
    }
  }, [stream])

  function handleFacingChange(nextFacing: CameraFacing) {
    if (!cameraEnabled || shot || saveState === 'saving') {
      return
    }

    const switched = nextFacing !== facing

    if (!switched && cameraState !== 'error') {
      return
    }

    setFacing(nextFacing)
    void requestCamera(nextFacing, switched)
  }

  async function handleCapture() {
    if (!cameraEnabled || cameraState !== 'ready' || shot || capturing) {
      return
    }

    const video = videoRef.current

    if (!video) {
      setNotice(captureErrorMessage('not-ready'))
      return
    }

    const deps: PhotoCaptureDeps<HTMLCanvasElement> = {
      createCanvas: () => {
        try {
          return document.createElement('canvas')
        } catch {
          return null
        }
      },
      drawFrame: (canvas, frame) => {
        const context = canvas.getContext('2d')

        if (!context) {
          return false
        }

        context.drawImage(frame.source as CanvasImageSource, 0, 0, canvas.width, canvas.height)
        return true
      },
      toBlob: (canvas, mimeType) =>
        new Promise<Blob | null>((resolve, reject) => {
          try {
            canvas.toBlob((blob) => resolve(blob), mimeType, PHOTO_CAPTURE_QUALITY)
          } catch (error) {
            reject(error)
          }
        }),
    }

    setCapturing(true)
    setNotice(null)
    setSaveState('idle')
    setSaveError(null)

    const outcome = await capturePhotoBlob(
      {
        source: video,
        videoWidth: video.videoWidth,
        videoHeight: video.videoHeight,
      },
      deps,
      PHOTO_CAPTURE_MIME,
    )

    if (!mountedRef.current) {
      return
    }

    setCapturing(false)

    if (!outcome.ok) {
      // Keep the live camera so the adult can simply retry the shot.
      setNotice(captureErrorMessage(outcome.code))
      return
    }

    releaseCamera()
    setCameraState('idle')

    if (shotUrlRef.current) {
      URL.revokeObjectURL(shotUrlRef.current)
    }

    const url = URL.createObjectURL(outcome.blob)
    shotUrlRef.current = url
    setShot({ blob: outcome.blob, url })
  }

  async function handleSave() {
    if (!shot || saveState === 'saving' || saveState === 'saved') {
      return
    }

    setSaveState('saving')
    setSaveError(null)

    try {
      const mimeType = shot.blob.type || PHOTO_CAPTURE_MIME
      const media = await store.save({
        day,
        blob: shot.blob,
        mimeType,
        fileName: photoCaptureFileName(day, mimeType, new Date()),
        source: 'capture',
      })

      if (!mountedRef.current) {
        return
      }

      onSaved(media)
      setSaveState('saved')
    } catch (error) {
      if (!mountedRef.current) {
        return
      }

      setSaveState('error')
      setSaveError(albumErrorMessage(error))
    }
  }

  function handleRetake() {
    if (saveState === 'saving') {
      return
    }

    clearShot()
    setSaveState('idle')
    setSaveError(null)
    setNotice(null)
    void requestCamera(facing, false)
  }

  function handleClose() {
    if (saveState === 'saving') {
      return
    }

    releaseCamera()
    clearShot()
    onClose()
  }

  const controlsDisabled = Boolean(shot) || saveState === 'saving'
  const saved = saveState === 'saved'

  return (
    <div className="album-capture">
      <p className="album-capture__note">
        {cameraEnabled
          ? `Foto para el día ${day}. La cámara frontal se abre por defecto; puedes cambiar a la trasera antes de capturar. Nada se guarda ni se envía hasta que confirmes la captura.`
          : `Foto para el día ${day}. La cámara está desactivada en el panel familiar, así que esta vista no pedirá permisos.`}
      </p>

      {!cameraEnabled ? (
        <div className="notice notice--info" role="status">
          <p>
            <strong>La cámara está desactivada en el panel familiar.</strong> No se pedirá
            ningún permiso. Puedes seguir usando la importación desde la galería.
          </p>
        </div>
      ) : capability !== 'ready' ? (
        <div className="notice notice--warning" role="status">
          <p>
            {capability === 'no-user-media'
              ? 'Este navegador no ofrece cámara. Puedes seguir usando la importación desde la galería.'
              : 'Este navegador no puede crear archivos de foto desde la cámara. Puedes seguir usando la importación desde la galería.'}
          </p>
        </div>
      ) : (
        <>
          <div className="album-capture__stage">
            {shot ? (
              <img
                className="album-capture__preview"
                src={shot.url}
                alt="Vista previa de la foto capturada"
              />
            ) : (
              <video
                ref={videoRef}
                className="album-capture__preview"
                autoPlay
                muted
                playsInline
                aria-label="Vista previa de la cámara para la foto"
              />
            )}
          </div>

          <div className="album-capture__row">
            <span className="album-capture__label">Cámara</span>
            <div className="album-capture__facing" role="group" aria-label="Cámara para la foto">
              <button
                type="button"
                className="button button--secondary"
                aria-pressed={facing === 'user'}
                disabled={controlsDisabled}
                onClick={() => handleFacingChange('user')}
              >
                Frontal
              </button>
              <button
                type="button"
                className="button button--secondary"
                aria-pressed={facing === 'environment'}
                disabled={controlsDisabled}
                onClick={() => handleFacingChange('environment')}
              >
                Trasera
              </button>
            </div>
          </div>

          <p className="album-capture__note" role="status">
            {shot
              ? 'Foto capturada. Revísala y decide si quieres guardarla.'
              : cameraState === 'requesting'
                ? 'Pidiendo permiso para abrir la cámara…'
                : cameraState === 'ready'
                  ? 'Vista previa en directo. Puedes cambiar de cámara antes de capturar.'
                  : cameraState === 'error'
                    ? 'La cámara no está disponible en este momento.'
                    : 'Preparando la cámara…'}
          </p>

          {notice ? (
            <div className="notice notice--warning" role="status">
              <p>{notice}</p>
            </div>
          ) : null}

          {cameraState === 'error' && !shot ? (
            <div className="album-capture__actions">
              <button
                type="button"
                className="button button--secondary"
                onClick={() => void requestCamera(facing, false)}
              >
                Reintentar cámara
              </button>
            </div>
          ) : null}
        </>
      )}

      {saveError ? (
        <p className="notice notice--warning" role="alert">
          {saveError}
        </p>
      ) : null}

      {saved ? (
        <p className="notice notice--success" role="status">
          Foto guardada en el álbum privado. Solo se puede ver desde esta zona de adultos;
          recuerda exportar una copia de vez en cuando.
        </p>
      ) : null}

      <div className="album-capture__actions">
        {cameraAvailable && !shot && !saved ? (
          <button
            type="button"
            className="button button--primary"
            disabled={cameraState !== 'ready' || capturing}
            onClick={() => void handleCapture()}
          >
            <AssetGlyph asset={getAsset('album.photo')} label={false} />
            {capturing ? 'Capturando…' : 'Hacer foto'}
          </button>
        ) : null}

        {shot && !saved ? (
          <>
            <button
              type="button"
              className="button button--primary"
              disabled={saveState === 'saving'}
              onClick={() => void handleSave()}
            >
              {saveState === 'saving' ? 'Guardando en el álbum…' : 'Guardar en el álbum privado'}
            </button>
            <button
              type="button"
              className="button button--secondary"
              disabled={saveState === 'saving'}
              onClick={handleRetake}
            >
              Descartar y repetir
            </button>
          </>
        ) : null}

        {saved ? (
          <button type="button" className="button button--secondary" onClick={handleRetake}>
            Hacer otra foto
          </button>
        ) : null}

        <button
          type="button"
          className="button button--secondary"
          disabled={saveState === 'saving'}
          onClick={handleClose}
        >
          {saved ? 'Cerrar' : 'Cancelar sin guardar'}
        </button>
      </div>

      {!saved ? (
        <p className="album-capture__note">
          Si cancelas o descartas la foto, no se guarda nada. Al cerrar esta vista se libera
          la cámara.
        </p>
      ) : null}
    </div>
  )
}
