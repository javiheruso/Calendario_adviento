import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'
import {
  albumTotalBytes,
  formatByteSize,
  groupAlbumMediaByDay,
  type AlbumMediaMetadata,
} from '../domain/album'
import { getAsset } from '../domain/assets'
import { getTodayMissionDay } from '../domain/calendar'
import { getMission } from '../domain/missions'
import { MISSION_DAYS, type MissionDay } from '../domain/types'
import { AlbumStorageError } from '../storage/albumDb'
import type { AlbumStore } from '../storage/albumStore'
import {
  readStorageStatus,
  requestPersistentStorage,
  type AlbumStorageStatus,
} from '../storage/storageStatus'
import { AlbumCameraCapture } from './AlbumCameraCapture'
import { AlbumMediaCard } from './AlbumMediaCard'
import { albumErrorCode, albumErrorMessage } from './albumMessages'
import { AssetGlyph } from './AssetGlyph'

interface AlbumPanelProps {
  store: AlbumStore
  /** Local parental switch; false keeps the camera idle and the album usable. */
  cameraEnabled: boolean
  onBack: () => void
  onLock: () => void
}

interface AlbumNotice {
  readonly tone: 'success' | 'warning' | 'info'
  readonly message: string
}

const FATAL_IMPORT_CODES = new Set(['quota', 'unavailable', 'blocked'])

function defaultImportDay(): MissionDay {
  return getTodayMissionDay() ?? 1
}

function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  anchor.rel = 'noopener'
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
}

function persistenceLabel(status: AlbumStorageStatus): string {
  switch (status.persistence) {
    case 'granted':
      return 'Concedido: el navegador intentará conservar los datos.'
    case 'denied':
      return 'No concedido: el navegador puede borrar el álbum si necesita espacio.'
    case 'unsupported':
      return 'No disponible en este navegador.'
  }
}

