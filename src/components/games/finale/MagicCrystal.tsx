import { useState } from 'react'
import {
  FINAL_MAGIC_PHRASE,
  FINAL_MAGIC_WORDS,
  advanceMagicWord,
  clearMagicInput,
  confirmMagicPronunciation,
  createFinalMagicState,
  currentMagicRound,
  deleteMagicLetter,
  isMagicComplete,
  isMagicWordsComplete,
  submitMagicWord,
  typeMagicLetter,
} from '../../../domain/games/finalMagic'
import { symbolsForWord } from '../../../domain/games/symbolCipher'
import { CipherAlphabetReference, CipherSymbol } from '../cipherSymbols'
import type { CrystalProps } from './types'

const KEYBOARD_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

const PHRASE_WORDS = FINAL_MAGIC_WORDS.map((word) => ({
  word,
  symbols: symbolsForWord(word),
}))

/**
 * Day 24 magic crystal: decipher LUZ, Y and MAGIA with the fixed day 22
 * alphabet, then pronounce the phrase aloud. Pronunciation is confirmed
 * manually; no microphone or automatic recognition is involved.
 */
export function MagicCrystal({ onSolved }: CrystalProps) {
  const [state, setState] = useState(createFinalMagicState)
  const [feedback, setFeedback] = useState<string | null>(null)
  const round = currentMagicRound(state)
  const wordsComplete = isMagicWordsComplete(state)
  const complete = isMagicComplete(state)
  const locked = wordsComplete || state.cipher.lastResult === 'correct'

  function addLetter(letter: string) {
    setState((current) => typeMagicLetter(current, letter))
    setFeedback(null)
  }

  function removeLetter() {
    setState((current) => deleteMagicLetter(current))
    setFeedback(null)
  }

  function clearInput() {
    setState((current) => clearMagicInput(current))
    setFeedback(null)
  }

  function checkWord() {
    const outcome = submitMagicWord(state)
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
    setState((current) => advanceMagicWord(current))
    setFeedback(
      state.cipher.roundIndex + 1 >= FINAL_MAGIC_WORDS.length
        ? '¡Las tres palabras están listas! Ahora pronuncia el conjuro en voz alta.'
        : null,
    )
  }

  function pronounce() {
    setState((current) => confirmMagicPronunciation(current))
    setFeedback('¡Conjuro pronunciado! El cristal de la magia está brillando.')
  }

  return (
    <section className="finale-crystal-game" aria-labelledby="final-magic-title">
      <h3 id="final-magic-title">Cristal de la magia</h3>
      <p className="game__lead">
        Usa el alfabeto secreto del día 22 para descifrar LUZ, Y y MAGIA. Después
        pronuncia el conjuro en voz alta. No hay micrófono ni reconocimiento
        automático: tú misma confirmas que lo has dicho.
      </p>

      <CipherAlphabetReference titleId="final-alphabet-title" />

      {!wordsComplete && round ? (
        <>
          <p className="game__status" role="status">
            Palabra {state.cipher.roundIndex + 1} de {FINAL_MAGIC_WORDS.length} ·
            Resueltas: {state.cipher.solvedRounds}
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
                {state.cipher.input[index] ?? '·'}
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
                disabled={locked || state.cipher.input.length >= round.word.length}
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
              disabled={locked || state.cipher.input.length === 0}
            >
              Borrar letra
            </button>
            <button
              type="button"
              className="button button--secondary"
              onClick={clearInput}
              disabled={locked || state.cipher.input.length === 0}
            >
              Borrar todo
            </button>
            <button
              type="button"
              className="button button--primary"
              onClick={checkWord}
              disabled={locked || state.cipher.input.length === 0}
            >
              Comprobar
            </button>
          </div>

          {state.cipher.lastResult === 'correct' ? (
            <div className="game__complete" role="status">
              <p>
                <strong>¡{round.word} está descifrada!</strong>
              </p>
              <button type="button" className="button button--primary" onClick={nextWord}>
                {state.cipher.roundIndex + 1 >= FINAL_MAGIC_WORDS.length
                  ? 'Terminar el conjuro'
                  : 'Siguiente palabra'}
              </button>
            </div>
          ) : null}
        </>
      ) : null}

      {wordsComplete && !complete ? (
        <section className="finale-pronunciation" aria-labelledby="final-pronounce-title">
          <h3 id="final-pronounce-title">El conjuro está escrito</h3>
          <div
            className="cipher-word"
            role="group"
            aria-label="Símbolos del conjuro LUZ Y MAGIA"
          >
            {PHRASE_WORDS.map(({ word, symbols }) => (
              <span className="finale-pronunciation__word" key={word}>
                {symbols.map((symbol, index) => (
                  <span className="cipher-word__symbol" key={`${word}-${index}`}>
                    <CipherSymbol id={symbol} />
                  </span>
                ))}
              </span>
            ))}
          </div>
          <p className="game__hint">
            Ahora di el conjuro en voz alta, despacio y con magia: <strong>{FINAL_MAGIC_PHRASE}</strong>.
            Cuando lo hayas pronunciado, toca el botón. No se graba ni se escucha nada.
          </p>
          <button type="button" className="button button--primary" onClick={pronounce}>
            Ya lo he pronunciado
          </button>
        </section>
      ) : null}

      {feedback ? (
        <p className="game__hint" role="status">
          {feedback}
        </p>
      ) : null}

      {complete ? (
        <div className="game__complete" role="status">
          <p>
            <strong>¡Cristal de la magia encendido!</strong> El conjuro{' '}
            {FINAL_MAGIC_PHRASE} ha funcionado.
          </p>
          <button type="button" className="button button--primary" onClick={onSolved}>
            Encender los tres cristales
          </button>
        </div>
      ) : null}
    </section>
  )
}
