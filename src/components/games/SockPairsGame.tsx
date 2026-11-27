import { useEffect, useState } from 'react'
import { getAsset, type AssetId } from '../../domain/assets'
import {
  SOCK_EXTENSION_SECONDS,
  SOCK_PAIRS,
  SOCK_TIMER_SECONDS,
  createSockState,
  isSockComplete,
  matchedSockPairs,
  resolveSockMismatch,
  selectSock,
} from '../../domain/games/sockPairs'
import {
  createCountdown,
  extendCountdown,
  formatCountdown,
  pauseCountdown,
  startCountdown,
  tickCountdown,
} from '../../domain/games/timer'
import { AssetGlyph } from '../AssetGlyph'
import { CountdownAnnouncer } from '../CountdownAnnouncer'
import type { MissionGameProps } from './types'

interface SockMeta {
  readonly asset: AssetId
  readonly tone: string
  readonly label: string
}

const SOCK_META: readonly SockMeta[] = [
  { asset: 'game.sock.red', tone: 'red', label: 'Calcetín rojo' },
  { asset: 'game.sock.green', tone: 'green', label: 'Calcetín verde' },
  { asset: 'game.sock.blue', tone: 'blue', label: 'Calcetín azul' },
  { asset: 'game.sock.yellow', tone: 'yellow', label: 'Calcetín amarillo' },
  { asset: 'game.sock.purple', tone: 'purple', label: 'Calcetín morado' },
]

const SOCK_ANNOUNCEMENT_MILESTONES = [30, 10] as const

/**
 * Day 9: match five sock pairs. The sixty-second countdown is playful only:
 * reaching zero never ends the game, and extra time can be added or restarted.
 */
export function SockPairsGame({ onComplete }: MissionGameProps) {
  const [state, setState] = useState(() => createSockState())
  const [timer, setTimer] = useState(() => createCountdown(SOCK_TIMER_SECONDS))
  const [timerStarted, setTimerStarted] = useState(false)
  const matched = matchedSockPairs(state)
  const complete = isSockComplete(state)

  useEffect(() => {
    if (!state.hasMismatch) {
      return
    }

    const timerId = window.setTimeout(() => {
      setState((current) => resolveSockMismatch(current))
    }, 800)

    return () => window.clearTimeout(timerId)
  }, [state.hasMismatch])

  useEffect(() => {
    if (!timer.running) {
      return
    }

    const timerId = window.setTimeout(() => {
      setTimer((current) => tickCountdown(current))
    }, 1000)

    return () => window.clearTimeout(timerId)
  }, [timer])

  function chooseSock(sockId: number) {
    if (!timerStarted) {
      setTimerStarted(true)
      setTimer((current) => startCountdown(current))
    }

    const next = selectSock(state, sockId)
    setState(next)

    if (isSockComplete(next)) {
      setTimer((current) => pauseCountdown(current))
    }
  }

  function addTime() {
    setTimerStarted(true)
    setTimer((current) => startCountdown(extendCountdown(current, SOCK_EXTENSION_SECONDS)))
  }

  function restartTimer() {
    setTimerStarted(true)
    setTimer(startCountdown(createCountdown(SOCK_TIMER_SECONDS)))
  }

  return (
    <div className="game game--socks">
      <p className="game__lead">
        Un adulto mezcla cinco pares de calcetines. Encuentra las parejas tocando dos
        calcetines. El cronómetro es solo para las risas: si llega a cero puedes seguir
        jugando, añadir treinta segundos o volver a empezar. No hay castigos.
      </p>

      <div className="timer-row">
        <p className="timer-pill" role="timer" aria-label="Tiempo de calcetines">
          <span className="timer-pill__glyph" aria-hidden="true">
            <AssetGlyph asset={getAsset('game.sock.clock')} label={false} />
          </span>
          {formatCountdown(timer.remainingSeconds)}
        </p>
        <div className="timer-actions">
          <button
            type="button"
            className="button button--secondary"
            onClick={addTime}
            disabled={complete}
          >
            +{SOCK_EXTENSION_SECONDS} s
          </button>
          <button
            type="button"
            className="button button--secondary"
            onClick={restartTimer}
            disabled={complete}
          >
            Reiniciar {SOCK_TIMER_SECONDS} s
          </button>
        </div>
      </div>

      <CountdownAnnouncer
        seconds={timer.remainingSeconds}
        label="Tiempo de calcetines"
        milestones={SOCK_ANNOUNCEMENT_MILESTONES}
      />

      <p className="game__status" role="status">
        Parejas encontradas: {matched} de {SOCK_PAIRS}
      </p>

      {timer.remainingSeconds === 0 && timerStarted && !complete ? (
        <p className="notice notice--warning" role="status">
          ¡Se acabó el tiempo de risas! No pasa nada: pulsa «+{SOCK_EXTENSION_SECONDS} s»
          y sigue emparejando.
        </p>
      ) : null}

      <ul className="sock-grid" aria-label="Calcetines que hay que emparejar">
        {state.socks.map((sock) => {
          const meta = SOCK_META[sock.pairId] ?? SOCK_META[0]
          const faceUp = sock.selected || sock.matched

          return (
            <li key={sock.id}>
              <button
                type="button"
                className={`sock-card sock-card--${meta.tone}${
                  sock.selected ? ' sock-card--selected' : ''
                }${sock.matched ? ' sock-card--matched' : ''}`}
                onClick={() => chooseSock(sock.id)}
                disabled={sock.matched}
                aria-pressed={faceUp}
                aria-label={faceUp ? meta.label : 'Calcetín boca abajo'}
              >
                <span className="sock-card__glyph" aria-hidden="true">
                  {faceUp ? (
                    <AssetGlyph asset={getAsset(meta.asset)} label={false} />
                  ) : (
                    <AssetGlyph asset={getAsset('game.memory.back')} label={false} />
                  )}
                </span>
              </button>
            </li>
          )
        })}
      </ul>

      {complete ? (
        <div className="game__complete" role="status">
          <p>
            <strong>¡Cinco parejas encontradas!</strong> El cronómetro se detiene y no
            influye en tu éxito.
          </p>
          <button type="button" className="button button--primary" onClick={onComplete}>
            Continuar
          </button>
        </div>
      ) : null}
    </div>
  )
}
