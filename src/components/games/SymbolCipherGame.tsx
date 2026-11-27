import { useState } from 'react'
import {
  CIPHER_WORDS,
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
import type { MissionGameProps } from './types'

const KEYBOARD_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

/**
 * Day 22: use the fixed thirteen-symbol alphabet to decipher RENO, MAGIA and
 * REGALO with the built-in keyboard. Wrong letters are only feedback and the
 * table stays visible as a parchment reference.
 */
export function SymbolCipherGame({ onComplete }: MissionGameProps) {
  const [game] = useState(() => createCipherGame(CIPHER_WORDS))
  const [state, setState] = useState<SymbolCipherState>(() => createCipherState(game))
  const [feedback, setFeedback] = useState<string | null>(null)
  const round = currentCipherRound(game, state)
  const complete = state.complete
  const locked = complete || state.lastResult === 'correct'

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
      setFeedback('¡Palabra descifrada! Sigue con la siguiente.')
    }
  }

  function nextWord() {
    setState((current) => advanceCipherRound(game, current))
    setFeedback(null)
  }

  return (
    <div className="game game--cipher">
      <p className="game__lead">
        Este es el alfabeto secreto de los duendes. Usa el teclado para escribir cada
        palabra y comprobar la traducción. La tabla se queda a la vista y no hay tiempo ni
        penalizaciones.
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
                disabled={locked || (round ? state.input.length >= round.word.length : true)}
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

          {state.lastResult === 'correct' ? (
            <div className="game__complete" role="status">
              <p>
                <strong>¡{round.word} está descifrada!</strong>
              </p>
              <button type="button" className="button button--primary" onClick={nextWord}>
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
            <strong>¡Has descifrado RENO, MAGIA y REGALO!</strong>
          </p>
          <button type="button" className="button button--primary" onClick={onComplete}>
            Continuar
          </button>
        </div>
      ) : null}
    </div>
  )
}
