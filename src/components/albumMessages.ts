/**
 * User-facing Spanish copy for album failures. Errors keep stable codes in the
 * domain/storage layers; this module is the only place that turns them into
 * wording a family can act on.
 */

export function albumErrorCode(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = (error as { code?: unknown }).code
    if (typeof code === 'string') {
      return code
    }
  }

  return 'unknown'
}

export function captureErrorMessage(code: string): string {
  switch (code) {
    case 'not-ready':
      return 'La cámara todavía no tiene imagen. Espera un momento e inténtalo de nuevo.'
    case 'no-canvas':
      return 'Este navegador no ha podido preparar la foto. Puedes reintentar o importar una imagen desde la galería.'
    case 'draw-failed':
      return 'No se pudo copiar la imagen de la cámara. Vuelve a intentarlo; la cámara sigue disponible.'
    case 'blob-failed':
      return 'No se pudo crear el archivo de la foto. Reintenta la captura o usa la importación desde la galería.'
    case 'empty-blob':
      return 'La foto salió vacía y no se puede guardar. Reintenta la captura.'
    default:
      return 'No se pudo capturar la foto. Reintenta o usa la importación desde la galería.'
  }
}

export function albumSourceLabel(source: string): string {
  switch (source) {
    case 'recording':
      return 'Grabación guardada desde una misión'
    case 'capture':
      return 'Foto hecha con la cámara en este dispositivo'
    default:
      return 'Importado desde la galería'
  }
}

export function albumErrorMessage(error: unknown): string {
  switch (albumErrorCode(error)) {
    case 'quota':
      return 'No queda espacio suficiente en este dispositivo. Exporta el álbum y borra recuerdos antes de intentarlo de nuevo.'
    case 'unavailable':
      return 'Este navegador no permite guardar el álbum local. Prueba con otro navegador o comprueba que la app se abre por HTTPS o en localhost.'
    case 'blocked':
      return 'El navegador ha bloqueado el almacenamiento local del álbum. Revisa los permisos del sitio o el modo privado.'
    case 'not-found':
      return 'No se encontró el archivo en el álbum. Puede que se haya borrado o que el almacenamiento esté incompleto.'
    case 'transaction':
      return 'No se pudo completar la operación con el almacenamiento local del álbum. Inténtalo de nuevo.'
    case 'unsupported-type':
      return 'Solo se pueden guardar fotos y vídeos compatibles.'
    case 'invalid-size':
      return 'El archivo está vacío y no se puede guardar.'
    case 'invalid-day':
      return 'El día del recuerdo no es válido.'
    case 'invalid-date':
      return 'La fecha del recuerdo no es válida.'
    case 'invalid-id':
      return 'No se pudo crear un identificador para el recuerdo.'
    case 'empty-album':
      return 'Todavía no hay recuerdos para exportar.'
    case 'too-many-files':
      return 'Hay demasiados archivos para un único ZIP sin compresión. Descarga los recuerdos uno a uno.'
    case 'too-large':
      return 'El álbum supera el tamaño máximo de un ZIP estándar. Descarga los recuerdos uno a uno.'
    default:
      return 'No se pudo completar la operación con el álbum. Inténtalo de nuevo.'
  }
}
