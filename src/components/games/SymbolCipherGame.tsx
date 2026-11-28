import { useEffect, useRef, useState } from 'react'
import {
  advanceCipherRound,
  clearCipherInput,
  createCipherGame,
  createCipherState,
  currentCipherRound,
  deleteCipherLetter,
  submitCipherWord,
  typeCipherLetter,
  type SymbolCipherState,
} from '../../domain/games/symbolCipher'
import { CipherAlphabetReference, CipherSymbol } from './cipherSymbols'
import { useAutoAdvance } from '../useAutoAdvance'
import type { MissionGameProps } from './types'

const KEYBOARD_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
const AUTO_ADVANCE_MS = 1500

/**
 * Day 22: use the fixed fourteen-symbol alphabet to decipher LUNA, TRINEO and
 * ESTRELLA. The intro never lists the answers. A wrong answer is only feedback,
 * and a correct word auto-advances after a short pause; the manual button uses
 * the same one-shot guard so the round can never advance twice.
 */
export function SymbolCipherGame({ onComplete }: MissionGameProps) {
  const [game] = useState(() => createCipherGame())
  const [state, setState] = useState<SymbolCipherState>(() => createCipherState(game))
  const [feedback, setFeedback] = useState<string | null>(null)
  const advancingRef = useRef(false)
  const round = currentCipherRound(game, state)
  const complete = state.complete
  const correct = state.lastResult === 'correct'
  const locked = complete || correct

  useEffect(() => {
    advancingRef.current = false
  }, [state.roundIndex])

  function addLetter(letter: string) {
    setState((current) => typeCipherLetter(current, game, letter))
    setFeedback(null)
  }

  function removeLetter() {
    setState((current) => deleteCipherLetter(current))
    setFeedback(null)
  }

  function clearInput() {
    setState((current) => clearCipherInput(current))
    setFeedback(null)
  }

  function checkWord() {
    const outcome = submitCipherWord(game, state)
    setState(outcome.state)

    if (outcome.result === 'incomplete') {
      setFeedback('Todavía faltan letras. Completa la palabra y vuelve a comprobar.')
      return
    }

    if (outcome.result === 'wrong') {
      setFeedback('Esa palabra no es. Puedes borrar letras y probar de nuevo.')
      return
    }

    if (outcome.result === 'correct') {
      setFeedback('¡Palabra descifrada! Siguiente palabra en un momento…')
    }
  }

  function advanceOnce() {
    if (advancingRef.current) {
      return
    }

    advancingRef.current = true

    if (state.roundIndex + 1 >= game.rounds.length) {
      onComplete()
      return
    }

    setState((current) => advanceCipherRound(game, current))
    setFeedback(null)
  }

  useAutoAdvance(correct, AUTO_ADVANCE_MS, advanceOnce)

  return (
    <div className="game game--cipher">
      <p className="game__lead">
        Este es el alfabeto secreto de los duendes. Usa el teclado para escribir cada
        palabra secreta y comprobar la traducción. La tabla se queda a la vista y no hay
        tiempo ni penalizaciones.
      </p>

      <CipherAlphabetReference titleId="cipher-alphabet-title" />

      {!complete && round ? (
        <>
          <p className="game__status" role="status">
            Palabra {state.roundIndex + 1} de {game.rounds.length} · Resueltas:{' '}
            {state.solvedRounds}
          </p>

          <div
            className="cipher-word"
            role="group"
            aria-label="Símbolos de la palabra secreta"
          >
            {round.symbols.map((symbol, index) => (
              <span className="cipher-word__symbol" key={`${round.word}-${index}`}>
                <CipherSymbol id={symbol} />
              </span>
            ))}
          </div>

          <div className="cipher-input" role="group" aria-label="Traducción escrita">
            {round.word.split('').map((_, index) => (
              <span className="cipher-input__slot" key={index}>
                {state.input[index] ?? '·'}
              </span>
            ))}
          </div>

          <div className="cipher-keyboard" role="group" aria-label="Teclado de letras">
            {KEYBOARD_LETTERS.map((letter) => (
              <button
                key={letter}
                type="button"
                className="cipher-key"
                onClick={() => addLetter(letter)}
                disabled={locked || state.input.length >= round.word.length}
              >
                {letter}
              </button>
            ))}
          </div>

          <div className="game__actions">
            <button
              type="button"
              className="button button--secondary"
              onClick={removeLetter}
              disabled={locked || state.input.length === 0}
            >
              Borrar letra
            </button>
            <button
              type="button"
              className="button button--secondary"
              onClick={clearInput}
              disabled={locked || state.input.length === 0}
            >
              Borrar todo
            </button>
            <button
              type="button"
              className="button button--primary"
              onClick={checkWord}
              disabled={locked || state.input.length === 0}
            >
              Comprobar
            </button>
          </div>

          {correct ? (
            <div className="game__complete" role="status">
              <p>
                <strong>¡{round.word} está descifrada!</strong>
              </p>
              <button type="button" className="button button--primary" onClick={advanceOnce}>
                {state.roundIndex + 1 >= game.rounds.length
                  ? 'Terminar'
                  : 'Siguiente palabra'}
              </button>
            </div>
          ) : null}
        </>
      ) : null}

      {feedback ? (
        <p className="game__hint" role="status">
          {feedback}
        </p>
      ) : null}

      {complete ? (
        <div className="game__complete" role="status">
          <p>
            <strong>¡Has descifrado las tres palabras secretas!</strong>
          </p>
          <button type="button" className="button button--primary" onClick={onComplete}>
            Continuar
          </button>
        </div>
      ) : null}
    </div>
  )
}
