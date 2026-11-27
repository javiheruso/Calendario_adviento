import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ChangeEvent,
} from 'react'
import type { AlbumMediaMetadata } from '../../domain/album'
import { getAsset, type AssetId } from '../../domain/assets'
import {
  KARAOKE_SONG_SECONDS,
  KARAOKE_STYLES,
  advanceKaraoke,
  createKaraokeState,
  isKaraokeComplete,
  karaokeCountdownValue,
  karaokeSnapshot,
  resetKaraoke,
  startKaraoke,
  type KaraokeState,
  type KaraokeStyleId,
} from '../../domain/games/karaoke'
import {
  cameraConstraints,
  recorderExtension,
  resolveRecordingCapability,
  selectRecorderMimeType,
  type CameraFacing,
} from '../../domain/games/karaokeRecording'
import { albumErrorMessage } from '../albumMessages'
import { AssetGlyph } from '../AssetGlyph'
import { CountdownAnnouncer } from '../CountdownAnnouncer'
import type { MissionGameProps } from './types'

const STYLE_ASSETS: Readonly<Record<KaraokeStyleId, AssetId>> = {
  robot: 'game.karaoke.robot',
  mouse: 'game.karaoke.mouse',
  giant: 'game.karaoke.giant',
  sleepy: 'game.karaoke.sleepy',
  laugh: 'game.karaoke.laugh',
  'pop-star': 'game.karaoke.pop-star',
}

const TICK_SECONDS = 0.2
const TICK_MS = TICK_SECONDS * 1000
const KARAOKE_ANNOUNCEMENT_MILESTONES = [30, 10] as const

type CameraState = 'idle' | 'preparing' | 'ready' | 'error'
type RecorderState = 'idle' | 'recording' | 'ready' | 'error'

function stopTracks(stream: MediaStream | null): void {
  if (!stream) {
    return
  }

  for (const track of stream.getTracks()) {
    track.stop()
  }
}

function isPermissionDenied(error: unknown): boolean {
  return (
    error instanceof DOMException &&
    (error.name === 'NotAllowedError' || error.name === 'SecurityError')
  )
}

function canUseMediaApis(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    Boolean(navigator.mediaDevices?.getUserMedia) &&
    typeof MediaRecorder !== 'undefined'
  )
}

function mediaRecorderSupports(mimeType: string): boolean {
  return (
    typeof MediaRecorder !== 'undefined' &&
    typeof MediaRecorder.isTypeSupported === 'function' &&
    MediaRecorder.isTypeSupported(mimeType)
  )
}

/**
 * Day 7: a 72-second provisional silly carol with six timed vocal styles and a
 * synchronized lyric. Finishing the song always completes the mission.
 *
 * Recording is optional. When the family opts in, the front camera is requested
 * by default, the child may switch to the rear camera before recording, and
 * only the camera/microphone stream is recorded: the karaoke interface is never
 * part of the video. The private album is an explicit opt-in after the song:
 * the UI only claims a save when the IndexedDB write resolves, and the
 * temporary download remains available as a fallback.
 */