export function AlbumPanel({ store, cameraEnabled, onBack, onLock }: AlbumPanelProps) {
  const [entries, setEntries] = useState<AlbumMediaMetadata[]>([])
  const [loading, setLoading] = useState(true)
  const [loadFailed, setLoadFailed] = useState(false)
  const [notice, setNotice] = useState<AlbumNotice | null>(null)
  const [storage, setStorage] = useState<AlbumStorageStatus | null>(null)
  const [storageBusy, setStorageBusy] = useState(false)
  const [importDay, setImportDay] = useState<MissionDay>(defaultImportDay)
  const [importing, setImporting] = useState(false)
  const [captureDay, setCaptureDay] = useState<MissionDay>(defaultImportDay)
  const [captureOpen, setCaptureOpen] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  const mountedRef = useRef(true)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const refresh = useCallback(async () => {
    try {
      const next = await store.list()

      if (!mountedRef.current) {
        return
      }

      setEntries(next)
      setLoadFailed(false)
    } catch (error) {
      if (!mountedRef.current) {
        return
      }

      setLoadFailed(true)
      setNotice({ tone: 'warning', message: albumErrorMessage(error) })
    } finally {
      if (mountedRef.current) {
        setLoading(false)
      }
    }
  }, [store])

  const refreshEstimate = useCallback(async () => {
    const next = await readStorageStatus()

    if (mountedRef.current) {
      setStorage(next)
    }
  }, [])

  useEffect(() => {
    mountedRef.current = true
    // The async loader only updates state after the IndexedDB call resolves.
    // oxlint-disable-next-line react/set-state-in-effect
    void refresh()
    // Asking here is deliberate: the album only opens from the unlocked adult
    // panel, so the family sees the browser result in context.
    void requestPersistentStorage().then((next) => {
      if (mountedRef.current) {
        setStorage(next)
      }
    })

    return () => {
      mountedRef.current = false
    }
  }, [refresh])

  const groups = useMemo(() => groupAlbumMediaByDay(entries), [entries])
  const totalBytes = useMemo(() => albumTotalBytes(entries), [entries])

  async function handleRequestPersistence() {
    setStorageBusy(true)

    try {
      const next = await requestPersistentStorage()

      if (!mountedRef.current) {
        return
      }

      setStorage(next)
      setNotice({
        tone: next.persistence === 'granted' ? 'success' : 'warning',
        message:
          next.persistence === 'granted'
            ? 'Almacenamiento persistente concedido. Aun así, exporta el álbum como copia de seguridad.'
            : next.persistence === 'denied'
              ? 'El navegador no ha concedido almacenamiento persistente. Puede borrar el álbum bajo presión de espacio; exporta tus recuerdos.'
              : 'Este navegador no permite solicitar almacenamiento persistente. Exporta el álbum para conservarlo.',
      })
    } finally {
      if (mountedRef.current) {
        setStorageBusy(false)
      }
    }
  }

  async function handleFiles(files: readonly File[]) {
    if (files.length === 0 || importing) {
      return
    }

    setImporting(true)
    setNotice(null)
    let saved = 0
    let attempted = 0
    const failures: string[] = []

    for (const file of files) {
      attempted += 1

      try {
        await store.save({
          day: importDay,
          blob: file,
          mimeType: file.type,
          fileName: file.name,
          source: 'import',
        })
        saved += 1
      } catch (error) {
        failures.push(`${file.name}: ${albumErrorMessage(error)}`)

        if (FATAL_IMPORT_CODES.has(albumErrorCode(error))) {
          const remaining = files.length - attempted

          if (remaining > 0) {
            failures.push(
              `${remaining} archivo(s) no se intentaron porque el almacenamiento dejó de estar disponible.`,
            )
          }

          break
        }
      }
    }

    await refresh()
    await refreshEstimate()

    if (!mountedRef.current) {
      return
    }

    setImporting(false)
    setNotice({
      tone: saved === files.length ? 'success' : 'warning',
      message:
        saved > 0
          ? `Guardados ${saved} de ${files.length} archivos en el álbum del día ${importDay}. ${failures.join(' ')}`.trim()
          : `No se pudo guardar ningún archivo. ${failures.join(' ')}`.trim(),
    })
  }

  function handleFileInput(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? [])
    event.target.value = ''
    void handleFiles(files)
  }

  function handleCaptureSaved(media: AlbumMediaMetadata) {
    void refresh()
    void refreshEstimate()

    if (mountedRef.current) {
      setNotice({
        tone: 'success',
        message: `Foto del día ${media.day} guardada en el álbum del dispositivo.`,
      })
    }
  }

  async function handleDownload(media: AlbumMediaMetadata) {
    try {
      const blob = await store.getBlob(media.id)

      if (!blob) {
        throw new AlbumStorageError('not-found', 'The album blob is missing.')
      }

      downloadBlob(blob, media.fileName)

      if (mountedRef.current) {
        setNotice({
          tone: 'success',
          message: `Descarga preparada: ${media.fileName}. Revisa la carpeta de descargas del dispositivo.`,
        })
      }
    } catch (error) {
      if (mountedRef.current) {
        setNotice({ tone: 'warning', message: albumErrorMessage(error) })
      }
    }
  }

  async function handleConfirmDelete(media: AlbumMediaMetadata) {
    try {
      await store.remove(media.id)

      if (!mountedRef.current) {
        return
      }

      setPendingDeleteId(null)
      await refresh()
      await refreshEstimate()

      if (mountedRef.current) {
        setNotice({
          tone: 'success',
          message: `Recuerdo del día ${media.day} eliminado del dispositivo.`,
        })
      }
    } catch (error) {
      if (mountedRef.current) {
        setPendingDeleteId(null)
        setNotice({
          tone: 'warning',
          message: `No se pudo eliminar el recuerdo. ${albumErrorMessage(error)}`,
        })
      }
    }
  }

  async function handleExportAll() {
    if (entries.length === 0 || exporting) {
      return
    }

    setExporting(true)
    setNotice(null)

    try {
      const result = await store.exportAll()
      downloadBlob(result.blob, result.fileName)

      if (mountedRef.current) {
        setNotice({
          tone: 'success',
          message: `ZIP preparado con ${result.entryCount} recuerdo(s) (${formatByteSize(result.totalBytes)}). Revisa la carpeta de descargas.`,
        })
      }
    } catch (error) {
      if (mountedRef.current) {
        const code = albumErrorCode(error)
        setNotice({
          tone: 'warning',
          message:
            code === 'too-large' || code === 'too-many-files'
              ? `${albumErrorMessage(error)} Usa el botón «Descargar» de cada recuerdo.`
              : `${albumErrorMessage(error)} Si el ZIP no se puede completar, usa el botón «Descargar» de cada recuerdo.`,
        })
      }
    } finally {
      if (mountedRef.current) {
        setExporting(false)
      }
    }
  }

  async function handleRetryLoad() {
    setLoading(true)
    setLoadFailed(false)
    await refresh()
  }

  return (
    <section className="adult album" aria-labelledby="album-title">
      <div className="adult__topbar">
        <button type="button" className="link-button" onClick={onBack}>
          <span aria-hidden="true">←</span> Volver al panel familiar
        </button>
        <button type="button" className="button button--secondary" onClick={onLock}>
          Bloquear panel
        </button>
      </div>

      <header>
        <p className="adult__eyebrow">Zona de adultos</p>
        <h2 id="album-title" tabIndex={-1}>
          Álbum privado
        </h2>
        <p className="adult__lead">
          Fotos y vídeos guardados solo en este dispositivo. El álbum se abre únicamente
          desde esta zona de adultos: el calendario infantil no muestra ningún recuerdo.
        </p>
      </header>

      <div className="notice notice--warning" role="note">
        <p>
          <strong>Guardar recuerdos no es ilimitado ni permanente.</strong> Si borras los
          datos del navegador, desinstalas la app o el dispositivo se queda sin espacio,
          puedes perder el álbum. Exporta una copia con frecuencia y guárdala fuera del
          navegador.
        </p>
      </div>

      {notice ? (
        <p className={`notice notice--${notice.tone}`} role="status">
          {notice.message}
        </p>
      ) : null}

      <section className="adult-section" aria-labelledby="album-storage-title">
        <h3 id="album-storage-title">Almacenamiento del dispositivo</h3>

        {storage ? (
          <>
            <dl className="album-storage__facts">
              <div>
                <dt>Almacenamiento persistente</dt>
                <dd>{persistenceLabel(storage)}</dd>
              </div>
              <div>
                <dt>Espacio estimado</dt>
                <dd>
                  {storage.usageBytes !== null
                    ? formatByteSize(storage.usageBytes)
                    : 'No disponible'}
                  {storage.quotaBytes !== null
                    ? ` de ${formatByteSize(storage.quotaBytes)}`
                    : ''}
                </dd>
              </div>
            </dl>

            {storage.estimateFailed ? (
              <p className="notice notice--warning" role="status">
                No se pudo leer el espacio disponible. Exporta el álbum si necesitas
                asegurar una copia.
              </p>
            ) : null}

            <div className="adult__actions">
              <button
                type="button"
                className="button button--secondary"
                disabled={
                  storageBusy ||
                  storage.persistence === 'granted' ||
                  storage.persistence === 'unsupported'
                }
                onClick={() => void handleRequestPersistence()}
              >
                {storageBusy ? 'Solicitando…' : 'Solicitar almacenamiento persistente'}
              </button>
            </div>
          </>
        ) : (
          <p className="adult__footnote" role="status">
            Comprobando el almacenamiento del navegador…
          </p>
        )}

        <p className="adult__footnote">
          La cuota es una estimación del navegador. No se promete almacenamiento
          ilimitado. Borrar los datos del sitio puede eliminar los recuerdos.
        </p>
      </section>

      <section className="adult-section" aria-labelledby="album-capture-title">
        <h3 id="album-capture-title">Hacer una foto con la cámara</h3>
        <p className="adult__footnote">
          Captura directa solo desde esta zona de adultos. La cámara frontal se abre por
          defecto y puedes cambiar a la trasera antes de hacer la foto. La imagen se
          queda en el dispositivo y solo se guarda en el álbum cuando lo confirmas.
        </p>

        {!cameraEnabled ? (
          <div className="notice notice--info" role="status">
            <p>
              <strong>La cámara está desactivada en el panel familiar.</strong> La captura
              directa no pedirá permisos. Puedes seguir importando fotos y vídeos desde la
              galería.
            </p>
          </div>
        ) : captureOpen ? (
          <AlbumCameraCapture
            store={store}
            day={captureDay}
            cameraEnabled={cameraEnabled}
            onSaved={handleCaptureSaved}
            onClose={() => setCaptureOpen(false)}
          />
        ) : (
          <div className="album-import">
            <label className="field">
              <span>Día de la foto</span>
              <select
                value={captureDay}
                onChange={(event) => setCaptureDay(Number(event.target.value) as MissionDay)}
              >
                {MISSION_DAYS.map((day) => {
                  const mission = getMission(day)
                  return (
                    <option key={day} value={day}>
                      Día {day}
                      {mission ? ` — ${mission.title}` : ''}
                    </option>
                  )
                })}
              </select>
            </label>

            <button
              type="button"
              className="button button--primary"
              onClick={() => setCaptureOpen(true)}
            >
              <AssetGlyph asset={getAsset('album.photo')} label={false} />
              Abrir cámara frontal
            </button>
          </div>
        )}

        <p className="adult__footnote">
          Si el permiso, la cámara o el guardado no funcionan, esta pantalla lo avisa y
          puedes seguir usando la importación desde la galería. No se sube ninguna imagen
          a ningún servidor.
        </p>
      </section>

      <section className="adult-section" aria-labelledby="album-import-title">
        <h3 id="album-import-title">Importar desde la galería</h3>
        <p className="adult__footnote">
          Selecciona una o varias fotos o vídeos. Se guardan en el álbum de este
          dispositivo y no se suben a ningún servidor.
        </p>

        <div className="album-import">
          <label className="field">
            <span>Día de la misión</span>
            <select
              value={importDay}
              disabled={importing}
              onChange={(event) => setImportDay(Number(event.target.value) as MissionDay)}
            >
              {MISSION_DAYS.map((day) => {
                const mission = getMission(day)
                return (
                  <option key={day} value={day}>
                    Día {day}
                    {mission ? ` — ${mission.title}` : ''}
                  </option>
                )
              })}
            </select>
          </label>

          <input
            ref={fileInputRef}
            className="album-import__input"
            type="file"
            accept="image/*,video/*"
            multiple
            disabled={importing}
            onChange={handleFileInput}
            aria-label="Elegir fotos o vídeos de la galería"
          />

          <button
            type="button"
            className="button button--primary"
            disabled={importing}
            onClick={() => fileInputRef.current?.click()}
          >
            <AssetGlyph asset={getAsset('album.import')} label={false} />
            {importing ? 'Guardando archivos…' : 'Elegir fotos o vídeos'}
          </button>
        </div>

        <p className="adult__footnote">
          La importación sigue disponible como alternativa si la cámara o el guardado
          fallan. La grabación del día 7 también se puede guardar desde su misión.
        </p>
      </section>

      <section className="adult-section" aria-labelledby="album-export-title">
        <h3 id="album-export-title">Copia de seguridad</h3>
        <p className="adult__footnote">
          La exportación completa crea un ZIP en el propio dispositivo, con una carpeta
          por día. No usa servicios externos. Si el álbum supera el límite de un ZIP
          estándar, la app lo avisará y podrás descargar cada recuerdo por separado.
        </p>

        <div className="adult__actions">
          <button
            type="button"
            className="button button--secondary"
            disabled={entries.length === 0 || exporting || loading}
            onClick={() => void handleExportAll()}
          >
            <AssetGlyph asset={getAsset('album.export')} label={false} />
            {exporting ? 'Preparando ZIP…' : 'Exportar todo en ZIP'}
          </button>
        </div>
      </section>

      <section className="adult-section" aria-labelledby="album-list-title">
        <h3 id="album-list-title">Recuerdos</h3>

        {loading ? (
          <p className="adult__footnote" role="status">
            Cargando álbum…
          </p>
        ) : loadFailed ? (
          <div className="notice notice--warning" role="alert">
            <p>No se pudo abrir el álbum local.</p>
            <button
              type="button"
              className="button button--secondary"
              onClick={() => void handleRetryLoad()}
            >
              Reintentar
            </button>
          </div>
        ) : entries.length === 0 ? (
          <p className="adult__footnote">
            Todavía no hay fotos ni vídeos. Importa archivos desde la galería o guarda la
            grabación del día 7 al terminar el villancico.
          </p>
        ) : (
          <>
            <p className="album-summary">
              {entries.length} recuerdo(s) · {formatByteSize(totalBytes)}
            </p>

            {groups.map((group) => (
              <section
                key={group.day}
                className="album-day"
                aria-labelledby={`album-day-${group.day}`}
              >
                <h4 id={`album-day-${group.day}`}>
                  Día {group.day} · {getMission(group.day)?.title ?? 'Misión'}
                </h4>
                <p className="album-day__meta">
                  {group.entries.length} recuerdo(s) · {formatByteSize(group.byteSize)}
                </p>
                <ul className="album-list">
                  {group.entries.map((media) => (
                    <AlbumMediaCard
                      key={media.id}
                      store={store}
                      media={media}
                      pendingDelete={pendingDeleteId === media.id}
                      onRequestDelete={(selected) => setPendingDeleteId(selected.id)}
                      onCancelDelete={() => setPendingDeleteId(null)}
                      onConfirmDelete={(selected) => void handleConfirmDelete(selected)}
                      onDownload={(selected) => void handleDownload(selected)}
                    />
                  ))}
                </ul>
              </section>
            ))}
          </>
        )}
      </section>
    </section>
  )
}
