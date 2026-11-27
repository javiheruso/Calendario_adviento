import { useEffect, useState } from 'react'
import { getAsset } from '../../domain/assets'
import {
  CUP_PYRAMID_EXTENSION_SECONDS,
  CUP_PYRAMID_ROWS,
  CUP_PYRAMID_TIMER_SECONDS,
  confirmCupPyramid,
  createCupPyramidState,
  cupsInPyramidRow,
  isCupPyramidComplete,
  markPyramidRow,
  nextPyramidRowIndex,
  resetCupPyramid,
} from '../../domain/games/cupPyramid'
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

const CUP_PYRAMID_ANNOUNCEMENT_MILESTONES = [30, 10] as const

/**
 * Day 15: build a 3–2–1 pyramid of six plastic cups while wearing thick socks
 * or mittens. Every row is marked manually, the finished stack needs a family
 * confirmation, and the playful sixty-second timer never blocks success.
 */
export function CupPyramidGame({ onComplete }: MissionGameProps) {
  const [state, setState] = useState(createCupPyramidState)
  const [timer, setTimer] = useState(() => createCountdown(CUP_PYRAMID_TIMER_SECONDS))
  const [timerStarted, setTimerStarted] = useState(false)
  const complete = isCupPyramidComplete(state)
  const nextRow = nextPyramidRowIndex(state)
  const ready = state.phase === 'ready'

  useEffect(() => {
    if (!timer.running) {
      return
    }

    const timerId = window.setTimeout(() => {
      setTimer((current) => tickCountdown(current))
    }, 1000)

    return () => window.clearTimeout(timerId)
  }, [timer])

  function placeNextRow() {
    if (!timerStarted) {
      setTimerStarted(true)
      setTimer((current) => startCountdown(current))
    }

    setState((current) => markPyramidRow(current))
  }

  function restartPyramid() {
    setState((current) => resetCupPyramid(current))
  }

  function addTime() {
    setTimerStarted(true)
    setTimer((current) =>
      startCountdown(extendCountdown(current, CUP_PYRAMID_EXTENSION_SECONDS)),
    )
  }

  function restartTimer() {
    setTimerStarted(true)
    setTimer(startCountdown(createCountdown(CUP_PYRAMID_TIMER_SECONDS)))
  }

  function finishPyramid() {
    setState((current) => confirmCupPyramid(current))
    setTimer((current) => pauseCountdown(current))
  }

  const stackRows = CUP_PYRAMID_ROWS.map((cups, rowIndex) => ({
    cups,
    rowIndex,
  })).reverse()

  return (
    <div className="game game--pyramid">
      <p className="game__lead">
        Ponte unos calcetines o manoplas gordas en las manos. Con seis vasos de
        plástico, construye una pirámide de tres vasos abajo, dos en medio y uno
        arriba. Marca cada fila cuando esté colocada: un adulto puede ayudar y
        repetir las veces que haga falta.
      </p>

      <div className="timer-row">
        <p className="timer-pill" role="timer" aria-label="Tiempo de la pirámide">
          <span className="timer-pill__glyph" aria-hidden="true">
            <AssetGlyph asset={getAsset('game.pyramid.clock')} label={false} />
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
            +{CUP_PYRAMID_EXTENSION_SECONDS} s
          </button>
          <button
            type="button"
            className="button button--secondary"
            onClick={restartTimer}
            disabled={complete}
          >
            Reiniciar {CUP_PYRAMID_TIMER_SECONDS} s
          </button>
        </div>
      </div>

      <CountdownAnnouncer
        seconds={timer.remainingSeconds}
        label="Tiempo de la pirámide"
        milestones={CUP_PYRAMID_ANNOUNCEMENT_MILESTONES}
      />

      <p className="game__status" role="status">
        Filas colocadas: {state.placedRows} de {CUP_PYRAMID_ROWS.length}
      </p>

      {timer.remainingSeconds === 0 && timerStarted && !complete ? (
        <p className="notice notice--warning" role="status">
          ¡Se acabó el tiempo de risas! No pasa nada: pulsa «+
          {CUP_PYRAMID_EXTENSION_SECONDS} s» y sigue con la pirámide.
        </p>
      ) : null}

      <div className="pyramid-stage">
        <p className="pyramid-stage__hands" aria-hidden="true">
          <AssetGlyph asset={getAsset('game.pyramid.mitten')} label={false} />
        </p>
        <ul className="pyramid-stack" aria-label="Pirámide de vasos">
          {stackRows.map(({ cups, rowIndex }) => {
            const placed = rowIndex < state.placedRows
            const isNext = rowIndex === nextRow

            return (
              <li
                key={rowIndex}
                className={`pyramid-row${placed ? ' pyramid-row--placed' : ''}${
                  isNext ? ' pyramid-row--next' : ''
                }`}
                aria-label={`Fila ${rowIndex + 1}: ${cups} vasos${
                  placed ? ', colocada' : isNext ? ', siguiente' : ', pendiente'
                }`}
              >
                {Array.from({ length: cupsInPyramidRow(rowIndex) }, (_, cupIndex) => (
                  <span className="pyramid-cup" key={cupIndex} aria-hidden="true">
                    <AssetGlyph asset={getAsset('game.pyramid.cup')} label={false} />
                  </span>
                ))}
              </li>
            )
          })}
        </ul>
      </div>

      <div className="game__actions">
        {state.phase === 'building' && nextRow !== null ? (
          <button
            type="button"
            className="button button--primary"
            onClick={placeNextRow}
          >
            Colocar la fila de {cupsInPyramidRow(nextRow)} vasos
          </button>
        ) : null}
        <button
          type="button"
          className="button button--secondary"
          onClick={restartPyramid}
          disabled={complete || state.placedRows === 0}
        >
          Empezar la pirámide de nuevo
        </button>
      </div>

      {ready ? (
        <div className="notice" role="status">
          <p>
            <strong>¡La pirámide está terminada!</strong> Un adulto puede revisar
            que tenga tres vasos abajo, dos en medio y uno arriba.
          </p>
          <button
            type="button"
            className="button button--primary"
            onClick={finishPyramid}
          >
            Confirmar la pirámide
          </button>
        </div>
      ) : null}

      {complete ? (
        <div className="game__complete" role="status">
          <p>
            <strong>¡Manos de duende conseguidas!</strong> El tiempo era solo para
            las risas y no influye en tu éxito.
          </p>
          <button type="button" className="button button--primary" onClick={onComplete}>
            Continuar
          </button>
        </div>
      ) : null}
    </div>
  )
}