export function KaraokeGame({
  mission,
  cameraEnabled = true,
  onComplete,
  onSaveRecording,
}: MissionGameProps) {
  const [state, setState] = useState<KaraokeState>(createKaraokeState)
  const [wantRecording, setWantRecording] = useState(false)
  const [facing, setFacing] = useState<CameraFacing>('user')
  const [previewStream, setPreviewStream] = useState<MediaStream | null>(null)
  const [cameraState, setCameraState] = useState<CameraState>('idle')
  const [cameraNotice, setCameraNotice] = useState<string | null>(null)
  const [recorderState, setRecorderState] = useState<RecorderState>('idle')
  const [recordingNotice, setRecordingNotice] = useState<string | null>(null)
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null)
  const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null)
  const [recordingType, setRecordingType] = useState<string | null>(null)
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [saveError, setSaveError] = useState<string | null>(null)
  const [savedMedia, setSavedMedia] = useState<AlbumMediaMetadata | null>(null)

  const mountedRef = useRef(true)
  const cameraRequestRef = useRef(0)
  const streamRef = useRef<MediaStream | null>(null)
  const previewVideoRef = useRef<HTMLVideoElement | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const recordingSessionRef = useRef(0)
  const audioContextRef = useRef<AudioContext | null>(null)
  const recordingUrlRef = useRef<string | null>(null)

  const snapshot = karaokeSnapshot(state)
  const complete = isKaraokeComplete(state)
  // Refs keep the async getUserMedia continuation honest even before React
  // commits the effect that releases the preview at the end of the song. A
  // layout effect updates them synchronously with the commit, before a pending
  // getUserMedia microtask can attach tracks to a finished session.
  const completeRef = useRef(complete)
  const cameraEnabledRef = useRef(cameraEnabled)
  const sessionActive = state.started && !complete
  const controlsLocked = sessionActive
  const capability = resolveRecordingCapability(
    typeof navigator !== 'undefined' && Boolean(navigator.mediaDevices?.getUserMedia),
    typeof MediaRecorder !== 'undefined',
  )
  const previewHasAudio = Boolean(previewStream?.getAudioTracks().length)
  const downloadExtension = recorderExtension(recordingType)

  const closeAudioContext = useCallback(() => {
    const context = audioContextRef.current
    audioContextRef.current = null

    if (context && context.state !== 'closed') {
      void context.close().catch(() => undefined)
    }
  }, [])

  const releasePreviewResources = useCallback(() => {
    stopTracks(streamRef.current)
    streamRef.current = null
    closeAudioContext()
  }, [closeAudioContext])

  const stopPreview = useCallback(() => {
    releasePreviewResources()
    setPreviewStream(null)
  }, [releasePreviewResources])

  useLayoutEffect(() => {
    completeRef.current = complete
    cameraEnabledRef.current = cameraEnabled
  }, [complete, cameraEnabled])

  const clearRecordingResult = useCallback(() => {
    if (recordingUrlRef.current) {
      URL.revokeObjectURL(recordingUrlRef.current)
      recordingUrlRef.current = null
    }

    recordingSessionRef.current += 1
    setRecordingUrl(null)
    setRecordingBlob(null)
    setRecordingType(null)
    setRecordingNotice(null)
    setRecorderState('idle')
    setSaveState('idle')
    setSaveError(null)
    setSavedMedia(null)
  }, [])

  // Stop the camera, microphone, audio graph and recorder when the mission view
  // unmounts, and revoke the temporary blob URL.
  useEffect(() => {
    mountedRef.current = true

    return () => {
      mountedRef.current = false
      cameraRequestRef.current += 1
      recordingSessionRef.current += 1

      const recorder = recorderRef.current
      if (recorder && recorder.state !== 'inactive') {
        try {
          recorder.stop()
        } catch {
          // The component is leaving; the track cleanup below is enough.
        }
      }

      recorderRef.current = null
      stopTracks(streamRef.current)
      streamRef.current = null

      const context = audioContextRef.current
      audioContextRef.current = null
      if (context && context.state !== 'closed') {
        void context.close().catch(() => undefined)
      }

      if (recordingUrlRef.current) {
        URL.revokeObjectURL(recordingUrlRef.current)
        recordingUrlRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (!state.started || complete) {
      return
    }

    const timer = window.setInterval(() => {
      setState((current) => advanceKaraoke(current, TICK_SECONDS))
    }, TICK_MS)

    return () => window.clearInterval(timer)
  }, [state.started, complete])

  useEffect(() => {
    const video = previewVideoRef.current
    if (!video) {
      return
    }

    video.srcObject = previewStream

    return () => {
      video.srcObject = null
    }
  }, [previewStream])

  // The song end closes the recorder and releases the camera even before the
  // child taps "Continuar". A failed close never blocks mission completion.
  useEffect(() => {
    if (!complete) {
      return
    }

    // Invalidate any getUserMedia call that is still pending: its tracks must
    // be stopped as soon as they arrive, not attached to a finished session.
    cameraRequestRef.current += 1

    const recorder = recorderRef.current
    recorderRef.current = null

    if (recorder && recorder.state !== 'inactive') {
      try {
        recorder.stop()
      } catch {
        // Surface the problem after the effect finishes; completion still wins.
        window.setTimeout(() => {
          if (!mountedRef.current) {
            return
          }

          setRecorderState('error')
          setRecordingNotice(
            'La grabación no se pudo cerrar correctamente, pero la misión está completada.',
          )
        }, 0)
      }
    }

    releasePreviewResources()
  }, [complete, releasePreviewResources])

  async function prepareCamera(nextFacing: CameraFacing) {
    if (!cameraEnabledRef.current) {
      return
    }

    if (!canUseMediaApis()) {
      setCameraState('error')
      setCameraNotice(
        'Este navegador no ofrece cámara y micrófono para grabar. Puedes cantar y completar la misión sin grabar.',
      )
      return
    }

    stopPreview()
    cameraRequestRef.current += 1
    const requestId = cameraRequestRef.current

    setCameraNotice(null)
    setCameraState('preparing')

    try {
      const stream = await navigator.mediaDevices.getUserMedia(
        cameraConstraints(nextFacing, true),
      )

      if (
        !mountedRef.current ||
        !cameraEnabledRef.current ||
        completeRef.current ||
        requestId !== cameraRequestRef.current
      ) {
        stopTracks(stream)
        return
      }

      streamRef.current = stream
      setPreviewStream(stream)
      setCameraState('ready')
    } catch (error) {
      if (
        !mountedRef.current ||
        !cameraEnabledRef.current ||
        completeRef.current ||
        requestId !== cameraRequestRef.current
      ) {
        return
      }

      if (isPermissionDenied(error)) {
        setCameraState('error')
        setCameraNotice(
          'No hay permiso para usar la cámara o el micrófono. Puedes cantar y completar la misión sin grabar.',
        )
        return
      }

      // A missing or busy microphone should not also cost the image. Try a
      // video-only preview; if that also fails, keep the mission playable.
      try {
        const videoOnly = await navigator.mediaDevices.getUserMedia(
          cameraConstraints(nextFacing, false),
        )

        if (
          !mountedRef.current ||
          !cameraEnabledRef.current ||
          completeRef.current ||
          requestId !== cameraRequestRef.current
        ) {
          stopTracks(videoOnly)
          return
        }

        streamRef.current = videoOnly
        setPreviewStream(videoOnly)
        setCameraState('ready')
        setCameraNotice(
          'No se pudo abrir el micrófono: la grabación tendrá imagen sin sonido. La canción sigue igual.',
        )
      } catch {
        if (
          !mountedRef.current ||
          !cameraEnabledRef.current ||
          completeRef.current ||
          requestId !== cameraRequestRef.current
        ) {
          return
        }

        setCameraState('error')
        setCameraNotice(
          'No se pudo abrir la cámara. Puedes cantar y completar la misión sin grabar.',
        )
      }
    }
  }

  async function startRecording() {
    const media = streamRef.current

    if (!media) {
      setRecorderState('error')
      setRecordingNotice(
        'No hay cámara preparada, así que la canción empezará sin grabar. La misión sigue disponible.',
      )
      return
    }

    const mimeType = selectRecorderMimeType(mediaRecorderSupports)
    let recordingStream = media
    const audioTracks = media.getAudioTracks()

    if (audioTracks.length > 0) {
      try {
        const context = new AudioContext()
        const source = context.createMediaStreamSource(new MediaStream(audioTracks))
        const destination = context.createMediaStreamDestination()
        source.connect(destination)
        audioContextRef.current = context

        await context.resume()

        if (context.state !== 'running') {
          throw new Error('The audio context did not start.')
        }

        recordingStream = new MediaStream([
          ...media.getVideoTracks(),
          ...destination.stream.getAudioTracks(),
        ])
      } catch {
        closeAudioContext()
        recordingStream = media
        setCameraNotice(
          'No se pudo preparar la mezcla de audio: se grabará el micrófono directo. La canción sigue igual.',
        )
      }
    }

    if (!mountedRef.current) {
      closeAudioContext()
      return
    }

    try {
      const recorder = mimeType
        ? new MediaRecorder(recordingStream, { mimeType })
        : new MediaRecorder(recordingStream)
      const sessionId = recordingSessionRef.current + 1
      recordingSessionRef.current = sessionId
      const chunks: Blob[] = []

      recorder.ondataavailable = (event: BlobEvent) => {
        if (sessionId === recordingSessionRef.current && event.data.size > 0) {
          chunks.push(event.data)
        }
      }

      recorder.onerror = () => {
        if (sessionId !== recordingSessionRef.current || !mountedRef.current) {
          return
        }

        stopPreview()
        setRecorderState('error')
        setRecordingNotice(
          'La grabación se ha detenido por un error. Puedes seguir cantando y completar la misión sin grabar.',
        )
      }

      recorder.onstop = () => {
        if (sessionId !== recordingSessionRef.current || !mountedRef.current) {
          return
        }

        const type = recorder.mimeType || mimeType || ''
        const blob = new Blob(chunks, type ? { type } : undefined)

        if (blob.size === 0) {
          setRecordingBlob(null)
          setRecorderState('error')
          setRecordingNotice(
            'La grabación terminó sin datos. No se ha creado ningún vídeo; la misión sigue completada.',
          )
          return
        }

        const url = URL.createObjectURL(blob)

        if (recordingUrlRef.current) {
          URL.revokeObjectURL(recordingUrlRef.current)
        }

        recordingUrlRef.current = url
        setRecordingUrl(url)
        setRecordingBlob(blob)
        setRecordingType(type || null)
        setRecorderState('ready')
        setRecordingNotice(null)
      }

      recorder.start()
      recorderRef.current = recorder
      setRecorderState('recording')
      setRecordingNotice(null)
    } catch {
      closeAudioContext()
      setRecorderState('error')
      setRecordingNotice(
        'Este navegador no ha podido iniciar la grabación. Puedes cantar y completar la misión sin grabar.',
      )
    }
  }

  function handleStart() {
    setState((current) => startKaraoke(current))

    if (!cameraEnabled) {
      setWantRecording(false)
      return
    }

    if (!wantRecording) {
      return
    }

    if (streamRef.current && recorderState !== 'recording') {
      void startRecording()
      return
    }

    if (!cameraNotice) {
      setRecorderState('error')
      setRecordingNotice(
        'La cámara no está lista, así que la canción empezará sin grabar. La misión sigue disponible.',
      )
    }
  }

  function handleRecordingToggle(event: ChangeEvent<HTMLInputElement>) {
    const enabled = event.target.checked

    if (!cameraEnabled || controlsLocked || recorderState === 'recording') {
      return
    }

    setWantRecording(enabled)

    if (enabled) {
      clearRecordingResult()
      void prepareCamera(facing)
      return
    }

    cameraRequestRef.current += 1
    recordingSessionRef.current += 1
    stopPreview()
    setCameraState('idle')
    setCameraNotice(null)
  }

  function handleFacingChange(nextFacing: CameraFacing) {
    if (
      !cameraEnabled ||
      controlsLocked ||
      recorderState === 'recording' ||
      nextFacing === facing
    ) {
      return
    }

    setFacing(nextFacing)

    if (wantRecording) {
      void prepareCamera(nextFacing)
    }
  }

  function handleRepeat() {
    recordingSessionRef.current += 1
    clearRecordingResult()
    stopPreview()
    setState(resetKaraoke())
    setRecorderState('idle')
    setCameraNotice(null)

    if (wantRecording) {
      void prepareCamera(facing)
    } else {
      setCameraState('idle')
    }
  }

  async function handleSaveRecording() {
    if (!recordingBlob || saveState === 'saving' || savedMedia) {
      return
    }

    if (!onSaveRecording) {
      setSaveState('error')
      setSaveError('El álbum privado no está disponible en esta vista.')
      return
    }

    const extension = recorderExtension(recordingType)
    const sessionId = recordingSessionRef.current
    setSaveState('saving')
    setSaveError(null)

    try {
      const result = await onSaveRecording({
        day: mission.day,
        blob: recordingBlob,
        mimeType: recordingType ?? recordingBlob.type ?? '',
        fileName: `grabacion-dia-${String(mission.day).padStart(2, '0')}.${extension}`,
      })

      if (!mountedRef.current || sessionId !== recordingSessionRef.current) {
        return
      }

      if (result.ok) {
        setSavedMedia(result.media)
        setSaveState('saved')
      } else {
        setSaveState('error')
        setSaveError(albumErrorMessage(result.error))
      }
    } catch (error) {
      if (!mountedRef.current || sessionId !== recordingSessionRef.current) {
        return
      }

      setSaveState('error')
      setSaveError(albumErrorMessage(error))
    }
  }

  return (
    <div className="game game--karaoke">
      <p className="game__lead">
        Karaoke de {KARAOKE_SONG_SECONDS} segundos con una letra provisional y seis estilos
        de voz. Canta cada tramo como pida Trasto. La canción termina sola y completar la
        misión no tiene penalización.
      </p>

      <progress
        className="karaoke-progress"
        max={1}
        value={snapshot.progress}
        aria-label="Progreso del villancico"
      />

      <CountdownAnnouncer
        seconds={Math.max(0, KARAOKE_SONG_SECONDS - snapshot.songSeconds)}
        label="Villancico"
        milestones={KARAOKE_ANNOUNCEMENT_MILESTONES}
      />

      <p className="game__status">
        {snapshot.phase === 'ready'
          ? 'Todo listo para cantar'
          : snapshot.phase === 'countdown'
            ? 'Cuenta atrás'
            : snapshot.phase === 'complete'
              ? '¡Villancico terminado!'
              : `Cantando: ${Math.floor(snapshot.songSeconds)} s de ${KARAOKE_SONG_SECONDS} s`}
      </p>

      {snapshot.phase === 'ready' ? (
        <section className="karaoke-stage" aria-labelledby="karaoke-ready-title">
          <h3 id="karaoke-ready-title">Los seis estilos</h3>
          <ol className="karaoke-styles">
            {KARAOKE_STYLES.map((style) => (
              <li key={style.id}>
                <span className="karaoke-styles__glyph" aria-hidden="true">
                  <AssetGlyph asset={getAsset(STYLE_ASSETS[style.id])} label={false} />
                </span>
                <span>
                  <strong>{style.label}</strong>
                  <span className="karaoke-styles__instruction">{style.instruction}</span>
                </span>
              </li>
            ))}
          </ol>
          <p className="karaoke-stage__note">
            Letra provisional. La música y la letra definitivas llegarán con los recursos
            finales; esta versión funciona sin audio obligatorio.
          </p>
        </section>
      ) : null}

      {snapshot.phase === 'countdown' ? (
        <section className="karaoke-stage" aria-label="Cuenta atrás del villancico">
          <p className="karaoke-countdown" role="status">
            {karaokeCountdownValue(state)}
          </p>
          <p className="karaoke-stage__note">Prepara la voz y el primer estilo…</p>
        </section>
      ) : null}

      {snapshot.phase === 'singing' ? (
        <>
          {snapshot.style ? (
            <section className="karaoke-style" aria-label="Estilo de voz actual">
              <p className="karaoke-style__glyph" aria-hidden="true">
                <AssetGlyph asset={getAsset(STYLE_ASSETS[snapshot.style.id])} label={false} />
              </p>
              <p className="karaoke-style__text">
                <span className="karaoke-style__label">{snapshot.style.label}</span>
                {snapshot.style.instruction}
              </p>
            </section>
          ) : null}

          <section className="karaoke-lyrics" aria-live="polite" aria-label="Letra actual">
            <p className="karaoke-lyrics__current">{snapshot.activeLine?.text ?? '…'}</p>
            <p className="karaoke-lyrics__next">
              {snapshot.nextLine ? `Siguiente: ${snapshot.nextLine.text}` : 'Última línea'}
            </p>
          </section>
        </>
      ) : null}

      {!complete && !cameraEnabled ? (
        <div className="notice notice--info" role="status">
          <p>
            <strong>La cámara y la grabación opcional están desactivadas en el panel
            familiar.</strong> Puedes cantar y completar la misión con normalidad; no se
            pedirá ningún permiso.
          </p>
        </div>
      ) : null}

      {!complete && cameraEnabled ? (
        <section className="karaoke-recording" aria-labelledby="karaoke-recording-title">
          <h3 id="karaoke-recording-title">Grabación opcional</h3>

          {capability !== 'ready' ? (
            <div className="notice notice--warning" role="status">
              <p>
                {capability === 'no-user-media'
                  ? 'Este navegador no ofrece acceso a la cámara. Puedes cantar y completar la misión sin grabar.'
                  : 'Este navegador no puede grabar vídeo. Puedes cantar y completar la misión sin grabar.'}
              </p>
            </div>
          ) : (
            <>
              <label className="karaoke-record-toggle">
                <input
                  type="checkbox"
                  checked={wantRecording}
                  disabled={controlsLocked}
                  onChange={handleRecordingToggle}
                />
                <span>Quiero grabar un recuerdo (opcional)</span>
              </label>

              <div className="karaoke-recording__row">
                <span className="karaoke-recording__label">Cámara</span>
                <div className="karaoke-facing" role="group" aria-label="Cámara para grabar">
                  <button
                    type="button"
                    className={`button button--secondary karaoke-facing__button${
                      facing === 'user' ? ' karaoke-facing__button--active' : ''
                    }`}
                    aria-pressed={facing === 'user'}
                    disabled={controlsLocked}
                    onClick={() => handleFacingChange('user')}
                  >
                    Frontal
                  </button>
                  <button
                    type="button"
                    className={`button button--secondary karaoke-facing__button${
                      facing === 'environment' ? ' karaoke-facing__button--active' : ''
                    }`}
                    aria-pressed={facing === 'environment'}
                    disabled={controlsLocked}
                    onClick={() => handleFacingChange('environment')}
                  >
                    Trasera
                  </button>
                </div>
              </div>

              <p className="karaoke-recording__note" role="status">
                {cameraState === 'idle'
                  ? 'Marca la casilla si quieres grabar. La cámara frontal es la opción por defecto.'
                  : cameraState === 'preparing'
                    ? 'Pidiendo permiso para cámara y micrófono…'
                    : cameraState === 'ready'
                      ? previewHasAudio
                        ? 'Cámara y micrófono listos. Vista previa en directo.'
                        : 'Cámara lista sin micrófono. La grabación tendrá imagen sin sonido.'
                      : 'La grabación no está disponible, pero la canción se puede jugar.'}
              </p>

              {cameraNotice ? (
                <div className="notice notice--warning" role="status">
                  <p>{cameraNotice}</p>
                </div>
              ) : null}

              {previewStream ? (
                <div className="karaoke-camera">
                  <video
                    ref={previewVideoRef}
                    className="karaoke-camera__video"
                    autoPlay
                    muted
                    playsInline
                    aria-label="Vista previa de la cámara"
                  />
                  <p className="karaoke-recording__note">
                    Solo se graban la cámara y el micrófono. La interfaz del karaoke no
                    aparece en el vídeo.
                  </p>
                </div>
              ) : null}

              <p className="karaoke-recording__note">
                Si grabas, al terminar la canción podrás guardar el vídeo en el álbum
                privado o descargarlo. Nada se sube a ningún servidor.
              </p>
            </>
          )}
        </section>
      ) : null}

      {!complete && recorderState === 'recording' ? (
        <p className="karaoke-recording__status" role="status">
          Grabando… la canción continúa aunque la grabación falle.
        </p>
      ) : null}

      {recordingNotice ? (
        <div className="notice notice--warning" role="status">
          <p>{recordingNotice}</p>
        </div>
      ) : null}

      <div className="game__actions">
        {snapshot.phase === 'ready' ? (
          <button type="button" className="button button--primary" onClick={handleStart}>
            Empezar el villancico
          </button>
        ) : null}

        {complete ? (
          <button type="button" className="button button--secondary" onClick={handleRepeat}>
            Repetir canción
          </button>
        ) : null}
      </div>

      {complete ? (
        <>
          <div className="game__complete" role="status">
            <p>
              <strong>¡Villancico terminado!</strong> Has cantado los seis estilos y has
              llegado al final. No hay penalización: si algo salió raro, puedes repetirlo.
            </p>
            <button type="button" className="button button--primary" onClick={onComplete}>
              Continuar
            </button>
          </div>

          {recordingUrl ? (
            <section
              className="karaoke-recording-result"
              aria-labelledby="karaoke-recording-result-title"
            >
              <h3 id="karaoke-recording-result-title">Vista previa de la grabación</h3>
              <video
                className="karaoke-recording-result__video"
                src={recordingUrl}
                controls
                playsInline
                aria-label="Vista previa de la grabación del villancico"
              />
              <a
                className="button button--secondary karaoke-download"
                href={recordingUrl}
                download={`villancico-disparatado.${downloadExtension}`}
              >
                Descargar vídeo
              </a>

              <div className="karaoke-album-save">
                {savedMedia ? (
                  <p className="karaoke-album-save__success" role="status">
                    <strong>Guardado en el álbum privado.</strong> Archivo:{' '}
                    {savedMedia.fileName}. Solo los adultos pueden abrirlo desde el panel
                    familiar. Recuerda exportar una copia de vez en cuando.
                  </p>
                ) : (
                  <>
                    <button
                      type="button"
                      className="button button--primary"
                      disabled={saveState === 'saving'}
                      onClick={() => void handleSaveRecording()}
                    >
                      {saveState === 'saving'
                        ? 'Guardando en el álbum…'
                        : 'Guardar en el álbum privado'}
                    </button>
                    {saveError ? (
                      <p className="notice notice--warning" role="alert">
                        {saveError}
                      </p>
                    ) : null}
                    <p className="karaoke-recording__note">
                      El vídeo no está guardado hasta que el navegador confirma la
                      escritura. Si falla, puedes descargarlo o intentarlo de nuevo.
                    </p>
                  </>
                )}
              </div>
              <p className="karaoke-recording__note">
                El vídeo sigue siendo temporal hasta que lo guardes en el álbum o lo
                descargues. Nada se sube a ningún servidor.
              </p>
            </section>
          ) : null}

          {!recordingUrl && !recordingNotice ? (
            <p className="karaoke-recording__note">
              {wantRecording
                ? (cameraNotice ??
                  'No se ha creado ningún vídeo. La misión está completada igualmente.')
                : 'No has grabado nada. La misión está completada igualmente.'}
            </p>
          ) : null}
        </>
      ) : null}

      <p className="game__hint">
        {cameraEnabled
          ? 'Para adultos: la cámara y el micrófono solo se piden si se marca la grabación opcional. Guardar en el álbum es una acción explícita y solo se confirma cuando el navegador termina de escribir. Al salir de la misión se liberan la cámara y el micrófono. No se sube nada a ningún servidor.'
          : 'Para adultos: la cámara y la grabación opcional están desactivadas en el panel familiar. La canción y la misión funcionan sin pedir permisos. No se sube nada a ningún servidor.'}
      </p>
    </div>
  )
}
