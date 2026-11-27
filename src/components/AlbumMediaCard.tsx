import { useEffect, useState } from 'react'
import { formatByteSize, type AlbumMediaMetadata } from '../domain/album'
import { getAsset } from '../domain/assets'
import { AlbumStorageError } from '../storage/albumDb'
import type { AlbumStore } from '../storage/albumStore'
import { albumErrorMessage, albumSourceLabel } from './albumMessages'
import { AssetGlyph } from './AssetGlyph'

const DATE_FORMATTER = new Intl.DateTimeFormat('es-ES', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

function formatTimestamp(iso: string): string {
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? iso : DATE_FORMATTER.format(date)
}

interface AlbumMediaPreviewProps {
  store: AlbumStore
  media: AlbumMediaMetadata
}

/** Loads the blob only when the parent opens the preview, then revokes it. */
function AlbumMediaPreview({ store, media }: AlbumMediaPreviewProps) {
  const [url, setUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    let objectUrl: string | null = null

    async function load() {
      try {
        const blob = await store.getBlob(media.id)

        if (!active) {
          return
        }

        if (!blob) {
          setError(albumErrorMessage(new AlbumStorageError('not-found', 'missing blob')))
          return
        }

        objectUrl = URL.createObjectURL(blob)
        setUrl(objectUrl)
      } catch (loadError) {
        if (active) {
          setError(albumErrorMessage(loadError))
        }
      }
    }

    void load()

    return () => {
      active = false
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl)
      }
    }
  }, [store, media.id])

  if (error) {
    return (
      <p className="notice notice--warning" role="status">
        {error}
      </p>
    )
  }

  if (!url) {
    return (
      <p className="album-card__loading" role="status">
        Cargando vista previa…
      </p>
    )
  }

  if (media.kind === 'photo') {
    return (
      <img
        className="album-preview"
        src={url}
        alt={`Recuerdo del día ${media.day}: ${media.fileName}`}
      />
    )
  }

  return (
    <video
      className="album-preview"
      src={url}
      controls
      playsInline
      preload="metadata"
      aria-label={`Recuerdo del día ${media.day}: ${media.fileName}`}
    />
  )
}

interface AlbumMediaCardProps {
  store: AlbumStore
  media: AlbumMediaMetadata
  pendingDelete: boolean
  onRequestDelete: (media: AlbumMediaMetadata) => void
  onCancelDelete: () => void
  onConfirmDelete: (media: AlbumMediaMetadata) => void
  onDownload: (media: AlbumMediaMetadata) => void
}

export function AlbumMediaCard({
  store,
  media,
  pendingDelete,
  onRequestDelete,
  onCancelDelete,
  onConfirmDelete,
  onDownload,
}: AlbumMediaCardProps) {
  const [previewOpen, setPreviewOpen] = useState(false)

  return (
    <li className="album-card">
      <div className="album-card__main">
        <span className="album-card__glyph" aria-hidden="true">
          <AssetGlyph
            asset={getAsset(media.kind === 'photo' ? 'album.photo' : 'album.video')}
            label={false}
          />
        </span>
        <div className="album-card__details">
          <p className="album-card__name">{media.fileName}</p>
          <p className="album-card__meta">
            {media.kind === 'photo' ? 'Foto' : 'Vídeo'} · {formatByteSize(media.byteSize)} ·{' '}
            {formatTimestamp(media.createdAt)}
          </p>
          <p className="album-card__source">{albumSourceLabel(media.source)}</p>
        </div>
      </div>

      {pendingDelete ? (
        <div className="album-card__confirm" role="alert">
          <p>
            ¿Borrar este recuerdo? Se eliminará de este dispositivo y no se puede
            deshacer.
          </p>
          <div className="album-card__actions">
            <button
              type="button"
              className="button button--danger"
              onClick={() => onConfirmDelete(media)}
            >
              Sí, borrar
            </button>
            <button
              type="button"
              className="button button--secondary"
              onClick={onCancelDelete}
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <div className="album-card__actions">
          <button
            type="button"
            className="button button--secondary"
            aria-expanded={previewOpen}
            onClick={() => setPreviewOpen((open) => !open)}
          >
            {previewOpen ? 'Ocultar' : 'Ver'}
          </button>
          <button
            type="button"
            className="button button--secondary"
            onClick={() => onDownload(media)}
          >
            Descargar
          </button>
          <button
            type="button"
            className="button button--danger"
            onClick={() => onRequestDelete(media)}
          >
            Borrar
          </button>
        </div>
      )}

      {!pendingDelete && previewOpen ? (
        <AlbumMediaPreview store={store} media={media} />
      ) : null}
    </li>
  )
}
