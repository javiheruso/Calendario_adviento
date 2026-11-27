import { useState, type FormEvent } from 'react'
import { PIN_MAX_LENGTH, PIN_MIN_LENGTH, isValidPinFormat } from '../security/pin'

interface AdultGateProps {
  hasPin: boolean
  busy: boolean
  error: string | null
  onBack: () => void
  onSetupPin: (pin: string, confirmation: string) => void
  onUnlock: (pin: string) => void
}

function digitsOnly(value: string): string {
  return value.replace(/\D/g, '').slice(0, PIN_MAX_LENGTH)
}

export function AdultGate({
  hasPin,
  busy,
  error,
  onBack,
  onSetupPin,
  onUnlock,
}: AdultGateProps) {
  const [pin, setPin] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [localError, setLocalError] = useState<string | null>(null)

  const message = localError ?? error

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLocalError(null)

    if (!isValidPinFormat(pin)) {
      setLocalError(`El PIN debe tener entre ${PIN_MIN_LENGTH} y ${PIN_MAX_LENGTH} dígitos.`)
      return
    }

    if (!hasPin && pin !== confirmation) {
      setLocalError('Los dos PIN no coinciden.')
      return
    }

    if (hasPin) {
      onUnlock(pin)
    } else {
      onSetupPin(pin, confirmation)
    }
  }

  return (
    <section className="adult" aria-labelledby="adult-gate-title">
      <button type="button" className="link-button" onClick={onBack}>
        <span aria-hidden="true">←</span> Volver al calendario
      </button>

      <header>
        <p className="adult__eyebrow">Zona de adultos</p>
        <h2 id="adult-gate-title" tabIndex={-1}>
          {hasPin ? 'Introduce el PIN familiar' : 'Configura el PIN familiar'}
        </h2>
        <p className="adult__lead">
          El panel familiar permite editar pistas, escondites y desbloqueos. El PIN es una
          barrera doméstica, no seguridad criptográfica, y se guarda solo en este
          dispositivo.
        </p>
      </header>

      <form className="adult-form" onSubmit={handleSubmit}>
        <label className="field">
          <span>{hasPin ? 'PIN' : 'Nuevo PIN (4 a 8 dígitos)'}</span>
          <input
            type="password"
            inputMode="numeric"
            autoComplete="off"
            pattern="[0-9]*"
            maxLength={PIN_MAX_LENGTH}
            value={pin}
            onChange={(event) => {
              setPin(digitsOnly(event.target.value))
              setLocalError(null)
            }}
            required
            autoFocus
          />
        </label>

        {hasPin ? null : (
          <label className="field">
            <span>Repite el PIN</span>
            <input
              type="password"
              inputMode="numeric"
              autoComplete="off"
              pattern="[0-9]*"
              maxLength={PIN_MAX_LENGTH}
              value={confirmation}
              onChange={(event) => {
                setConfirmation(digitsOnly(event.target.value))
                setLocalError(null)
              }}
              required
            />
          </label>
        )}

        {message ? (
          <p className="notice notice--warning" role="alert">
            {message}
          </p>
        ) : null}

        <button type="submit" className="button button--primary" disabled={busy}>
          {busy ? 'Comprobando…' : hasPin ? 'Entrar' : 'Guardar PIN y entrar'}
        </button>
      </form>

      {hasPin ? null : (
        <p className="adult__footnote">
          Si el navegador no puede guardar el PIN, la app te lo dirá y no dará el
          guardado por hecho.
        </p>
      )}
    </section>
  )
}
